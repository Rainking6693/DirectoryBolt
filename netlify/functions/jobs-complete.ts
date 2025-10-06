import type { Handler } from '@netlify/functions'
import { completeJob } from '../../lib/server/autoboltJobs'

function corsHeaders() {
  const origin = process.env.NODE_ENV === 'production' ? 'https://directorybolt.netlify.app' : '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Worker-ID, X-Worker-Auth',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  }
}

function authorize(authHeader?: string): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false
  const token = authHeader.slice(7)
  const expected = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.WORKER_AUTH_TOKEN || ''
  return !!expected && token === expected
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders() }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ error: 'Method not allowed' }) }
  }
  if (!authorize(event.headers.authorization)) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}') as { jobId?: string; queueId?: string; finalStatus?: string; summary?: any; errorMessage?: string }
    const jobId = body.jobId || body.queueId
    if (!jobId) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ error: 'jobId is required' }) }
    }

    const result = await completeJob({ jobId, finalStatus: body.finalStatus, errorMessage: body.errorMessage, summary: body.summary })
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ success: true, result }) }
  } catch (e: any) {
    console.error('jobs-complete error:', e)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ error: e?.message || 'Internal error' }) }
  }
}

export { handler }
