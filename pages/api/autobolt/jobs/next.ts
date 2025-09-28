import type { NextApiRequest, NextApiResponse } from 'next';
import { withRateLimit, rateLimiters } from '../../../../lib/middleware/production-rate-limit';
import { getNextPendingJob, type JobStatus, type NextJobResponse } from '../../../../lib/server/autoboltJobs';

const WORKER_API_ENV_KEY = 'AUTOBOLT_API_KEY' as const;

type AutoBoltPackage = 'starter' | 'growth' | 'professional' | 'enterprise' | 'custom';

type ApiResponse =
  | { success: true; data: NextJobPayload | null; message?: string }
  | { success: false; error: string };

interface NextJobPayload {
  jobId: string;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  packageType: AutoBoltPackage;
  directoryLimit: number;
  priorityLevel: number;
  status: JobStatus;
  createdAt: string;
  startedAt: string;
  businessData: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

const PACKAGE_BY_LIMIT: Record<number, AutoBoltPackage> = {
  50: 'starter',
  100: 'growth',
  300: 'professional',
  500: 'enterprise'
};

function mapPackageType(packageSize: number, metadata?: Record<string, unknown> | null): AutoBoltPackage {
  const metadataPackage = getStringField(metadata ?? null, 'package_type');
  if (metadataPackage && isKnownPackage(metadataPackage)) {
    return metadataPackage;
  }
  return PACKAGE_BY_LIMIT[packageSize] ?? 'custom';
}

function isKnownPackage(value: string): value is AutoBoltPackage {
  return ['starter', 'growth', 'professional', 'enterprise', 'custom'].includes(value);
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

function getStringField(record: Record<string, unknown> | null, field: string): string | null {
  if (!record) {
    return null;
  }
  const value = record[field];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const expectedKey = process.env[WORKER_API_ENV_KEY];
  if (!expectedKey) {
    console.error('[autobolt:jobs:next] Missing AUTOBOLT_API_KEY environment variable');
    return res.status(500).json({ success: false, error: 'Worker authentication not configured' });
  }

  const providedKey = extractApiKey(req);
  if (!providedKey || providedKey !== expectedKey) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const nextJob = await getNextPendingJob();
    if (!nextJob) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No jobs currently in queue'
      });
    }

    const payload = buildPayload(nextJob);
    return res.status(200).json({ success: true, data: payload });
  } catch (error) {
    console.error('[autobolt:jobs:next] Failed to fetch next job', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

function buildPayload(response: NextJobResponse): NextJobPayload {
  const { job, customer } = response;

  return {
    jobId: job.id,
    customerId: job.customerId,
    customerName: getStringField(customer, 'business_name'),
    customerEmail: getStringField(customer, 'email'),
    packageType: mapPackageType(job.packageSize, job.metadata ?? undefined),
    directoryLimit: job.packageSize,
    priorityLevel: job.priorityLevel,
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    businessData: customer,
    metadata: job.metadata ?? null
  };
}

export default withRateLimit(handler, rateLimiters.general);
