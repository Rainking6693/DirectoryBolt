// /pages/api/jobs/update.ts

import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdminClient } from '../../../lib/server/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { job_id, status, message, directoryResults } = req.body

  if (!job_id || !status) {
    return res.status(400).json({ error: 'Missing job_id or status' })
  }

  try {
    const supabase = getSupabaseAdminClient()

    if (!supabase) {
      console.error('[Supabase Error] Failed to initialize Supabase client')
      return res.status(500).json({ error: 'Failed to initialize Supabase client' })
    }

    // First get the existing job to merge directory results
    const { data: existingJob, error: fetchError } = await supabase
      .from('jobs')
      .select('directory_results, metadata')
      .eq('id', job_id)
      .single()

    if (fetchError) {
      console.error('[Supabase Error] Failed to fetch job:', fetchError)
      return res.status(500).json({ error: fetchError.message })
    }

    // Merge new directory results with existing ones
    let updatedDirectoryResults = existingJob?.directory_results || []
    if (directoryResults && Array.isArray(directoryResults)) {
      updatedDirectoryResults = [...updatedDirectoryResults, ...directoryResults]
    }

    // Calculate progress metrics
    const submitted = updatedDirectoryResults.filter((r: any) => r.status === 'submitted').length
    const failed = updatedDirectoryResults.filter((r: any) => r.status === 'failed').length
    const total = updatedDirectoryResults.length

    // Update metadata with progress
    const updatedMetadata = {
      ...(existingJob?.metadata || {}),
      submitted,
      failed,
      total,
      lastUpdated: new Date().toISOString()
    }

    const { error } = await supabase
      .from('jobs')
      .update({
        status,
        message,
        directory_results: updatedDirectoryResults,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', job_id)

    if (error) {
      console.error('[Supabase Error] Failed to update job status:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true, progress: { submitted, failed, total } })
  } catch (error) {
    console.error('[API Error] Failed to update job status:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}