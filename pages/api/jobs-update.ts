import type { NextApiRequest, NextApiResponse } from 'next'

function authorize(authHeader?: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return token === expected
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[jobs-update] handler start', { method: req.method, hasAuth: !!req.headers.authorization })
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!authorize(req.headers.authorization)) {
    console.warn('[jobs-update] unauthorized')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const payload = req.body || {}
    console.log('[jobs-update] payload', { hasJobId: !!payload.jobId, results: Array.isArray(payload.directoryResults) ? payload.directoryResults.length : 0 })

    if (!payload.jobId) {
      return res.status(400).json({ error: 'jobId is required' })
    }

    const results = (payload.directoryResults || []).map((r:any) => ({
      directoryName: r.directoryName,
      status: r.status as any,
      submissionResult: r.message,
      listingUrl: r.listingUrl,
      directoryUrl: r.directoryUrl,
      directoryCategory: r.category,
      directoryTier: (r.tier as any) || undefined
    }))

    const { updateJobProgress } = await import('../../lib/server/autoboltJobs')
    const progress = await updateJobProgress({ jobId: payload.jobId, directoryResults: results, status: payload.status, errorMessage: payload.errorMessage })
    console.log('[jobs-update] responded', { jobId: payload.jobId, resultsCount: results.length })

    return res.status(200).json({ success: true, progress })
  } catch (e:any) {
    console.error('[jobs-update] error', { message: e?.message, stack: e?.stack })
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
}
