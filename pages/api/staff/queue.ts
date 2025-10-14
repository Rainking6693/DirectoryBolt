// Staff Dashboard Queue API
// Provides real-time job queue data using the proper job queue system

import { NextApiRequest, NextApiResponse } from 'next'
import { withStaffAuth } from '../../../lib/middleware/staff-auth'
import { withRateLimit, rateLimitConfigs } from '../../../lib/middleware/rate-limit'
import { createClient } from '@supabase/supabase-js'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Supabase is not configured on this environment'
    })
  }

  try {
    console.log('📋 Staff requesting queue data from jobs table')

    const supabase = createClient(supabaseUrl, serviceKey)

    // Get jobs with business data
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select(`
        id,
        customer_id,
        customer_name,
        package_size,
        priority_level,
        status,
        created_at,
        started_at,
        completed_at,
        error_message,
        business_data,
        directories_to_process,
        directories_completed,
        directories_failed,
        progress_percentage
      `)
      .order('created_at', { ascending: false })

    if (jobsError) {
      console.error('❌ Jobs query error:', jobsError)
      throw jobsError
    }

    // Transform jobs data
    const transformedJobs = (jobs || []).map((job: any) => {
      // Extract business data from JSON field
      const businessData = job.business_data as any
      const businessName = businessData?.businessName || businessData?.business_name || job.customer_name || 'Unknown Business'
      const email = businessData?.email || ''

      return {
        id: job.id,
        customer_id: job.customer_id,
        business_name: businessName,
        email: email,
        package_type: mapPackageType(job.package_size || 0),
        status: job.status,
        priority_level: job.priority_level || 3,
        directories_allocated: job.directories_to_process || 0,
        directories_submitted: job.directories_completed || 0,
        directories_failed: job.directories_failed || 0,
        progress_percentage: job.progress_percentage || 0,
        estimated_completion: job.completed_at,
        created_at: job.created_at,
        updated_at: job.started_at || job.created_at,
        recent_activity: [],
        current_submissions: []
      }
    })

    // Calculate stats
    const stats = transformedJobs.reduce((acc, job) => {
      acc.total += 1
      if (job.status === 'pending') acc.pending += 1
      if (job.status === 'in_progress') acc.processing += 1
      if (job.status === 'completed') acc.completed += 1
      if (job.status === 'failed') acc.failed += 1
      return acc
    }, { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 })

    // Calculate today's completed
    const today = new Date().toDateString()
    const completedToday = transformedJobs.filter(job =>
      job.status === 'completed' &&
      job.completed_at &&
      new Date(job.completed_at).toDateString() === today
    ).length

    const queueData = {
      stats: {
        pending: stats.pending,
        processing: stats.processing,
        completed: stats.completed,
        failed: stats.failed,
        total: stats.total,
        completedToday: completedToday
      },
      queue: transformedJobs,
      alerts: generateJobAlerts(transformedJobs),
      recent_activity: [],
      processing_summary: {
        total_directories_allocated: transformedJobs.reduce((sum, job) => sum + job.directories_allocated, 0),
        total_directories_submitted: transformedJobs.reduce((sum, job) => sum + job.directories_submitted, 0),
        total_directories_failed: transformedJobs.reduce((sum, job) => sum + job.directories_failed, 0),
        overall_completion_rate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      }
    }

    console.log(`✅ Retrieved ${transformedJobs.length} jobs from database`)

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
      details: error instanceof Error ? error.message : String(error)
    })
  }
}

function mapPackageType(packageSize: number): string {
  const packageMap: Record<number, string> = {
    50: 'starter',
    75: 'growth',
    150: 'professional',
    500: 'enterprise'
  }
  return packageMap[packageSize] || 'custom'
}

// Types for alerts returned to the staff dashboard
type AlertPriority = 'high' | 'medium' | 'low'
interface Alert {
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  customer_id: string
  priority: AlertPriority
}

function generateJobAlerts(jobs: any[]): Alert[] {
  const alerts: Alert[] = []
  const now = new Date()
  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000)

  // Check for stuck jobs (in progress but no recent activity)
  const stuckJobs = jobs.filter(job => {
    if (job.status !== 'in_progress') return false
    if (!job.started_at) return false

    const lastActivity = new Date(job.started_at)
    return lastActivity < fourHoursAgo && job.progress_percentage > 0
  })

  stuckJobs.forEach(job => {
    alerts.push({
      type: 'warning',
      title: 'Stuck Job',
      message: `${job.business_name || 'Job'} has no progress in the last 4 hours`,
      customer_id: job.customer_id,
      priority: 'medium'
    })
  })

  // Check for high failure rates
  const highFailureJobs = jobs.filter(job => {
    const failureRate = job.directories_allocated > 0
      ? (job.directories_failed / job.directories_allocated) * 100
      : 0
    return failureRate > 20 // More than 20% failure rate
  })

  highFailureJobs.forEach(job => {
    const failureRate = Math.round((job.directories_failed / job.directories_allocated) * 100)
    alerts.push({
      type: 'error',
      title: 'High Failure Rate',
      message: `${job.business_name || 'Job'} has ${failureRate}% failure rate`,
      customer_id: job.customer_id,
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