import type { NextApiRequest, NextApiResponse } from 'next'
import { retryFailedJob } from '../../lib/server/autoboltJobs'

function authorize(authHeader?: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return token === expected
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('[jobs-retry] handler start', { method: req.method, hasAuth: !!req.headers.authorization })
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!authorize(req.headers.authorization)) {
    console.warn('[jobs-retry] unauthorized')
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const payload = req.body || {}
    if (!payload.jobId) {
      return res.status(400).json({ error: 'jobId is required' })
    }
    const job = await retryFailedJob(payload.jobId)
    console.log('[jobs-retry] success', { jobId: payload.jobId })
    return res.status(200).json({ success: true, job })
  } catch (e:any) {
    console.error('[jobs-retry] error', { message: e?.message, stack: e?.stack })
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
}
