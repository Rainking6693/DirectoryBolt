import type { JobPayload } from './jobProcessor';

interface GeminiSubmissionResponse {
  success: boolean;
  status?: 'submitted' | 'failed' | 'skipped';
  message?: string;
  metadata?: Record<string, unknown>;
}

interface DirectoryMeta {
  id?: string;
  name: string;
  requiresLogin?: boolean;
  hasCaptcha?: boolean;
  hasAntiBot?: boolean;
  difficulty?: string;
  failureRate?: number;
  selectorCount?: number;
}

function scoreDirectoryForGemini(directory: DirectoryMeta, aiProbability?: number): number {
  let score = 0;

  if (directory.requiresLogin) score += 2;
  if (directory.hasCaptcha || directory.hasAntiBot) score += 2;
  if (directory.difficulty === 'hard') score += 2;
  if (typeof directory.failureRate === 'number' && directory.failureRate >= 0.6) score += 1.5;
  if ((directory.selectorCount || 0) < 3) score += 1;
  if (typeof aiProbability === 'number' && aiProbability < 0.45) score += 1;

  return score;
}

export function shouldUseGemini(
  directory: DirectoryMeta,
  aiProbability?: number,
  threshold = Number(process.env.GEMINI_ROUTING_THRESHOLD || '3')
): boolean {
  const score = scoreDirectoryForGemini(directory, aiProbability);
  return score >= threshold;
}

export async function callGeminiWorker(job: JobPayload, directory: DirectoryMeta): Promise<GeminiSubmissionResponse> {
  const workerUrl = process.env.GEMINI_WORKER_URL;
  const authToken = process.env.WORKER_AUTH_TOKEN;

  if (!workerUrl) {
    throw new Error('GEMINI_WORKER_URL is not configured');
  }

  if (!authToken) {
    throw new Error('WORKER_AUTH_TOKEN is not configured');
  }

  const payload = {
    job,
    directory,
    requestedAt: new Date().toISOString()
  };

  const response = await fetch(`${workerUrl.replace(/\/$/, '')}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gemini worker error ${response.status}: ${text}`);
  }

  const data = await response.json();

  return {
    success: Boolean(data?.success),
    status: data?.status,
    message: data?.message,
    metadata: data?.metadata
  };
}