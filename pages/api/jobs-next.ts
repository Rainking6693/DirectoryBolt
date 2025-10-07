import type { NextApiRequest, NextApiResponse } from 'next'
import { getNextPendingJob, markJobInProgress } from '../../lib/server/autoboltJobs'
import { logInfo, logWarn, logError, serializeError } from '../../lib/server/logging'

logInfo('jobs-next.module', 'Autobolt jobs helpers loaded', {
  exports: ['getNextPendingJob', 'markJobInProgress']
})

function authorize(authHeader?: string): boolean {
  const fn = 'jobs-next.authorize'
  const isValid = Boolean(authHeader && authHeader.startsWith('Bearer ') &&
    authHeader.slice(7) === (process.env.SUPABASE_SERVICE_ROLE_KEY || ''))
  logInfo(fn, 'Authorization evaluated', {
    hasHeader: Boolean(authHeader),
    isValid
  })
  return isValid
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const fn = 'jobs-next.handler'
  logInfo(fn, 'Handler invoked', { method: req.method, url: req.url })

  if (req.method !== 'POST') {
    logWarn(fn, 'Method not allowed', { method: req.method })
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!authorize(req.headers.authorization)) {
    logWarn(fn, 'Unauthorized request rejected')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    logInfo(fn, 'Request authorized, fetching next job')
    const next = await getNextPendingJob()
    logInfo(fn, 'getNextPendingJob completed', { hasJob: Boolean(next) })

    if (!next) {
      logInfo(fn, 'No jobs available, returning empty payload')
      return res.status(200).json({ job: null })
    }

    logInfo(fn, 'Marking job in progress', { jobId: next.job.id })
    await markJobInProgress(next.job.id)

    const directoryLimitByPackage: Record<string, number> = {
      starter: 50,
      growth: 150,
      professional: 300,
      enterprise: 500,
      pro: 500
    }

    const jobPayload = {
      id: next.job.id,
      customer_id: next.job.customerId,
      package_size: next.job.packageSize,
      priority_level: next.job.priorityLevel,
      status: next.job.status,
      created_at: next.job.createdAt,
      started_at: next.job.startedAt,
      business_name: (next.customer as any)?.business_name || null,
      email: (next.customer as any)?.email || null,
      phone: (next.customer as any)?.phone || null,
      website: (next.customer as any)?.website || null,
      address: (next.customer as any)?.address || null,
      city: (next.customer as any)?.city || null,
      state: (next.customer as any)?.state || null,
      zip: (next.customer as any)?.zip || null,
      description: (next.customer as any)?.description || null,
      category: (next.customer as any)?.category || null,
      package_type: next.job.packageSize,
      directory_limit: directoryLimitByPackage[String(next.job.packageSize).toLowerCase()] || next.job.packageSize || 50
    }

    logInfo(fn, 'Responding with job payload', { jobId: jobPayload.id })
    return res.status(200).json({ job: jobPayload })
  } catch (error) {
    logError(fn, 'Unhandled error', { error: serializeError(error) })
    return res.status(500).json({ error: (error as Error)?.message || 'Internal error' })
  }
}
