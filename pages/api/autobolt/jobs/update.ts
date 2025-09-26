import { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit, rateLimiters } from '../../../../lib/middleware/production-rate-limit'
import { updateJobProgress, DirectoryResultInput } from '../../../../lib/server/autoboltJobs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' })
  }

  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    if (!apiKey || apiKey !== process.env.AUTOBOLT_API_KEY) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Valid AUTOBOLT_API_KEY required.' })
    }

    const {
      jobId,
      directoryResults = [],
      status,
      errorMessage
    }: {
      jobId?: string
      directoryResults?: DirectoryResultInput[]
      status?: string
      errorMessage?: string
    } = req.body

    if (!jobId) {
      return res.status(400).json({ success: false, error: 'jobId is required' })
    }

    const progress = await updateJobProgress({
      jobId,
      directoryResults,
      status: status as any,
      errorMessage
    })

    return res.status(200).json({
      success: true,
      data: progress,
      message: `Job ${jobId} updated successfully.`
    })
  } catch (error) {
    console.error('AutoBolt Update Job API Error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' })
  }
}

export default withRateLimit(handler, rateLimiters.general)
