import type { NextApiRequest, NextApiResponse } from 'next'
import { withStaffAuth } from '../../../lib/middleware/staff-auth'
import { createClient } from '@supabase/supabase-js'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ success: false, error: 'Supabase not configured' })
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  try {
    // Find latest entries that indicate 2FA/manual required in the last 48h
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    // First check if the table exists
    const { error: tableCheckError } = await supabase
      .from('autobolt_test_logs')
      .select('id')
      .limit(1)

    if (tableCheckError && tableCheckError.message?.includes('relation "autobolt_test_logs" does not exist')) {
      console.log('[staff:2fa-queue] Table does not exist, returning empty result')
      return res.status(200).json({ success: true, data: [] })
    }

    const { data, error } = await supabase
      .from('autobolt_test_logs')
      .select('job_id, customer_id, directory_name, timestamp')
      .gte('timestamp', since)
      .or("details.ilike.%manual_required%,error_message.ilike.%2FA%")
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('[staff:2fa-queue] query error', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch 2FA queue' })
    }

    // Transform data for frontend
    const transformedData = (data || []).map((row: any) => ({
      job_id: row.job_id,
      customer_id: row.customer_id,
      directory_name: row.directory_name,
      last_seen: row.timestamp
    }))

    // Deduplicate by job_id + directory_name, keep latest
    const map = new Map<string, { job_id: string; customer_id: string; directory_name: string; last_seen: string }>()
    for (const r of data || []) {
      const k = `${r.job_id}::${r.directory_name}`
      if (!map.has(k)) {
        map.set(k, { job_id: r.job_id, customer_id: r.customer_id, directory_name: r.directory_name, last_seen: r.timestamp })
      }
    }

    return res.status(200).json({ success: true, data: transformedData })
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Internal error' })
  }
}

export default withStaffAuth(handler)