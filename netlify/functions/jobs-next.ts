import type { Handler } from '@netlify/functions'
import { getNextPendingJob } from '../../lib/server/autoboltJobs'

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
    const next = await getNextPendingJob()
    if (!next) {
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ job: null }) }
    }

    const j = next.job
    const c: any = next.customer || {}
    const job = {
      id: j.id,
      customer_id: j.customerId,
      package_size: j.packageSize,
      priority_level: j.priorityLevel,
      directory_limit: j.packageSize,
      business_name: c.business_name,
      email: c.email,
      phone: c.phone,
      website: c.website,
      address: c.address,
      city: c.city,
      state: c.state,
      zip: c.zip,
      description: c.description
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ job }) }
  } catch (e: any) {
    console.error('jobs-next error:', e)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ error: e?.message || 'Internal error' }) }
  }
}

export { handler }
