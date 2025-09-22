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

    // Verify job exists and can be completed
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

    if (!['processing', 'paused'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        error: `Job status is ${job.status}, cannot complete`
      })
    }

    // Calculate processing time
    const startedAt = new Date(job.started_at)
    const completedAt = new Date()
    const processingTimeMinutes = Math.round((completedAt.getTime() - startedAt.getTime()) / (1000 * 60))

    // Final progress calculation
    let finalProgress = 100.0
    if (status === 'failed' || status === 'cancelled') {
      // Calculate actual progress for failed/cancelled jobs from submissions
      const { data: progressStats } = await supabase
        .from('directory_submissions')
        .select('submission_status')
        .eq('queue_id', jobId)
      
      const { data: jobLimit } = await supabase
        .from('autobolt_processing_queue')
        .select('directory_limit')
        .eq('id', jobId)
        .single()
      
      if (progressStats && jobLimit?.directory_limit) {
        const completed = progressStats.filter(s => ['approved', 'submitted'].includes(s.submission_status)).length
        const failed = progressStats.filter(s => ['failed', 'rejected'].includes(s.submission_status)).length
        const totalProcessed = completed + failed
        finalProgress = Math.round((totalProcessed / jobLimit.directory_limit) * 100)
      }
    }

    // Update job as completed
    const jobUpdateData: any = {
      status: status,
      completed_at: completedAt.toISOString(),
      progress_percentage: finalProgress,
      updated_at: completedAt.toISOString()
    }

    // Add summary data if provided
    if (summary) {
      jobUpdateData.directories_to_process = summary.totalDirectories
      jobUpdateData.directories_completed = summary.successfulSubmissions
      jobUpdateData.directories_failed = summary.failedSubmissions
      jobUpdateData.metadata = {
        ...jobUpdateData.metadata,
        completion_summary: {
          total_directories: summary.totalDirectories,
          successful_submissions: summary.successfulSubmissions,
          failed_submissions: summary.failedSubmissions,
          skipped_directories: summary.skippedDirectories,
          processing_time_minutes: processingTimeMinutes,
          completed_at: completedAt.toISOString()
        },
        final_results: finalResults
      }
    }

    if (errorMessage) {
      jobUpdateData.error_message = errorMessage
    }

    // Update job status directly since RPC function may not exist
    const { error: directUpdateError } = await supabase
      .from('autobolt_processing_queue')
      .update(jobUpdateData)
      .eq('id', jobId)

    if (directUpdateError) {
      console.error('Error updating job directly:', directUpdateError)
      return res.status(500).json({
        success: false,
        error: 'Failed to complete job'
      })
    }

    // If we have summary data, also apply it via direct update
    if (summary || errorMessage) {
      const { error: metadataUpdateError } = await supabase
        .from('autobolt_processing_queue')
        .update({
          error_message: errorMessage,
          metadata: jobUpdateData.metadata
        })
        .eq('id', jobId)

      if (metadataUpdateError) {
        console.error('Error updating job metadata:', metadataUpdateError)
      }
    }

    // Get final job state for response
    const { data: finalJob, error: finalJobError } = await supabase
      .from('autobolt_processing_queue')
      .select('customer_id, status, completed_at')
      .eq('id', jobId)
      .single()
      
    // Get directory submission statistics
    const { data: submissionStats } = await supabase
      .from('directory_submissions')
      .select('submission_status')
      .eq('queue_id', jobId)
      
    const directoriesCompleted = submissionStats?.filter(s => ['approved', 'submitted'].includes(s.submission_status)).length || 0
    const directoriesFailed = submissionStats?.filter(s => ['failed', 'rejected'].includes(s.submission_status)).length || 0

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
        finalStatus: status,
        progressPercentage: finalProgress,
        directoriesCompleted: directoriesCompleted || summary?.successfulSubmissions || 0,
        directoriesFailed: directoriesFailed || summary?.failedSubmissions || 0,
        processingTimeMinutes,
        completedAt: completedAt.toISOString()
      },
      message: `Job ${jobId} ${status} successfully. Processing took ${processingTimeMinutes} minutes.`
    })

  } catch (error) {
    console.error('AutoBolt Complete Job API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    })
  }
}