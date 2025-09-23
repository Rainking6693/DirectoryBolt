// Staff Dashboard Real-time Status API
// Provides immediate status updates for dashboard components

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { withStaffAuth } from '../../../lib/middleware/staff-auth'
import { withRateLimit, rateLimitConfigs } from '../../../lib/middleware/rate-limit'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📊 Staff requesting real-time status update')

    // Get live counts for dashboard
    const [
      { count: totalCustomers },
      { count: activeCustomers },
      { count: completedCustomers },
      { count: pendingCustomers },
      { count: queuedJobs },
      { count: processingJobs }
    ] = await Promise.all([
      supabase.from('customers').select('*', { count: 'exact', head: true }),
      supabase.from('customers').select('*', { count: 'exact', head: true }).in('status', ['active', 'in-progress', 'queued']),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('customers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('autobolt_processing_queue').select('*', { count: 'exact', head: true }).eq('status', 'queued'),
      supabase.from('autobolt_processing_queue').select('*', { count: 'exact', head: true }).eq('status', 'processing')
    ])

    // Get recent activity (customers updated in last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentActivity } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', oneHourAgo)

    // Get package breakdown
    const { data: packageData } = await supabase
      .from('customers')
      .select('package_type')

    const packageBreakdown = packageData?.reduce((acc, customer) => {
      const packageType = customer.package_type || 'unknown'
      acc[packageType] = (acc[packageType] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get directory submission totals
    const { data: directoryStats } = await supabase
      .from('customers')
      .select('directories_submitted, failed_directories')

    const totalDirectoriesSubmitted = directoryStats?.reduce((sum, c) => sum + (c.directories_submitted || 0), 0) || 0
    const totalDirectoriesFailed = directoryStats?.reduce((sum, c) => sum + (c.failed_directories || 0), 0) || 0
    const successRate = totalDirectoriesSubmitted > 0 
      ? Math.round(((totalDirectoriesSubmitted - totalDirectoriesFailed) / totalDirectoriesSubmitted) * 10000) / 100
      : 100

    console.log('✅ Real-time status data retrieved successfully')

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total_customers: totalCustomers || 0,
          active_customers: activeCustomers || 0,
          completed_customers: completedCustomers || 0,
          pending_customers: pendingCustomers || 0,
          recent_activity: recentActivity || 0
        },
        queue: {
          queued_jobs: queuedJobs || 0,
          processing_jobs: processingJobs || 0,
          total_in_queue: (queuedJobs || 0) + (processingJobs || 0)
        },
        package_breakdown: packageBreakdown,
        directory_stats: {
          total_submitted: totalDirectoriesSubmitted,
          total_failed: totalDirectoriesFailed,
          success_rate: successRate
        },
        system_status: {
          database_connected: true,
          autobolt_queue_active: (queuedJobs || 0) + (processingJobs || 0) > 0,
          last_updated: new Date().toISOString()
        }
      },
      retrieved_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Real-time status error:', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to retrieve real-time status',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Export with authentication and rate limiting middleware
export default withRateLimit(rateLimitConfigs.staff)(withStaffAuth(handler))