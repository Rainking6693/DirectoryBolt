import { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit, rateLimiters } from '../../../../lib/middleware/production-rate-limit'
import { getNextPendingJob } from '../../../../lib/server/autoboltJobs'

function mapPackageType(packageSize: number, metadata?: Record<string, unknown> | null) {
  if (metadata && typeof metadata['package_type'] === 'string') {
    return metadata['package_type']
  }
  switch (packageSize) {
    case 50:
      return 'starter'
    case 100:
      return 'growth'
    case 300:
      return 'professional'
    case 500:
      return 'enterprise'
    default:
      return 'custom'
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    if (!apiKey || apiKey !== process.env.AUTOBOLT_API_KEY) {
      return res.status(403).json({ success: false, error: 'Unauthorized' })
    }

    const nextJob = await getNextPendingJob()
    if (!nextJob) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No jobs currently in queue'
      })
    }

    const { job, customer } = nextJob
    const packageType = mapPackageType(job.packageSize, job.metadata)

    return res.status(200).json({
      success: true,
      data: {
        jobId: job.id,
        customerId: job.customerId,
        customerName: (customer?.business_name as string | undefined) || null,
        customerEmail: (customer?.email as string | undefined) || null,
        packageType,
        directoryLimit: job.packageSize,
        priorityLevel: job.priorityLevel,
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        businessData: customer,
        metadata: job.metadata || null
      }
    })
  } catch (error) {
    console.error('AutoBolt Get Next Job API Error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export default withRateLimit(handler, rateLimiters.general)

