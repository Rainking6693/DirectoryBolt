// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import { withRateLimit, rateLimiters } from '../../../../lib/middleware/production-rate-limit';
import {
  type DirectoryResultInput,
  normalizeJobStatus
} from '../../../../lib/server/autoboltJobs';
import { createSupabaseAdminClient } from '../../../../lib/server/supabaseAdmin'

const WORKER_API_ENV_KEY = 'AUTOBOLT_API_KEY' as const;

type UpdateJobStatus = ReturnType<typeof normalizeJobStatus> | DirectoryResultInput['status'];

type ApiResponse =
  | { success: true; data: Awaited<ReturnType<typeof updateJobProgress>>; message: string }
  | { success: false; error: string };

interface UpdateJobRequestBody {
  jobId: string;
  directoryResults?: DirectoryResultInput[];
  status?: string;
  errorMessage?: string;
}

function readSingleHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function extractApiKey(req: NextApiRequest): string | undefined {
  const directHeader = readSingleHeader(req.headers['x-api-key']);
  if (directHeader) {
    return directHeader;
  }

  const authHeader = readSingleHeader(req.headers.authorization);
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }

  return undefined;
}

function isDirectoryResult(value: unknown): value is DirectoryResultInput {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<DirectoryResultInput>;
  return typeof candidate.directoryName === 'string' && typeof candidate.status === 'string';
}

function sanitizeDirectoryResults(raw: unknown): DirectoryResultInput[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isDirectoryResult).map((item) => ({ ...item }));
}

function sanitizeErrorMessage(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function sanitizeStatus(value: unknown): UpdateJobStatus | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  return normalizeJobStatus(value) ?? value;
}

function parseRequestBody(body: unknown): UpdateJobRequestBody | null {
  if (!body || typeof body !== 'object') {
    return null;
  }
  const candidate = body as Partial<UpdateJobRequestBody>;
  if (typeof candidate.jobId !== 'string' || candidate.jobId.trim().length === 0) {
    return null;
  }
  return {
    jobId: candidate.jobId,
    directoryResults: sanitizeDirectoryResults(candidate.directoryResults),
    status: typeof candidate.status === 'string' ? candidate.status.trim() : undefined,
    errorMessage: sanitizeErrorMessage(candidate.errorMessage)
  };
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' });
  }

  const expectedKey = process.env[WORKER_API_ENV_KEY];
  if (!expectedKey) {
    console.error('[autobolt:jobs:update] Missing AUTOBOLT_API_KEY environment variable');
    return res.status(500).json({ success: false, error: 'Worker authentication not configured' });
  }

  const providedKey = extractApiKey(req);
  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({ success: false, error: 'Unauthorized. Valid AUTOBOLT_API_KEY required.' });
  }

  const parsedBody = parseRequestBody(req.body);
  if (!parsedBody) {
    return res.status(400).json({ success: false, error: 'jobId is required' });
  }

  const { jobId, directoryResults, status, errorMessage } = parsedBody;

  try {
    const supabase = createSupabaseAdminClient()

    // 1) Insert directory results into job_results for accurate progress
    const toJobResultStatus = (s: string | undefined): 'submitted' | 'failed' | 'retry' | 'pending' => {
      const v = (s || '').toLowerCase()
      if (v === 'success' || v === 'submitted' || v === 'approved') return 'submitted'
      if (v === 'retry' || v === 'retrying') return 'retry'
      if (v === 'failed' || v === 'error' || v === 'rejected' || v === 'no_form') return 'failed'
      return 'pending'
    }

    if (Array.isArray(directoryResults) && directoryResults.length > 0) {
      const rows = directoryResults.map((r) => ({
        job_id: jobId,
        directory_name: r.directoryName,
        status: toJobResultStatus(r.status as string),
        directory_url: (r as any).directoryUrl,
        listing_url: (r as any).listingUrl,
        response_log: (r as any).responseLog ?? null,
        rejection_reason: (r as any).rejectionReason ?? null
      }))
      const { error: insertErr } = await supabase.from('job_results').insert(rows)
      if (insertErr) {
        console.warn('[autobolt:jobs:update] job_results insert warning', insertErr.message)
      }
    }

    // 2) Aggregate progress from job_results
    const { data: jrAgg, error: jrErr } = await supabase
      .from('job_results')
      .select('status')
      .eq('job_id', jobId)
    if (jrErr) {
      console.warn('[autobolt:jobs:update] job_results aggregation warning', jrErr.message)
    }
    const total = (jrAgg || []).length
    const completed = (jrAgg || []).filter((r: any) => r.status === 'submitted').length
    const failed = (jrAgg || []).filter((r: any) => r.status === 'failed').length
    const progressPct = total > 0 ? Math.min(100, Math.round(((completed + failed) / total) * 100)) : undefined

    // 3) Update jobs row with status/metadata
    const canonicalStatus = sanitizeStatus(status)
    const updatedAt = new Date().toISOString()
    const metadata: Record<string, unknown> = {}
    if (typeof progressPct === 'number') metadata['progress_percentage'] = progressPct
    if (typeof completed === 'number') metadata['directories_completed'] = completed
    if (typeof total === 'number') metadata['directories_total'] = total
    if (Array.isArray(directoryResults) && directoryResults.length > 0) {
      metadata['last_directory'] = directoryResults[directoryResults.length - 1]?.directoryName
    }

    const updatePayload: any = {
      updated_at: updatedAt,
      metadata
    }
    if (canonicalStatus) updatePayload.status = canonicalStatus
    if (canonicalStatus === 'complete') updatePayload.completed_at = updatedAt
    if (typeof errorMessage === 'string' && errorMessage.trim().length > 0) {
      updatePayload.error_message = errorMessage.trim()
    }

    const { data, error: updErr } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId)
      .select('id, status, customer_id, metadata')
      .maybeSingle()

    if (updErr) {
      console.error('[autobolt:jobs:update] jobs update failed', updErr)
      return res.status(500).json({ success: false, error: 'Failed to update job' })
    }

    return res.status(200).json({
      success: true,
      data: data ?? null,
      message: `Job ${jobId} updated successfully.`
    })
  } catch (error) {
    console.error('[autobolt:jobs:update] Failed to update job progress', error);
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' });
  }
}

export default withRateLimit(handler, rateLimiters.general);
