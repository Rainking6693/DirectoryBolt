/* netlify-background: true */

// Netlify Background Function: processes a job asynchronously with Playwright
// This function is triggered by trigger-job-processing.js and returns 202 immediately
// while processing continues in the background.

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

let playwright;
const path = require('path');

function getEnv(name, fallback = undefined) {
  return process.env[name] || fallback;
}

function buildOrchestratorHeaders() {
  const token = getEnv('AUTOBOLT_API_KEY') || getEnv('WORKER_AUTH_TOKEN');
  return token
    ? {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Netlify-Background/1.0.0',
      }
    : {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Netlify-Background/1.0.0',
      };
}

async function updateProgressViaAPI({ jobId, directoryResults, status, errorMessage }) {
  try {
    const base = getEnv('ORCHESTRATOR_URL');
    const headers = buildOrchestratorHeaders();
    if (!base || !headers.Authorization) {
      return { ok: false, note: 'Missing ORCHESTRATOR_URL or AUTOBOLT_API_KEY' };
    }

    const resp = await axios.post(
      `${base.replace(/\/$/, '')}/jobs/update`,
      { jobId, directoryResults, status, errorMessage },
      { headers, timeout: 15000 },
    );
    return { ok: true, data: resp.data };
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

async function processJob(job) {
  const supabaseUrl = getEnv('SUPABASE_URL') || getEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_KEY');
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  const jobId = job?.jobId || job?.id;
  const customerId = job?.customerId || job?.customer_id;

  console.log('[process-job-background] start', { jobId, customerId });

  // Mark queued -> processing in Supabase (best-effort)
  try {
    if (supabase && jobId) {
      await supabase.from('jobs').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', jobId);
    }
  } catch (e) {
    console.warn('[process-job-background] supabase status update failed', e?.message || e);
  }

  // Update orchestrator progress (best-effort)
  await updateProgressViaAPI({ jobId, status: 'in_progress' });

  // Use full worker orchestration to process all directories
  const workerPath = path.resolve(process.cwd(), 'worker', 'worker.js');
  let WorkerCtor;
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    WorkerCtor = require(workerPath);
  } catch (e) {
    console.error('[process-job-background] Failed to require worker.js', workerPath, e?.message || e);
    throw e;
  }

  const worker = new WorkerCtor();
  try {
    await worker.initialize();
    // If jobId provided, prefer fetching exact job; else fetch next
    let payload = job;
    try {
      const base = getEnv('ORCHESTRATOR_URL');
      const headers = buildOrchestratorHeaders();
      if (!base || !headers.Authorization) throw new Error('Missing ORCHESTRATOR_URL or AUTOBOLT_API_KEY');

      if (jobId) {
        const resp = await axios.get(`${base.replace(/\/$/, '')}/jobs/${encodeURIComponent(jobId)}`, { headers, timeout: 15000 });
        payload = resp.data?.data || payload || null;
        console.log('[process-job-background] fetched specific job', { ok: !!payload, jobId: payload?.jobId || payload?.id });
      }

      if (!payload || !payload.businessData) {
        const resp = await axios.get(`${base.replace(/\/$/, '')}/jobs/next`, { headers, timeout: 15000 });
        payload = resp.data?.data || payload || null;
        console.log('[process-job-background] fetched next job', { ok: !!payload, jobId: payload?.jobId || payload?.id });
      }
    } catch (e) {
      console.warn('[process-job-background] job fetch failed', e?.message || e);
    }

    if (!payload) {
      console.log('[process-job-background] no job payload to process');
      return;
    }

    await worker.processJob(payload);
    console.log('[process-job-background] worker process complete');
  } finally {
    try { await worker.shutdown(); } catch {}
  }

  // Finalize job (best-effort if worker already completed)
  try {
    if (supabase && jobId) {
      await supabase.from('jobs').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', jobId);
    }
  } catch (e) {
    console.warn('[process-job-background] supabase finalize failed', e?.message || e);
  }

  await updateProgressViaAPI({ jobId, status: 'completed' });
  console.log('[process-job-background] complete', { jobId });
}

exports.handler = async (event, context) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    console.log('[process-job-background] received', { length: event.body?.length, keys: Object.keys(body || {}) });

    const { jobId, customerId } = body;
    if (!jobId) {
      console.error('[process-job-background] missing jobId');
      return { statusCode: 400, body: JSON.stringify({ success: false, error: 'jobId required' }) };
    }

    // Spawn async work; background function runs up to ~15 minutes
    await processJob({ jobId, customerId });

    // Background functions typically respond 202 when accepted
    return { statusCode: 202, body: JSON.stringify({ success: true, message: 'Job accepted for background processing' }) };
  } catch (e) {
    console.error('[process-job-background] fatal', e?.message || e);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: e?.message || 'Internal Error' }) };
  }
};