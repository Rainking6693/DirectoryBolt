/**
 * AutoBolt Jobs API - Update Job Progress
 * 
 * POST /api/autobolt/jobs/update
 * Updates job progress and adds directory submission results
 * 
 * Security: Requires AUTOBOLT_API_KEY authentication
 * Usage: AutoBolt Chrome extension calls this to report progress
 * 
 * Phase 1 - Task 1.3 Implementation
 * Agent: Shane (Backend Developer)
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface UpdateJobRequest {
  jobId: string
  directoryResults?: DirectoryResult[]
  status?: 'in_progress' | 'paused' | 'failed'
  errorMessage?: string
}

interface DirectoryResult {
  directoryName: string
  directoryUrl?: string
  directoryCategory?: string
  directoryTier?: 'standard' | 'premium' | 'enterprise'
  submissionStatus: 'pending' | 'processing' | 'submitted' | 'approved' | 'rejected' | 'failed' | 'skipped'
  listingUrl?: string
  submissionResult?: string
  rejectionReason?: string
  domainAuthority?: number
  estimatedTraffic?: number
  submissionScore?: number
  processingTimeSeconds?: number
  errorMessage?: string
}

interface UpdateJobResponse {
  success: boolean
  data?: {
    jobId: string
    progressPercentage: number
    directoriesCompleted: number
    directoriesFailed: number
    resultsAdded: number
  }
  message?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateJobResponse>
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

    const { jobId, directoryResults, status, errorMessage }: UpdateJobRequest = req.body

    // Validate required fields
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'jobId is required'
      })
    }

    // Verify job exists and is in progress
    const { data: job, error: jobCheckError } = await supabase
      .from('autobolt_processing_queue')
      .select('id, customer_id, status')
      .eq('id', jobId)
      .single()

    if (jobCheckError || !job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      })
    }

    if (job.status !== 'processing') {
      return res.status(400).json({
        success: false,
        error: `Job status is ${job.status}, expected processing`
      })
    }

    let resultsAdded = 0

    // Insert directory results if provided
    if (directoryResults && directoryResults.length > 0) {
      const resultsToInsert = directoryResults.map(result => ({
        queue_id: jobId,
        customer_id: job.customer_id,
        directory_name: result.directoryName,
        directory_url: result.directoryUrl,
        directory_category: result.directoryCategory,
        directory_tier: result.directoryTier || 'standard',
        submission_status: result.submissionStatus,
        listing_url: result.listingUrl,
        rejection_reason: result.rejectionReason,
        domain_authority: result.domainAuthority,
        estimated_traffic: result.estimatedTraffic,
        processing_time_seconds: result.processingTimeSeconds,
        error_message: result.errorMessage,
        submitted_at: ['submitted', 'approved'].includes(result.submissionStatus) ? new Date().toISOString() : null,
        approved_at: result.submissionStatus === 'approved' ? new Date().toISOString() : null,
        metadata: {
          submission_result: result.submissionResult,
          submission_score: result.submissionScore
        }
      }))

      const { error: insertError, count } = await supabase
        .from('directory_submissions')
        .insert(resultsToInsert)

      if (insertError) {
        console.error('Error inserting job results:', insertError)
        return res.status(500).json({
          success: false,
          error: 'Failed to save directory results'
        })
      }

      resultsAdded = count || directoryResults.length
    }

    // Update job status if provided
    if (status || errorMessage) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (status) {
        updateData.status = status
      }

      if (errorMessage) {
        updateData.error_message = errorMessage
      }

      const { error: updateError } = await supabase
        .from('autobolt_processing_queue')
        .update(updateData)
        .eq('id', jobId)

      if (updateError) {
        console.error('Error updating job:', updateError)
        return res.status(500).json({
          success: false,
          error: 'Failed to update job status'
        })
      }
    }

    // Calculate progress from directory submissions
    const { data: submissionStats } = await supabase
      .from('directory_submissions')
      .select('submission_status')
      .eq('queue_id', jobId)

    const directoriesCompleted = submissionStats?.filter(s => ['approved', 'submitted'].includes(s.submission_status)).length || 0
    const directoriesFailed = submissionStats?.filter(s => ['failed', 'rejected'].includes(s.submission_status)).length || 0
    const totalProcessed = directoriesCompleted + directoriesFailed
    
    // Get job directory limit for progress calculation
    const { data: jobData } = await supabase
      .from('autobolt_processing_queue')
      .select('directory_limit')
      .eq('id', jobId)
      .single()
    
    const progressPercentage = jobData?.directory_limit ? 
      Math.round((totalProcessed / jobData.directory_limit) * 100) : 0

    return res.status(200).json({
      success: true,
      data: {
        jobId,
        progressPercentage,
        directoriesCompleted,
        directoriesFailed,
        resultsAdded
      },
      message: `Job ${jobId} updated successfully. ${resultsAdded} results added.`
    })

  } catch (error) {
    console.error('AutoBolt Update Job API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    })
  }
}