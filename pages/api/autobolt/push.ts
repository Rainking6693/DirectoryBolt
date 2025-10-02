import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

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
    
    // Verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()
    
    if (customerError || !customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        message: `No customer found with ID: ${customerId}`
      })
    }
    
    // Check if customer already has a pending/in-progress job
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
    
    // Create job in AutoBolt queue
    const { data: job, error: jobError } = await supabase
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
    
    console.log(`✅ Customer pushed to AutoBolt: ${customerId} → Job: ${job.id}`)
    
    // Update customer status
    await supabase
      .from('customers')
      .update({
        status: 'queued',
        updatedAt: new Date().toISOString()
      })
      .eq('id', customerId)
    
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

