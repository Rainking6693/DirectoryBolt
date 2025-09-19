// Staff Dashboard Queue API
// Provides real-time customer queue data from Supabase

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
    console.log('📋 Staff requesting queue data')

    // Get all customers with their current status
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select(`
        id,
        customer_id,
        business_name,
        email,
        package_type,
        status,
        total_directories_allocated,
        directories_submitted,
        failed_directories,
        priority_level,
        created_at,
        updated_at,
        processing_metadata
      `)
      .order('priority_level', { ascending: true })
      .order('created_at', { ascending: true })

    if (customerError) {
      console.error('❌ Failed to get customers:', customerError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to retrieve customer data'
      })
    }

    // Get recent queue history
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
        error_message,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (queueError) {
      console.error('❌ Failed to get queue history:', queueError)
    }

    // Get current directory submissions
    const { data: submissions, error: submissionError } = await supabase
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
      .order('created_at', { ascending: false })
      .limit(100)

    if (submissionError) {
      console.error('❌ Failed to get submissions:', submissionError)
    }

    // Process queue data
    const queueData = processQueueData(customers || [], queueHistory || [], submissions || [])

    console.log('✅ Staff queue data retrieved successfully')

    res.status(200).json({
      success: true,
      data: queueData,
      retrieved_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Staff queue error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve queue data'
    })
  }
}

function processQueueData(customers: any[], queueHistory: any[], submissions: any[]) {
  const now = new Date()
  
  // Categorize customers by status
  const pendingCustomers = customers.filter(c => c.status === 'pending')
  const processingCustomers = customers.filter(c => c.status === 'in-progress')
  const completedCustomers = customers.filter(c => c.status === 'completed')
  const failedCustomers = customers.filter(c => c.status === 'failed')

  // Calculate queue statistics
  const stats = {
    pending: pendingCustomers.length,
    processing: processingCustomers.length,
    completed: completedCustomers.length,
    failed: failedCustomers.length,
    total: customers.length,
    completedToday: completedCustomers.filter(c => {
      const completedDate = new Date(c.updated_at)
      return completedDate.toDateString() === now.toDateString()
    }).length
  }

  // Process customer queue with additional data
  const customerQueue = customers.map(customer => {
    const customerSubmissions = submissions.filter(s => s.customer_id === customer.customer_id)
    const recentHistory = queueHistory.filter(h => h.customer_id === customer.customer_id).slice(0, 5)
    
    const progressPercentage = customer.total_directories_allocated > 0 
      ? Math.round((customer.directories_submitted / customer.total_directories_allocated) * 100)
      : 0

    const estimatedCompletion = calculateEstimatedCompletion(customer, customerSubmissions)
    
    return {
      id: customer.id,
      customer_id: customer.customer_id,
      business_name: customer.business_name,
      email: customer.email,
      package_type: customer.package_type,
      status: customer.status,
      priority_level: customer.priority_level,
      directories_allocated: customer.total_directories_allocated,
      directories_submitted: customer.directories_submitted,
      directories_failed: customer.failed_directories,
      progress_percentage: progressPercentage,
      estimated_completion: estimatedCompletion,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
      recent_activity: recentHistory,
      current_submissions: customerSubmissions.slice(0, 5)
    }
  })

  // Get processing alerts
  const alerts = generateAlerts(customers, queueHistory, submissions)

  // Get recent activity
  const recentActivity = queueHistory.slice(0, 20).map(activity => ({
    id: activity.id,
    customer_id: activity.customer_id,
    action: `${activity.status_from} → ${activity.status_to}`,
    directories_processed: activity.directories_processed,
    directories_failed: activity.directories_failed,
    processing_time: activity.processing_time_seconds,
    error_message: activity.error_message,
    timestamp: activity.created_at
  }))

  return {
    stats,
    queue: customerQueue,
    alerts,
    recent_activity: recentActivity,
    processing_summary: {
      total_directories_allocated: customers.reduce((sum, c) => sum + c.total_directories_allocated, 0),
      total_directories_submitted: customers.reduce((sum, c) => sum + c.directories_submitted, 0),
      total_directories_failed: customers.reduce((sum, c) => sum + c.failed_directories, 0),
      overall_completion_rate: calculateOverallCompletionRate(customers)
    }
  }
}

