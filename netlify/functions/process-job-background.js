/* netlify-background: true */

// Netlify Background Function: processes a job asynchronously with Playwright
// This function is triggered by trigger-job-processing.js and returns 202 immediately
// while processing continues in the background.

const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

let playwright;
const path = require('path');
const fs = require('fs');

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
  // Fix: Use __dirname and __filename for proper path resolution in Netlify environment
  const workerPath = path.resolve(__dirname, '..', '..', 'worker', 'worker.js');

  // Ensure worker directory and files exist
  try {
    const workerDir = path.resolve(__dirname, '..', '..', 'worker');
    if (!fs.existsSync(workerDir)) {
      console.error('[process-job-background] Worker directory does not exist at:', workerDir);
      throw new Error('Worker directory not found');
    }
    if (!fs.existsSync(workerPath)) {
      console.error('[process-job-background] Worker.js file does not exist at:', workerPath);
      console.error('[process-job-background] Available files in worker directory:', fs.readdirSync(workerDir));
      throw new Error('Worker.js file not found');
    }
    console.log('[process-job-background] File system checks passed');
  } catch (e) {
    console.error('[process-job-background] File system check failed:', e?.message);
    throw e;
  }
  console.log('[process-job-background] Attempting to load worker from:', workerPath);
  console.log('[process-job-background] Current __dirname:', __dirname);
  console.log('[process-job-background] Current process.cwd():', process.cwd());

  // Additional fallback paths for Netlify environment
  const fallbackPaths = [
    workerPath,
    path.resolve(__dirname, '..', 'worker', 'worker.js'),
    path.resolve(process.cwd(), 'worker', 'worker.js'),
    './worker/worker.js'
  ];

  let WorkerCtor;
  let loadedPath = null;

  for (const testPath of fallbackPaths) {
    try {
      console.log('[process-job-background] Trying path:', testPath);
      WorkerCtor = require(testPath);
      loadedPath = testPath;
      console.log('[process-job-background] Successfully loaded worker from:', testPath);
      break;
    } catch (e) {
      console.warn('[process-job-background] Failed to load from:', testPath, e?.message);
      continue;
    }
  }

  if (!WorkerCtor) {
    console.error('[process-job-background] Could not load worker from any path');
    console.error('[process-job-background] Available files in netlify/functions:', fs.readdirSync(__dirname));
    console.error('[process-job-background] Available files in project root:', require('fs').readdirSync(path.resolve(__dirname, '..', '..')));
    throw new Error('Could not locate worker.js file');
  }

  const worker = new WorkerCtor();
  console.log('[process-job-background] Worker instance created, initializing...');
  try {
    await worker.initialize();
    console.log('[process-job-background] Worker initialized successfully');
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

     console.log('[process-job-background] Starting job processing...');
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
  console.log('[process-job-background] complete', { jobId, success: true });
}

exports.handler = async (event, context) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  console.log('[process-job-background] Function invoked', {
    httpMethod: event.httpMethod,
    bodyLength: event.body?.length,
    headers: event.headers,
    memoryUsage: `${Math.round(startMemory.heapUsed / 1024 / 1024)}MB`,
    context: {
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      remainingTime: context.getRemainingTimeInMillis?.()
    }
  });

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    console.log('[process-job-background] received', { length: event.body?.length, keys: Object.keys(body || {}) });

    const { jobId, customerId } = body;
    if (!jobId) {
      console.error('[process-job-background] missing jobId');
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'jobId required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    console.log('[process-job-background] Processing job:', { jobId, customerId });

    // Spawn async work; background function runs up to ~15 minutes
    await processJob({ jobId, customerId });

    // Background functions typically respond 202 when accepted
    console.log('[process-job-background] Job completed successfully');
    return {
      statusCode: 202,
      body: JSON.stringify({ success: true, message: 'Job accepted for background processing' }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (e) {
    const endTime = Date.now();
    const endMemory = process.memoryUsage();
    const duration = endTime - startTime;

    console.error('[process-job-background] fatal error:', e?.message || e);
    console.error('[process-job-background] stack:', e?.stack);
    console.error('[process-job-background] Performance metrics:', {
      duration: `${duration}ms`,
      memoryDelta: `${Math.round((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024)}MB`,
      finalMemory: `${Math.round(endMemory.heapUsed / 1024 / 1024)}MB`
    });

    // Send error alert to monitoring service
    await sendErrorAlert({
      functionName: 'process-job-background',
      error: e?.message || 'Unknown error',
      stack: e?.stack,
      duration,
      memoryUsage: endMemory,
      event: event
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: e?.message || 'Internal Error' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};

// Error alerting function
async function sendErrorAlert({ functionName, error, stack, duration, memoryUsage, event }) {
  try {
    const alertPayload = {
      timestamp: new Date().toISOString(),
      functionName,
      error,
      stack: stack?.substring(0, 1000), // Limit stack trace size
      duration: `${duration}ms`,
      memoryUsage: {
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
      },
      event: {
        httpMethod: event?.httpMethod,
        bodyLength: event?.body?.length,
        headers: event?.headers
      },
      severity: 'error',
      source: 'netlify-function'
    };

    // Send to monitoring service if configured
    const monitoringUrl = process.env.MONITORING_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
    if (monitoringUrl) {
      await axios.post(monitoringUrl, alertPayload, {
        timeout: 5000,
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('[process-job-background] Error alert sent to monitoring service');
    } else {
      console.warn('[process-job-background] No monitoring webhook configured for error alerts');
    }

    // Also send to orchestrator if available
    const orchestratorUrl = process.env.ORCHESTRATOR_URL;
    if (orchestratorUrl) {
      try {
        await axios.post(`${orchestratorUrl}/monitoring/alert`, alertPayload, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.AUTOBOLT_API_KEY || process.env.WORKER_AUTH_TOKEN}`
          }
        });
        console.log('[process-job-background] Error alert sent to orchestrator');
      } catch (alertError) {
        console.warn('[process-job-background] Failed to send alert to orchestrator:', alertError?.message);
      }
    }
  } catch (alertError) {
    console.error('[process-job-background] Failed to send error alert:', alertError?.message);
  }
}