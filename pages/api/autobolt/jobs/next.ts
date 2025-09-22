/**
 * AutoBolt Jobs API - Get Next Job
 * 
 * GET /api/autobolt/jobs/next
 * Returns the next job in queue for AutoBolt processing
 * 
 * Security: Requires AUTOBOLT_API_KEY authentication
 * Usage: AutoBolt Chrome extension calls this to get next customer to process
 * 
 * Phase 1 - Task 1.2 Implementation
 * Agent: Shane (Backend Developer)
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface JobResponse {
  success: boolean
  data?: {
    jobId: string
    customerId: string
    customerName: string
    customerEmail: string
    packageType: string
    directoryLimit: number
    businessData: any
    createdAt: string
  }
  message?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobResponse>
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    })
  }

  try {
    // Authenticate using API key
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    
    if (!apiKey || apiKey !== process.env.AUTOBOLT_API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Valid AUTOBOLT_API_KEY required.'
      })
    }

    // Get extension ID from headers for tracking
    const extensionId = req.headers['x-extension-id'] as string || 'unknown-extension'

    // Get next job in queue using the new function
    let nextJob = null
    let jobError = null
    
    try {
      const { data, error } = await supabase
        .rpc('get_next_job_in_queue')
      
      if (data && data.get_next_job_in_queue) {
        // Extract the job data from the JSON response
        const jobData = data.get_next_job_in_queue
        nextJob = {
          job_id: jobData.id,
          customer_id: jobData.customer_id,
          customer_name: jobData.business_name,
          customer_email: jobData.email,
          package_type: jobData.package_type,
          directory_limit: jobData.directory_limit,
          business_data: jobData.metadata,
          created_at: jobData.created_at
        }
      }
      jobError = error
    } catch (rpcError) {
      console.log('RPC function error, using fallback query:', rpcError)
      
      // Fallback to direct table query
      const { data, error } = await supabase
        .from('autobolt_processing_queue')
        .select('id, customer_id, business_name, email, package_type, directory_limit, metadata, created_at')
        .eq('status', 'queued')
        .order('priority_level', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1)
        .single()
      
      if (data) {
        // Transform data to match expected format
        nextJob = {
          job_id: data.id,
          customer_id: data.customer_id,
          customer_name: data.business_name,
          customer_email: data.email,
          package_type: data.package_type,
          directory_limit: data.directory_limit,
          business_data: data.metadata,
          created_at: data.created_at
        }
        
        // Mark as processing in fallback
        await supabase
          .from('autobolt_processing_queue')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id)
      }
      
      jobError = error
    }

    if (jobError) {
      console.error('Database error getting next job:', jobError)
      
      // Provide helpful error message if tables don't exist
      if (jobError.code === 'PGRST106' || jobError.code === 'PGRST202') {
        return res.status(503).json({
          success: false,
          error: 'Job queue system not initialized',
          message: 'Database migration required. Apply migrations/020_create_job_queue_tables.sql in Supabase SQL Editor',
          migrationRequired: true
        })
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch next job from queue'
      })
    }

    // If no jobs available
    if (!nextJob) {
      return res.status(200).json({
        success: true,
        message: 'No jobs currently in queue'
      })
    }

    // Mark job as in progress and assign to extension (skip if already done in fallback)
    let updateError = null
    
    if (nextJob && !nextJob.fallback_updated) {
      try {
        const { error } = await supabase
          .rpc('mark_job_in_progress', {
            job_id_param: nextJob.job_id,
            extension_id: extensionId
          })
        updateError = error
      } catch (rpcError) {
        // Fallback: direct table update if RPC function doesn't exist
        console.log('Using fallback job assignment')
        
        const { error } = await supabase
          .from('autobolt_processing_queue')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            metadata: { ...nextJob.business_data, assigned_to: extensionId },
            updated_at: new Date().toISOString()
          })
          .eq('id', nextJob.job_id)
          .eq('status', 'queued') // Only update if still queued
        
        updateError = error
      }
    }

    if (updateError) {
      console.error('Error marking job as in progress:', updateError)
      return res.status(500).json({
        success: false,
        error: 'Failed to assign job'
      })
    }

    // Return job data for processing
    return res.status(200).json({
      success: true,
      data: {
        jobId: nextJob.job_id,
        customerId: nextJob.customer_id,
        customerName: nextJob.customer_name,
        customerEmail: nextJob.customer_email,
        packageType: nextJob.package_type,
        directoryLimit: nextJob.directory_limit,
        businessData: nextJob.business_data,
        createdAt: nextJob.created_at
      },
      message: `Job ${nextJob.job_id} assigned to extension ${extensionId}`
    })

  } catch (error) {
    console.error('AutoBolt Get Next Job API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    })
  }
}