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
        directories_submitted,
        failed_directories,
        created_at,
        updated_at,
        processing_metadata
      `)
      .order('created_at', { ascending: true })

    if (customerError) {
      console.error('❌ Failed to get customers:', customerError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to retrieve customer data',
        details: customerError.message
      })
    }

    console.log(`✅ Retrieved ${customers?.length || 0} customers`)

    // Process queue data
    const queueData = processQueueData(customers || [])

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
      message: 'Failed to retrieve queue data',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

function processQueueData(customers: any[]) {
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
    // Get directory limits based on package type
    const directoryLimits = getDirectoryLimits(customer.package_type)
    const progressPercentage = directoryLimits > 0 
      ? Math.round((customer.directories_submitted / directoryLimits) * 100)
      : 0

    const estimatedCompletion = calculateEstimatedCompletion(customer, directoryLimits)
    
    return {
      id: customer.id,
      customer_id: customer.customer_id,
      business_name: customer.business_name,
      email: customer.email,
      package_type: customer.package_type,
      status: customer.status,
      priority_level: getPriorityLevel(customer.package_type),
      directories_allocated: directoryLimits,
      directories_submitted: customer.directories_submitted,
      directories_failed: customer.failed_directories,
      progress_percentage: progressPercentage,
      estimated_completion: estimatedCompletion,
      created_at: customer.created_at,
      updated_at: customer.updated_at,
      recent_activity: [],
      current_submissions: []
    }
  })

  // Get processing alerts
  const alerts = generateAlerts(customers)

  return {
    stats,
    queue: customerQueue,
    alerts,
    recent_activity: [],
    processing_summary: {
      total_directories_allocated: customers.reduce((sum, c) => sum + getDirectoryLimits(c.package_type), 0),
      total_directories_submitted: customers.reduce((sum, c) => sum + (c.directories_submitted || 0), 0),
      total_directories_failed: customers.reduce((sum, c) => sum + (c.failed_directories || 0), 0),
      overall_completion_rate: calculateOverallCompletionRate(customers)
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

function getPriorityLevel(packageType: string): number {
  const priorities: Record<string, number> = {
    starter: 4,
    growth: 3,
    professional: 2,
    pro: 1,
    enterprise: 1
  }
  return priorities[packageType] || 4
}

function calculateEstimatedCompletion(customer: any, directoryLimits: number): string | null {
  if (customer.status === 'completed') {
    return customer.updated_at
  }

  const remainingDirectories = directoryLimits - customer.directories_submitted
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
  const totalAllocated = customers.reduce((sum, c) => sum + getDirectoryLimits(c.package_type), 0)
  const totalSubmitted = customers.reduce((sum, c) => sum + (c.directories_submitted || 0), 0)
  
  return totalAllocated > 0 ? Math.round((totalSubmitted / totalAllocated) * 10000) / 100 : 0
}

function generateAlerts(customers: any[]): any[] {
  const alerts = []
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  // Check for stuck customers (no activity in the last hour)
  const stuckCustomers = customers.filter(customer => {
    if (customer.status === 'completed' || customer.status === 'failed') return false
    
    const lastActivity = new Date(customer.updated_at)
    return lastActivity < oneHourAgo
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
    const directoryLimits = getDirectoryLimits(customer.package_type)
    const failureRate = directoryLimits > 0 
      ? (customer.failed_directories / directoryLimits) * 100
      : 0
    
    return failureRate > 20 // More than 20% failure rate
  })

  highFailureCustomers.forEach(customer => {
    const directoryLimits = getDirectoryLimits(customer.package_type)
    const failureRate = Math.round((customer.failed_directories / directoryLimits) * 100)
    alerts.push({
      type: 'error',
      title: 'High Failure Rate',
      message: `${customer.business_name} has ${failureRate}% failure rate`,
      customer_id: customer.customer_id,
      priority: 'high'
    })
  })

  return alerts.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
  })
}