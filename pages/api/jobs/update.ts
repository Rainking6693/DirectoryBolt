// /pages/api/jobs/update.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdminClient } from '../../../lib/server/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { job_id, status, message } = req.body

  if (!job_id || !status) {
    return res.status(400).json({ error: 'Missing job_id or status' })
  }

  try {
    const supabase = getSupabaseAdminClient()
    
    if (!supabase) {
      console.error('[Supabase Error] Failed to initialize Supabase client')
      return res.status(500).json({ error: 'Failed to initialize Supabase client' })
    }

    const { error } = await supabase
      .from('jobs')
      .update({ status, message, updated_at: new Date().toISOString() })
      .eq('id', job_id)

    if (error) {
      console.error('[Supabase Error] Failed to update job status:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('[API Error] Failed to update job status:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}