// Staff Dashboard Analytics API
// Provides real-time analytics from Supabase database

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('📊 Staff requesting analytics data')

    // Get customer statistics
    const { data: customerStats, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        customer_id,
        business_name,
        package_type,
        status,
        total_directories_allocated,
        directories_submitted,
        failed_directories,
        created_at,
        updated_at
      `)

    if (customerError) {
      console.error('❌ Failed to get customer stats:', customerError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to retrieve customer statistics'
      })
    }

    // Get directory submission statistics
    const { data: submissionStats, error: submissionError } = await supabase
      .from('directory_submissions')
      .select(`
        id,
        customer_id,
        directory_name,
        submission_status,
        submitted_at,
        approved_at,
        created_at
      `)

    if (submissionError) {
      console.error('❌ Failed to get submission stats:', submissionError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to retrieve submission statistics'
      })
    }

    // Get queue history
    const { data: queueHistory, error: queueError } = await supabase
      .from('queue_history')
      .select(`
        id,
        customer_id,
        status_from,
        status_to,
        directories_processed,
        directories_failed,
        processing_time_seconds,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (queueError) {
      console.error('❌ Failed to get queue history:', queueError)
    }

    // Calculate analytics
    const analytics = calculateAnalytics(customerStats || [], submissionStats || [], queueHistory || [])

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
      message: 'Failed to retrieve analytics data'
    })
  }
}

function calculateAnalytics(customers: any[], submissions: any[], queueHistory: any[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Customer statistics
  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'active').length
  const pendingCustomers = customers.filter(c => c.status === 'pending').length
  const completedCustomers = customers.filter(c => c.status === 'completed').length

  // Package type distribution
  const packageDistribution = customers.reduce((acc, customer) => {
    acc[customer.package_type] = (acc[customer.package_type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Directory submission statistics
  const totalSubmissions = submissions.length
  const pendingSubmissions = submissions.filter(s => s.submission_status === 'pending').length
  const submittedSubmissions = submissions.filter(s => s.submission_status === 'submitted').length
  const approvedSubmissions = submissions.filter(s => s.submission_status === 'approved').length
  const rejectedSubmissions = submissions.filter(s => s.submission_status === 'rejected').length

  // Success rate
  const successRate = totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0

  // Daily statistics
  const todaySubmissions = submissions.filter(s => {
    const submissionDate = new Date(s.created_at)
    return submissionDate >= today
  }).length

  const thisWeekSubmissions = submissions.filter(s => {
    const submissionDate = new Date(s.created_at)
    return submissionDate >= thisWeek
  }).length

  const thisMonthSubmissions = submissions.filter(s => {
    const submissionDate = new Date(s.created_at)
    return submissionDate >= thisMonth
  }).length

  // Processing statistics
  const totalDirectoriesAllocated = customers.reduce((sum, c) => sum + (c.total_directories_allocated || 0), 0)
  const totalDirectoriesSubmitted = customers.reduce((sum, c) => sum + (c.directories_submitted || 0), 0)
  const totalDirectoriesFailed = customers.reduce((sum, c) => sum + (c.failed_directories || 0), 0)

  // Average processing time
  const processingTimes = queueHistory
    .filter(q => q.processing_time_seconds && q.processing_time_seconds > 0)
    .map(q => q.processing_time_seconds)
  
  const avgProcessingTime = processingTimes.length > 0 
    ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
    : 0

  // Recent activity (last 24 hours)
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const recentActivity = {
    newCustomers: customers.filter(c => new Date(c.created_at) >= last24Hours).length,
    completedSubmissions: submissions.filter(s => {
      const approvedDate = s.approved_at ? new Date(s.approved_at) : null
      return approvedDate && approvedDate >= last24Hours
    }).length,
    failedSubmissions: submissions.filter(s => {
      const createdDate = new Date(s.created_at)
      return createdDate >= last24Hours && s.submission_status === 'rejected'
    }).length
  }

  // Top performing directories
  const directoryPerformance = submissions.reduce((acc, submission) => {
    const dirName = submission.directory_name
    if (!acc[dirName]) {
      acc[dirName] = { total: 0, approved: 0, rejected: 0 }
    }
    acc[dirName].total++
    if (submission.submission_status === 'approved') {
      acc[dirName].approved++
    } else if (submission.submission_status === 'rejected') {
      acc[dirName].rejected++
    }
    return acc
  }, {} as Record<string, { total: number; approved: number; rejected: number }>)

  const topDirectories = Object.entries(directoryPerformance)
    .map(([name, stats]) => ({
      name,
      total: stats.total,
      approved: stats.approved,
      rejected: stats.rejected,
      success_rate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  return {
    overview: {
      total_customers: totalCustomers,
      active_customers: activeCustomers,
      pending_customers: pendingCustomers,
      completed_customers: completedCustomers,
      total_submissions: totalSubmissions,
      success_rate: Math.round(successRate * 100) / 100
    },
    submissions: {
      total: totalSubmissions,
      pending: pendingSubmissions,
      submitted: submittedSubmissions,
      approved: approvedSubmissions,
      rejected: rejectedSubmissions,
      success_rate: Math.round(successRate * 100) / 100
    },
    directories: {
      total_allocated: totalDirectoriesAllocated,
      total_submitted: totalDirectoriesSubmitted,
      total_failed: totalDirectoriesFailed,
      completion_rate: totalDirectoriesAllocated > 0 
        ? Math.round((totalDirectoriesSubmitted / totalDirectoriesAllocated) * 10000) / 100 
        : 0
    },
    performance: {
      avg_processing_time_seconds: Math.round(avgProcessingTime),
      today_submissions: todaySubmissions,
      this_week_submissions: thisWeekSubmissions,
      this_month_submissions: thisMonthSubmissions
    },
    package_distribution: packageDistribution,
    recent_activity: recentActivity,
    top_directories: topDirectories,
    trends: {
      daily_submissions: calculateDailyTrends(submissions),
      weekly_customers: calculateWeeklyTrends(customers)
    }
  }
}

function calculateDailyTrends(submissions: any[]) {
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    
    const daySubmissions = submissions.filter(s => {
      const submissionDate = new Date(s.created_at)
      return submissionDate >= dayStart && submissionDate < dayEnd
    }).length

    last7Days.push({
      date: dayStart.toISOString().split('T')[0],
      submissions: daySubmissions
    })
  }
  return last7Days
}

function calculateWeeklyTrends(customers: any[]) {
  const last4Weeks = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const weekCustomers = customers.filter(c => {
      const customerDate = new Date(c.created_at)
      return customerDate >= weekStart && customerDate < weekEnd
    }).length

    last4Weeks.push({
      week: `Week ${4 - i}`,
      customers: weekCustomers
    })
  }
  return last4Weeks
}
