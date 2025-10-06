import type { Handler } from '@netlify/functions'
import { createSupabaseAdminClient } from '../../lib/server/supabaseAdmin'

function corsHeaders() {
  const origin = process.env.NODE_ENV === 'production' ? 'https://directorybolt.netlify.app' : '*'
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const body = JSON.parse(event.body || '{}') as {
      customer_id?: string
      package_size?: number
      business_name?: string
      email?: string
      website?: string
    }
    const supabase = createSupabaseAdminClient()

    const now = new Date().toISOString()
    const insert = {
      customer_id: body.customer_id || null,
      package_size: body.package_size || 1,
      status: 'pending',
      metadata: { seeded: true },
      created_at: now,
      updated_at: now
    } as any

    const { data, error } = await supabase.from('jobs').insert(insert).select('id').single()
    if (error) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ error: error.message }) }
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ success: true, jobId: data.id }) }
  } catch (e:any) {
    console.error('jobs-seed error:', e)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() }, body: JSON.stringify({ error: e?.message || 'Internal error' }) }
  }
}

export { handler }
