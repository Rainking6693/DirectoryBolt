import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// BYPASS MODE: In-memory queue for testing
const inMemoryQueue = new Map<string, any>()

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

interface PushToAutoBoltRequest {
  customerId: string
  priority?: number
}

interface PushToAutoBoltResponse {
  success: boolean
  job?: any
  jobId?: string
  error?: string
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PushToAutoBoltResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    // Check staff/admin authentication
    const authHeader = req.headers.authorization
    const staffSession = req.cookies.staff_session
    const adminKey = req.headers['x-admin-key']
    
    const validStaffKey = process.env.STAFF_API_KEY
    const validAdminKey = process.env.ADMIN_API_KEY
    
    const isStaffAuth = authHeader === `Bearer ${validStaffKey}` || !!staffSession
    const isAdminAuth = adminKey === validAdminKey || authHeader === `Bearer ${validAdminKey}`
    
    if (!isStaffAuth && !isAdminAuth) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Staff or admin authentication required'
      })
    }
    
    const { customerId, priority } = req.body as PushToAutoBoltRequest
    
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Customer ID is required'
      })
    }
    
    // BYPASS MODE: Use Supabase if configured, otherwise in-memory
    let customer: any
    let job: any
    
    if (supabase) {
      // Real Supabase flow
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single()
      
      if (customerError || !customerData) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found',
          message: `No customer found with ID: ${customerId}`
        })
      }
      
      customer = customerData
      
      // Check for existing jobs
      const { data: existingJobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('customer_id', customerId)
        .in('status', ['pending', 'in_progress'])
        .limit(1)
      
      if (existingJobs && existingJobs.length > 0) {
        return res.status(409).json({
          success: false,
          error: 'Job already exists',
          message: `Customer already has a ${existingJobs[0].status} job`
        })
      }
      
      // Create job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .insert({
          customer_id: customerId,
          status: 'pending',
          priority_level: priority || 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (jobError) {
        console.error('❌ Failed to create job:', jobError)
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: jobError.message
        })
      }
      
      job = jobData
      console.log(`✅ Customer pushed to AutoBolt (Supabase): ${customerId} → Job: ${job.id}`)
      
      // Update customer status
      await supabase
        .from('customers')
        .update({
          status: 'queued',
          updatedAt: new Date().toISOString()
        })
        .eq('id', customerId)
        
    } else {
      // In-memory bypass for testing
      customer = { id: customerId, businessName: 'Test Customer' }
      const jobId = `test-job-${Date.now()}`
      
      job = {
        id: jobId,
        customer_id: customerId,
        status: 'pending',
        priority_level: priority || 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      inMemoryQueue.set(jobId, job)
      console.log(`⚠️  Job created IN-MEMORY (Supabase not configured): ${jobId}`)
      console.warn('🔶 DEFERRED: Set SUPABASE_SERVICE_ROLE_KEY to use real database')
    }
    
    return res.status(201).json({
      success: true,
      job,
      jobId: job.id,
      message: `Customer ${customer.businessName} successfully added to AutoBolt queue`
    })
    
  } catch (error) {
    console.error('❌ AutoBolt push error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