function calculateEstimatedCompletion(customer: any, submissions: any[]): string | null {
  if (customer.status === 'completed') {
    return customer.updated_at
  }

  const remainingDirectories = customer.total_directories_allocated - customer.directories_submitted
  if (remainingDirectories <= 0) {
    return null
  }

  // Estimate based on package type and current progress
  const avgTimePerDirectory = getAverageTimePerDirectory(customer.package_type)
  const estimatedMinutes = remainingDirectories * avgTimePerDirectory
  const estimatedCompletion = new Date(Date.now() + estimatedMinutes * 60 * 1000)
  
  return estimatedCompletion.toISOString()
}

function getAverageTimePerDirectory(packageType: string): number {
  const timeMap: Record<string, number> = {
    starter: 3,      // 3 minutes per directory
    growth: 2,       // 2 minutes per directory
    professional: 1.5, // 1.5 minutes per directory
    pro: 1,          // 1 minute per directory
    enterprise: 0.5  // 30 seconds per directory
  }
  
  return timeMap[packageType] || 2
}

function calculateOverallCompletionRate(customers: any[]): number {
  const totalAllocated = customers.reduce((sum, c) => sum + c.total_directories_allocated, 0)
  const totalSubmitted = customers.reduce((sum, c) => sum + c.directories_submitted, 0)
  
  return totalAllocated > 0 ? Math.round((totalSubmitted / totalAllocated) * 10000) / 100 : 0
}

function generateAlerts(customers: any[], queueHistory: any[], submissions: any[]): any[] {
  const alerts = []
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  // Check for stuck customers (no activity in the last hour)
  const stuckCustomers = customers.filter(customer => {
    if (customer.status === 'completed' || customer.status === 'failed') return false
    
    const lastActivity = queueHistory
      .filter(h => h.customer_id === customer.customer_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    
    if (!lastActivity) return true
    
    const lastActivityTime = new Date(lastActivity.created_at)
    return lastActivityTime < oneHourAgo
  })

  stuckCustomers.forEach(customer => {
    alerts.push({
      type: 'warning',
      title: 'Stuck Customer',
      message: `${customer.business_name} has no activity in the last hour`,
      customer_id: customer.customer_id,
      priority: 'medium'
    })
  })

  // Check for high failure rates
  const highFailureCustomers = customers.filter(customer => {
    const failureRate = customer.total_directories_allocated > 0 
      ? (customer.failed_directories / customer.total_directories_allocated) * 100
      : 0
    
    return failureRate > 20 // More than 20% failure rate
  })

  highFailureCustomers.forEach(customer => {
    const failureRate = Math.round((customer.failed_directories / customer.total_directories_allocated) * 100)
    alerts.push({
      type: 'error',
      title: 'High Failure Rate',
      message: `${customer.business_name} has ${failureRate}% failure rate`,
      customer_id: customer.customer_id,
      priority: 'high'
    })
  })

  // Check for overdue customers
  const overdueCustomers = customers.filter(customer => {
    if (customer.status === 'completed') return false
    
    const createdDate = new Date(customer.created_at)
    const daysSinceCreated = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    
    // Different thresholds based on package type
    const thresholds: Record<string, number> = {
      starter: 3,      // 3 days
      growth: 2,       // 2 days
      professional: 1, // 1 day
      pro: 0.5,        // 12 hours
      enterprise: 0.25 // 6 hours
    }
    
    return daysSinceCreated > (thresholds[customer.package_type] || 2)
  })

  overdueCustomers.forEach(customer => {
    const createdDate = new Date(customer.created_at)
    const daysSinceCreated = Math.round((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
    
    alerts.push({
      type: 'error',
      title: 'Overdue Customer',
      message: `${customer.business_name} is ${daysSinceCreated} days overdue`,
      customer_id: customer.customer_id,
      priority: 'high'
    })
  })

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
  })
}
