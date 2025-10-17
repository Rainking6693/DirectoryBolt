// Legacy endpoint for Railway worker compatibility
// This endpoint redirects to the correct autobolt endpoint

import type { NextApiRequest, NextApiResponse } from 'next'
import { updateJobProgress } from '../../../lib/server/autoboltJobs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { jobId, job_id, status, directoryResults, errorMessage } = req.body

    // Handle both jobId and job_id parameter names
    const actualJobId = jobId || job_id

    if (!actualJobId) {
      return res.status(400).json({ 
        success: false, 
        error: 'jobId is required' 
      })
    }

    // Use the existing updateJobProgress function
    const result = await updateJobProgress(actualJobId, status, {
      directoryResults,
      errorMessage
    })

    return res.status(200).json({
      success: true,
      data: result,
      message: `Job ${actualJobId} updated successfully.`
    })
  } catch (error) {
    console.error('[jobs/update] Error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update job' 
    })
  }
}