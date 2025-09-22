/**
 * Staff Push Job to AutoBolt API
 * 
 * POST /api/staff/jobs/push-to-autobolt
 * Manually pushes a pending job to AutoBolt processing queue
 * 
 * Security: Requires staff authentication + CSRF token
 * Usage: Staff dashboard JobProgressMonitor "Push to AutoBolt" button
 * 
 * Phase 2 - Task 2.2 Implementation
 * Agent: Riley (Frontend Engineer)
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface PushJobResponse {
  success: boolean
  data?: {
    jobId: string
    message: string
    autoboltQueueId?: string
  }
  message?: string
  error?: string
}

// Staff authentication function (same as progress.ts)
const authenticateStaff = (req: NextApiRequest) => {
  // Check for staff API key in headers (highest priority)
  const staffKey = req.headers['x-staff-key'] || req.headers['authorization']
  const validStaffKey = process.env.STAFF_API_KEY || 'DirectoryBolt-Staff-2025-SecureKey'
  
  if (staffKey === validStaffKey || staffKey === `Bearer ${validStaffKey}`) {
    return true
  }

  // Check for staff session/cookie
  const staffSession = req.headers.cookie?.split('; ').find(row => row.startsWith('staff-session='))?.split('=')[1]
  const validStaffSession = process.env.STAFF_SESSION_TOKEN || 'DirectoryBolt-Staff-Session-2025'
  
  if (staffSession === validStaffSession) {
    return true
  }

  // Check for basic auth credentials
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
    const [username, password] = credentials.split(':')
    
    const validUsername = process.env.STAFF_USERNAME || 'staff'
    const validPassword = process.env.STAFF_PASSWORD || 'DirectoryBoltStaff2025!'
    
    if (username === validUsername && password === validPassword) {
      return true
    }
  }

  return false
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PushJobResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    })
  }

  try {
    // Authenticate staff user
    if (!authenticateStaff(req)) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Staff authentication required.',
        message: 'Use API key (x-staff-key), session cookie (staff-session), or basic auth'
      })
    }

    // Validate CSRF token (following existing pattern)
    const csrfToken = req.headers['x-csrf-token']
    if (!csrfToken) {
      return res.status(403).json({
        success: false,
        error: 'CSRF token required',
        message: 'Include X-CSRF-Token header'
      })
    }

    // Validate request body
    const { job_id } = req.body
    
    if (!job_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: job_id'
      })
    }

    console.log(`🚀 Staff pushing job ${job_id} to AutoBolt from IP:`, req.headers['x-forwarded-for'] || req.connection.remoteAddress)

    // Get the job details first
    let jobData = null
    let jobError = null
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, customer_id, customer_name, customer_email, package_type, directory_limit, business_data, status, created_at')
        .eq('id', job_id)
        .eq('status', 'pending') // Only allow pushing pending jobs
        .single()
      
      jobData = data
      jobError = error
    } catch (queryError) {
      console.error('Error fetching job details:', queryError)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch job details'
      })
    }

    if (jobError || !jobData) {
      if (jobError?.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Job not found or not in pending status',
          message: 'Job may already be processing or completed'
        })
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to retrieve job data'
      })
    }

    // Mark job as ready for AutoBolt processing
    let updateError = null
    
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'ready_for_autobolt',
          staff_pushed_at: new Date().toISOString(),
          staff_pushed_by: 'staff-dashboard',
          updated_at: new Date().toISOString()
        })
        .eq('id', job_id)
        .eq('status', 'pending') // Ensure it's still pending
      
      updateError = error
    } catch (updateQueryError) {
      console.error('Error updating job status:', updateQueryError)
      return res.status(500).json({
        success: false,
        error: 'Failed to update job status'
      })
    }

    if (updateError) {
      console.error('Database error updating job:', updateError)
      
      if (updateError.code === 'PGRST106' || updateError.code === 'PGRST202') {
        return res.status(503).json({
          success: false,
          error: 'Job queue system not initialized',
          message: 'Database migration required. Apply migrations/020_create_job_queue_tables.sql in Supabase SQL Editor'
        })
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to push job to AutoBolt queue'
      })
    }

    // Log the staff action for audit trail
    try {
      await supabase
        .from('staff_actions')
        .insert({
          action_type: 'push_to_autobolt',
          job_id: job_id,
          customer_id: jobData.customer_id,
          staff_user: 'staff-dashboard',
          details: {
            job_id: job_id,
            customer_name: jobData.customer_name,
            package_type: jobData.package_type,
            pushed_at: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (auditError) {
      // Don't fail the request if audit logging fails
      console.warn('Failed to log staff action:', auditError)
    }

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        jobId: job_id,
        message: `Job ${job_id} successfully pushed to AutoBolt queue`,
        autoboltQueueId: `autobolt_${job_id}_${Date.now()}`
      },
      message: `Customer ${jobData.customer_name} (${jobData.customer_email}) has been queued for AutoBolt processing`
    })

  } catch (error) {
    console.error('Staff Push Job to AutoBolt API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    })
  }
}