import type { Handler } from '@netlify/functions'
import { updateJobProgress } from '../../lib/server/autoboltJobs'

function authorize(authHeader?: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return token === expected
}

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }
  if (!authorize(event.headers.authorization)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const payload = JSON.parse(event.body || '{}') as {
      jobId: string,
      directoryResults?: Array<{ directoryName: string; status: string; message?: string; timestamp?: string; listingUrl?: string; directoryUrl?: string; category?: string; tier?: string }>
      status?: string
      errorMessage?: string
    }

    if (!payload.jobId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'jobId is required' }) }
    }

    const results = (payload.directoryResults || []).map(r => ({
      directoryName: r.directoryName,
      status: r.status as any,
      submissionResult: r.message,
      listingUrl: r.listingUrl,
      directoryUrl: r.directoryUrl,
      directoryCategory: r.category,
      directoryTier: (r.tier as any) || undefined
    }))

    const res = await updateJobProgress({ jobId: payload.jobId, directoryResults: results, status: payload.status, errorMessage: payload.errorMessage })

    return { statusCode: 200, body: JSON.stringify({ success: true, progress: res }) }
  } catch (e:any) {
    console.error('jobs-update error:', e)
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Internal error' }) }
  }
}

export { handler }
