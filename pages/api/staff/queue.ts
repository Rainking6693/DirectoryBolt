// Staff Dashboard Queue API
// Provides real-time job queue data using the proper job queue system

import { NextApiRequest, NextApiResponse } from 'next'
import { withStaffAuth } from '../../../lib/middleware/staff-auth'
import { withRateLimit, rateLimitConfigs } from '../../../lib/middleware/rate-limit'
import { getQueueSnapshot } from '../../../lib/server/autoboltJobs'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📋 Staff requesting queue data from job queue system')

    // Use the proper job queue system
    const snapshot = await getQueueSnapshot()
    
    // Transform to match the expected staff dashboard format
    const queueData = {
      stats: {
        pending: snapshot.stats.pendingJobs,
        processing: snapshot.stats.inProgressJobs, 
        completed: snapshot.stats.completedJobs,
        failed: snapshot.stats.failedJobs,
        total: snapshot.stats.totalJobs,
        completedToday: snapshot.jobs.filter(job => {
          const completedDate = new Date(job.completedAt || '')
          const today = new Date()
          return job.completedAt && completedDate.toDateString() === today.toDateString()
        }).length
      },
      queue: snapshot.jobs.map(job => ({
        id: job.id,
        customer_id: job.customerId,
        business_name: job.businessName || 'Unknown Business',
        email: job.email || '',
        package_type: mapPackageType(job.packageSize),
        status: job.status,
        priority_level: job.priorityLevel,
        directories_allocated: job.directoriesTotal,
        directories_submitted: job.directoriesCompleted,
        directories_failed: job.directoriesFailed,
        progress_percentage: job.progressPercentage,
        estimated_completion: job.completedAt,
        created_at: job.createdAt,
        updated_at: job.startedAt || job.createdAt,
        recent_activity: [],
        current_submissions: []
      })),
      alerts: generateJobAlerts(snapshot.jobs),
      recent_activity: [],
      processing_summary: {
        total_directories_allocated: snapshot.stats.totalDirectories,
        total_directories_submitted: snapshot.stats.completedDirectories,
        total_directories_failed: snapshot.stats.failedDirectories,
        overall_completion_rate: snapshot.stats.successRate
      }
    }

    console.log(`✅ Retrieved ${snapshot.jobs.length} jobs from queue system`)

    res.status(200).json({
      success: true,
      data: queueData,
      retrieved_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Staff queue error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve queue data',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function mapPackageType(packageSize: number): string {
  const packageMap: Record<number, string> = {
    50: 'starter',
    100: 'growth', 
    300: 'professional',
    500: 'enterprise'
  }
  return packageMap[packageSize] || 'custom'
}

function generateJobAlerts(jobs: any[]): any[] {
  const alerts = []
  const now = new Date()
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

  // Check for stuck jobs (in progress but no recent activity)
  const stuckJobs = jobs.filter(job => {
    if (job.status !== 'in_progress') return false
    if (!job.startedAt) return false
    
    const lastActivity = new Date(job.startedAt)
    return lastActivity < fourHoursAgo && job.progressPercentage > 0
  })

  stuckJobs.forEach(job => {
    alerts.push({
      type: 'warning',
      title: 'Stuck Job',
      message: `${job.businessName || 'Job'} has no progress in the last 4 hours`,
      customer_id: job.customerId,
      priority: 'medium'
    })
  })

  // Check for high failure rates
  const highFailureJobs = jobs.filter(job => {
    const failureRate = job.directoriesTotal > 0 
      ? (job.directoriesFailed / job.directoriesTotal) * 100
      : 0
    return failureRate > 20 // More than 20% failure rate
  })

  highFailureJobs.forEach(job => {
    const failureRate = Math.round((job.directoriesFailed / job.directoriesTotal) * 100)
    alerts.push({
      type: 'error',
      title: 'High Failure Rate',
      message: `${job.businessName || 'Job'} has ${failureRate}% failure rate`,
      customer_id: job.customerId,
      priority: 'high'
    })
  })

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
  })
}

// Export with authentication and rate limiting middleware
export default withRateLimit(rateLimitConfigs.staff)(withStaffAuth(handler))