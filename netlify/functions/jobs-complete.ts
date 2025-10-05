import type { Handler } from '@netlify/functions'
import { completeJob } from '../../lib/server/autoboltJobs'

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
      finalStatus?: string,
      summary?: { total?: number; submitted?: number; failed?: number; success_rate?: number; processingTimeSeconds?: number }
      errorMessage?: string
    }

    if (!payload.jobId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'jobId is required' }) }
    }

    const res = await completeJob({
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

    return { statusCode: 200, body: JSON.stringify({ success: true, result: res }) }
  } catch (e:any) {
    console.error('jobs-complete error:', e)
    return { statusCode: 500, body: JSON.stringify({ error: e.message || 'Internal error' }) }
  }
}

export { handler }
