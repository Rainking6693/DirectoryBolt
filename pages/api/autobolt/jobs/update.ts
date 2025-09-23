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
import { withRateLimit, rateLimiters } from '../../../../lib/middleware/production-rate-limit'

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface UpdateJobRequest {
  job_id?: string
  jobId?: string
  directory_name?: string
  status?: 'pending' | 'processing' | 'submitted' | 'approved' | 'rejected' | 'failed' | 'skipped'
  response_log?: any
  directoryResults?: DirectoryResult[]
  errorMessage?: string
}

interface DirectoryResult {
  directoryName: string
  directoryUrl?: string
  directoryCategory?: string
  category?: string
  directoryTier?: 'standard' | 'premium' | 'enterprise'
  tier?: 'standard' | 'premium' | 'enterprise'
  submissionStatus: 'pending' | 'processing' | 'submitted' | 'approved' | 'rejected' | 'failed' | 'skipped'
  listingUrl?: string
  submissionResult?: string
  rejectionReason?: string
  domainAuthority?: number
  estimatedTraffic?: number
  submissionScore?: number
  processingTimeSeconds?: number
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

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UpdateJobResponse>
) {
  // Only allow POST method
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' })

  try {
    // Authenticate using API key
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    
    if (!apiKey || apiKey !== process.env.AUTOBOLT_API_KEY) return res.status(401).json({ success: false, error: 'Unauthorized. Valid AUTOBOLT_API_KEY required.' })

    const { jobId: jobIdAlt, job_id, directory_name, status, response_log, directoryResults, errorMessage }: UpdateJobRequest = req.body
    const jobId = job_id || jobIdAlt

    // Validate required fields
    if (!jobId) return res.status(400).json({ success: false, error: 'jobId is required' })

    // Verify job exists and is in progress
    const { data: job, error: jobCheckError } = await supabase
      .from('jobs')
      .select('id, customer_id, status')
      .eq('id', jobId)
      .single()

    if (jobCheckError || !job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      })
    }

    // Allow updates in in_progress per doc
    if (job.status !== 'in_progress') return res.status(400).json({ success: false, error: `Job status is ${job.status}, expected in_progress` })

    let resultsAdded = 0

    // Insert directory results if provided (align with live schema: uses category/tier, no error_message)
    if (directoryResults && directoryResults.length > 0) {
      const resultsToInsert = directoryResults.map(result => ({
        job_id: jobId,
        directory_name: result.directoryName,
        status: (result.submissionStatus === 'submitted' || result.submissionStatus === 'approved') ? 'submitted' : (result.submissionStatus === 'failed' ? 'failed' : 'pending'),
        response_log: result.submissionResult ? { submission_result: result.submissionResult } : null,
        submitted_at: ['submitted','approved'].includes(result.submissionStatus) ? new Date().toISOString() : null,
        retry_count: 0
      }))

      const { error: insertError, count } = await supabase
        .from('job_results')
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

      if (status) updateData.status = status === 'processing' ? 'in_progress' : (status === 'submitted' ? 'in_progress' : status)

      if (errorMessage) updateData.error_message = errorMessage

      const { error: updateError } = await supabase
        .from('jobs')
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

export default withRateLimit(handler, rateLimiters.general)