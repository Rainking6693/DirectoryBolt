import { NextApiRequest, NextApiResponse } from 'next'
import { getQueueSnapshot } from '../../../lib/server/autoboltJobs'

function authenticateStaff(req: NextApiRequest) {
  const staffKey = req.headers['x-staff-key'] || req.headers['authorization']
  const validStaffKey = process.env.STAFF_API_KEY || 'DirectoryBolt-Staff-2025-SecureKey'

  if (staffKey === validStaffKey || staffKey === `Bearer ${validStaffKey}`) {
    return true
  }

  const staffSession = req.headers.cookie?.split('; ').find(row => row.startsWith('staff-session='))?.split('=')[1]
  if (staffSession) {
    return true
  }

  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString()
    const [username, password] = decoded.split(':')
    if (username === 'staff' && password === (process.env.STAFF_DASHBOARD_PASSWORD || 'DirectoryBoltStaff2025!')) {
      return true
    }
  }

  return false
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  if (!authenticateStaff(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
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
