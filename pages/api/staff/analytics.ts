// Staff Dashboard Analytics API
// Provides real-time analytics from Supabase database

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { withStaffAuth } from '../../../lib/middleware/staff-auth'
import { withRateLimit, rateLimitConfigs } from '../../../lib/middleware/rate-limit'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📊 Staff requesting analytics data')

    // Build Supabase client at request time; return 503 if not configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'Supabase is not configured on this environment',
        details: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Get customer statistics (list used for both aggregates and drilldown)
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        business_name,
        email,
        package_type,
        status,
        created_at,
        updated_at
      `)

    if (customerError) {
      console.error('❌ Failed to get customers:', customerError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to retrieve customer statistics',
        details: customerError.message
      })
    }

    console.log(`✅ Retrieved ${customers?.length || 0} customers for analytics`)

    // Optional: drilldown lists based on query param
    const detail = (req.query.detail as string | undefined)?.toLowerCase()
    if (detail) {
      const lists = buildDrilldownLists(customers || [])
      const allowed = ['total_customers','active_customers','completed_customers','pending_customers']
      if (!allowed.includes(detail)) {
        return res.status(400).json({ error: 'Invalid detail parameter', message: `Use one of: ${allowed.join(', ')}` })
      }
      return res.status(200).json({ success: true, data: (lists as any)[detail], retrieved_at: new Date().toISOString() })
    }

    // Calculate analytics from customers data
    const analytics = calculateSimpleAnalytics(customers || [])

    console.log('✅ Staff analytics data retrieved successfully')

    res.status(200).json({
      success: true,
      data: analytics,
      retrieved_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Staff analytics error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve analytics data',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function buildDrilldownLists(customers: any[]) {
  const active = customers.filter((c: any) => ['active','in-progress','in_progress'].includes((c.status||'').toLowerCase()))
  const completed = customers.filter((c: any) => ['completed','complete'].includes((c.status||'').toLowerCase()))
  const pending = customers.filter((c: any) => ['pending'].includes((c.status||'').toLowerCase()))
  return {
    total_customers: customers,
    active_customers: active,
    completed_customers: completed,
    pending_customers: pending,
  }
}

function calculateSimpleAnalytics(customers: any[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisMonth = new Date(today.getFullYear(), now.getMonth(), 1)

  // Basic customer statistics
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'active' || c.status === 'in-progress').length
  const completedCustomers = customers.filter(c => c.status === 'completed').length
  const pendingCustomers = customers.filter(c => c.status === 'pending').length

  // Package type breakdown
  const packageBreakdown = customers.reduce((acc, customer) => {
    const packageType = customer.package_type || 'unknown'
    acc[packageType] = (acc[packageType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Directory statistics
  const totalDirectoriesAllocated = customers.reduce((sum, c) => sum + getDirectoryLimits(c.package_type), 0)
  const totalDirectoriesSubmitted = customers.reduce((sum, c) => sum + (c.directories_submitted || 0), 0)
  const totalDirectoriesFailed = customers.reduce((sum, c) => sum + (c.failed_directories || 0), 0)
  const overallCompletionRate = totalDirectoriesAllocated > 0 
    ? Math.round((totalDirectoriesSubmitted / totalDirectoriesAllocated) * 10000) / 100 
    : 0

  // Recent activity (customers updated in last 24 hours)
  const recentActivity = customers.filter(customer => {
    const updatedAt = new Date(customer.updated_at)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return updatedAt > oneDayAgo
  }).length

  // Performance metrics
  const avgDirectoriesPerCustomer = totalCustomers > 0 ? Math.round(totalDirectoriesSubmitted / totalCustomers) : 0
  const successRate = totalDirectoriesSubmitted > 0 
    ? Math.round(((totalDirectoriesSubmitted - totalDirectoriesFailed) / totalDirectoriesSubmitted) * 10000) / 100
    : 100

  return {
    overview: {
      total_customers: totalCustomers,
      active_customers: activeCustomers,
      completed_customers: completedCustomers,
      pending_customers: pendingCustomers,
      recent_activity: recentActivity
    },
    package_breakdown: packageBreakdown,
    directory_stats: {
      total_allocated: totalDirectoriesAllocated,
      total_submitted: totalDirectoriesSubmitted,
      total_failed: totalDirectoriesFailed,
      completion_rate: overallCompletionRate,
      success_rate: successRate
    },
    performance_metrics: {
      avg_directories_per_customer: avgDirectoriesPerCustomer,
      processing_efficiency: successRate,
      customer_satisfaction: completedCustomers > 0 ? Math.round((completedCustomers / totalCustomers) * 10000) / 100 : 0
    },
    trends: {
      daily_submissions: calculateDailyTrends(customers),
      package_performance: calculatePackagePerformance(customers)
    }
  }
}

function getDirectoryLimits(packageType: string): number {
  const limits: Record<string, number> = {
    starter: 50,
    growth: 150,
    professional: 300,
    pro: 500,
    enterprise: 1000
  }
  return limits[packageType] || 50
}

function calculateDailyTrends(customers: any[]) {
  const now = new Date()
  const last7Days = []
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    
    const dayCustomers = customers.filter(customer => {
      const updatedAt = new Date(customer.updated_at)
      return updatedAt >= dayStart && updatedAt < dayEnd
    })
    
    last7Days.push({
      date: dayStart.toISOString().split('T')[0],
      customers_updated: dayCustomers.length,
      directories_submitted: dayCustomers.reduce((sum, c) => sum + (c.directories_submitted || 0), 0)
    })
  }
  
  return last7Days
}

function calculatePackagePerformance(customers: any[]) {
  const packageStats: Record<string, any> = {}
  
  customers.forEach(customer => {
    const packageType = customer.package_type || 'unknown'
    if (!packageStats[packageType]) {
      packageStats[packageType] = {
        total_customers: 0,
        total_directories_allocated: 0,
        total_directories_submitted: 0,
        total_directories_failed: 0,
        completion_rate: 0
      }
    }
    
    const limits = getDirectoryLimits(packageType)
    packageStats[packageType].total_customers++
    packageStats[packageType].total_directories_allocated += limits
    packageStats[packageType].total_directories_submitted += customer.directories_submitted || 0
    packageStats[packageType].total_directories_failed += customer.failed_directories || 0
  })
  
  // Calculate completion rates
  Object.keys(packageStats).forEach(packageType => {
    const stats = packageStats[packageType]
    stats.completion_rate = stats.total_directories_allocated > 0 
      ? Math.round((stats.total_directories_submitted / stats.total_directories_allocated) * 10000) / 100
      : 0
  })
  
  return packageStats
}

// Export with authentication and rate limiting middleware
export default withRateLimit(rateLimitConfigs.staff)(withStaffAuth(handler))