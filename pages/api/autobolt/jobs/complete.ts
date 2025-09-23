/**
 * AutoBolt Jobs API - Complete Job
 * 
 * POST /api/autobolt/jobs/complete
 * Marks a job as completed and finalizes all processing
 * 
 * Security: Requires AUTOBOLT_API_KEY authentication
 * Usage: AutoBolt Chrome extension calls this when job processing is finished
 * 
 * Phase 1 - Task 1.4 Implementation
 * Agent: Shane (Backend Developer)
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CompleteJobRequest {
  jobId: string
  status: 'completed' | 'failed' | 'cancelled'
  summary?: {
    totalDirectories: number
    successfulSubmissions: number
    failedSubmissions: number
    skippedDirectories: number
    processingTimeMinutes: number
  }
  errorMessage?: string
  finalResults?: any
}

interface CompleteJobResponse {
  success: boolean
  data?: {
    jobId: string
    customerId: string
    finalStatus: string
    progressPercentage: number
    directoriesCompleted: number
    directoriesFailed: number
    processingTimeMinutes: number
    completedAt: string
  }
  message?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CompleteJobResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
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

    const { jobId, status, summary, errorMessage, finalResults }: CompleteJobRequest = req.body

    // Validate required fields
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'jobId is required'
      })
    }

    if (!status || !['completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'status must be completed, failed, or cancelled'
      })
    }

    // Verify job exists and can be completed (autobolt_processing_queue)
    const { data: job, error: jobCheckError } = await supabase
      .from('autobolt_processing_queue')
      .select('id, customer_id, status, started_at')
      .eq('id', jobId)
      .single()

    if (jobCheckError || !job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      })
    }

    if (!['processing'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        error: `Job status is ${job.status}, cannot complete`
      })
    }

    // Calculate processing time
    const startedAt = new Date(job.started_at)
    const completedAt = new Date()
    const processingTimeMinutes = Math.round((completedAt.getTime() - startedAt.getTime()) / (1000 * 60))

    // Not calculating percentage here for jobs model; staff progress uses job_results
    let finalProgress = 100.0

    // Update job as completed in autobolt_processing_queue
    const jobUpdateData: any = {
      status: status === 'completed' ? 'completed' : status,
      completed_at: completedAt.toISOString(),
      updated_at: completedAt.toISOString()
    }

    if (errorMessage) {
      jobUpdateData.error_message = errorMessage
    }

    // Update job status in autobolt_processing_queue
    const { error: directUpdateError } = await supabase
      .from('autobolt_processing_queue')
      .update(jobUpdateData)
      .eq('id', jobId)

    if (directUpdateError) {
      console.error('Error updating autobolt job:', directUpdateError)
      return res.status(500).json({
        success: false,
        error: 'Failed to complete job'
      })
    }

    // Update customer status based on job completion
    const customerStatus = status === 'completed' ? 'completed' : 'failed'
    const { error: customerUpdateError } = await supabase
      .from('customers')
      .update({
        status: customerStatus,
        directories_submitted: summary?.successfulSubmissions || 0,
        failed_directories: summary?.failedSubmissions || 0,
        updated_at: completedAt.toISOString()
      })
      .eq('customer_id', job.customer_id)

    if (customerUpdateError) {
      console.error('Error updating customer status:', customerUpdateError)
    }

    // Get final job state for response
    const { data: finalJob, error: finalJobError } = await supabase
      .from('autobolt_processing_queue')
      .select('customer_id, status, completed_at')
      .eq('id', jobId)
      .single()
      
    const directoriesCompleted = summary?.successfulSubmissions || 0
    const directoriesFailed = summary?.failedSubmissions || 0

    if (finalJobError) {
      console.error('Error getting final job state:', finalJobError)
    }

    // Log completion for monitoring
    console.log(`✅ Job ${jobId} completed with status ${status}`)
    console.log(`📊 Processing time: ${processingTimeMinutes} minutes`)
    console.log(`📈 Final progress: ${finalProgress}%`)
    
    if (summary) {
      console.log(`📁 Directories: ${summary.successfulSubmissions}/${summary.totalDirectories} successful`)
    }

    return res.status(200).json({
      success: true,
      data: {
        jobId,
        customerId: finalJob?.customer_id || job.customer_id,
        finalStatus: finalJob?.status || status,
        progressPercentage: finalProgress,
        directoriesCompleted: directoriesCompleted || summary?.successfulSubmissions || 0,
        directoriesFailed: directoriesFailed || summary?.failedSubmissions || 0,
        processingTimeMinutes,
        completedAt: completedAt.toISOString()
      },
      message: `Job ${jobId} ${finalJob?.status || status} successfully. Processing took ${processingTimeMinutes} minutes.`
    })

  } catch (error) {
    console.error('AutoBolt Complete Job API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    })
  }
}