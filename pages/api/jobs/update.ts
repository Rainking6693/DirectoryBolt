// /pages/api/jobs/update.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { job_id, status, message } = req.body

  if (!job_id || !status) {
    return res.status(400).json({ error: 'Missing job_id or status' })
  }

  const { error } = await supabase
    .from('jobs')
    .update({ status, message })
    .eq('id', job_id)

  if (error) {
    console.error('[Supabase Error] Failed to update job status:', error)
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}

