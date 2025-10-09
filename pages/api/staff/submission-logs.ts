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
    const { customer_id, job_id, limit = '100' } = req.query
    const lim = Math.min(parseInt(String(limit)) || 100, 500)

    let query = supabase
      .from('autobolt_submission_logs')
      .select('id, customer_id, job_id, directory_name, action, timestamp, details, screenshot_url, success, processing_time_ms, error_message, created_at')
      .order('timestamp', { ascending: false })
      .limit(lim)

    if (customer_id) query = query.eq('customer_id', customer_id)
    if (job_id) query = query.eq('job_id', job_id)

    const { data, error } = await query
    if (error) {
      console.error('[staff:submission-logs] query error', error)
      return res.status(500).json({ success: false, error: 'Failed to fetch logs' })
    }

    return res.status(200).json({ success: true, data })
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || 'Internal error' })
  }
}

export default withStaffAuth(handler)