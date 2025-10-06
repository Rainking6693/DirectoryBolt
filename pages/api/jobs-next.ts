import type { NextApiRequest, NextApiResponse } from 'next'

function authorize(authHeader?: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return token === expected
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[jobs-next] handler start', { method: req.method, hasAuth: !!req.headers.authorization })
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!authorize(req.headers.authorization)) {
    console.warn('[jobs-next] unauthorized')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    console.log('[jobs-next] dynamic import orchestrator')
    const { getNextPendingJob, markJobInProgress } = await import('../../lib/server/autoboltJobs')
    console.log('[jobs-next] calling getNextPendingJob')
    const next = await getNextPendingJob()
    console.log('[jobs-next] getNextPendingJob result', { hasJob: !!next })
    if (!next) {
      return res.status(200).json({ job: null })
    }

    console.log('[jobs-next] markJobInProgress', { jobId: next.job.id })
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

    console.log('[jobs-next] responding success', { jobId: jobPayload.id })
    return res.status(200).json({ job: jobPayload })
  } catch (e:any) {
    console.error('[jobs-next] error', { message: e?.message, stack: e?.stack })
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
}
