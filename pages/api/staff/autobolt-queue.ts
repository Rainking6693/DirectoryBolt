import { NextApiRequest, NextApiResponse } from 'next'
import { getQueueSnapshot } from '../../../lib/server/autoboltJobs'
import { withStaffAuth } from '../../../lib/middleware/staff-auth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const snapshot = await getQueueSnapshot()

    return res.status(200).json({
      success: true,
      data: {
        queueItems: snapshot.jobs,
        stats: {
          total_queued: snapshot.stats.pendingJobs,
          total_processing: snapshot.stats.inProgressJobs,
          total_completed: snapshot.stats.completedJobs,
          total_failed: snapshot.stats.failedJobs,
          total_jobs: snapshot.stats.totalJobs,
          completed_directories: snapshot.stats.completedDirectories,
          failed_directories: snapshot.stats.failedDirectories,
          success_rate: snapshot.stats.successRate
        }
      },
      retrieved_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('AutoBolt queue snapshot error:', error)
    return res.status(500).json({ success: false, error: 'Failed to retrieve AutoBolt queue data' })
  }
}

export default withStaffAuth(handler)
