import { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit, rateLimiters } from '../../../../lib/middleware/production-rate-limit'
import { completeJob, JobSummary, normalizeJobStatus } from '../../../../lib/server/autoboltJobs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    if (!apiKey || apiKey !== process.env.AUTOBOLT_API_KEY) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Valid AUTOBOLT_API_KEY required.' })
    }

    const {
      jobId,
      finalStatus,
      errorMessage,
      summary
    }: {
      jobId?: string
      finalStatus?: string
      errorMessage?: string
      summary?: JobSummary
    } = req.body

    const canonicalStatus = normalizeJobStatus(finalStatus)

    if (!jobId || !canonicalStatus) {
      return res.status(400).json({ success: false, error: 'jobId and a valid finalStatus are required' })
    }

    const result = await completeJob({
      jobId,
      finalStatus: canonicalStatus,
      errorMessage,
      summary
    })

    return res.status(200).json({
      success: true,
      data: result,
      message: `Job ${jobId} marked as ${result.finalStatus}.`
    })
  } catch (error) {
    console.error('AutoBolt Complete Job API Error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' })
  }
}

export default withRateLimit(handler, rateLimiters.general)
