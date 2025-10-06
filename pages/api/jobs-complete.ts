import type { NextApiRequest, NextApiResponse } from 'next'

function authorize(authHeader?: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return token === expected
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[jobs-complete] handler start', { method: req.method, hasAuth: !!req.headers.authorization })
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!authorize(req.headers.authorization)) {
    console.warn('[jobs-complete] unauthorized')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const payload = req.body || {}
    console.log('[jobs-complete] payload', { jobId: payload.jobId })

    if (!payload.jobId) {
      return res.status(400).json({ error: 'jobId is required' })
    }

    const { completeJob } = await import('../../lib/server/autoboltJobs')
    const result = await completeJob({
      jobId: payload.jobId,
      finalStatus: payload.finalStatus,
      errorMessage: payload.errorMessage,
      summary: {
        totalDirectories: payload.summary?.total,
        successfulSubmissions: payload.summary?.submitted,
        failedSubmissions: payload.summary?.failed,
        processingTimeSeconds: payload.summary?.processingTimeSeconds
      }
    })

    console.log('[jobs-complete] responded', { jobId: payload.jobId })
    return res.status(200).json({ success: true, result })
  } catch (e:any) {
    console.error('[jobs-complete] error', { message: e?.message, stack: e?.stack })
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
}
