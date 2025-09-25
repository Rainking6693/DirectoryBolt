// API endpoint for AutoBolt to complete jobs
// Updated to work with new 'jobs' table schema

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

interface CompleteJobRequest {
  job_id: string
  final_status: 'completed' | 'failed' | 'cancelled'
  error_message?: string
  summary?: {
    total_directories: number
    successful_submissions: number
    failed_submissions: number
    processing_time_seconds: number
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🏁 AutoBolt completing job')

    // Verify API key authentication
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    
    if (!apiKey || apiKey !== process.env.AUTOBOLT_API_KEY) {
      console.error('❌ Invalid or missing AutoBolt API key')
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid AutoBolt API key required'
      })
    }

    // Validate request body
    const {
      job_id,
      final_status,
      error_message,
      summary
    }: CompleteJobRequest = req.body

    if (!job_id || !final_status) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'job_id and final_status are required'
      })
    }

    if (!['completed', 'failed', 'cancelled'].includes(final_status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'final_status must be completed, failed, or cancelled'
      })
    }

    // Verify job exists and is in processing status
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .single()

    if (jobError || !job) {
      console.error('❌ Job not found:', jobError)
      return res.status(404).json({
        error: 'Job Not Found',
        message: 'The specified job does not exist'
      })
    }

    if (job.status !== 'processing') {
      return res.status(400).json({
        error: 'Invalid Job Status',
        message: `Job is in ${job.status} status, not processing`
      })
    }

    // Complete job using the database function
    const { data: completeResult, error: completeError } = await supabase
      .rpc('complete_autobolt_job', {
        job_id_param: job_id,
        final_status_param: final_status,
        error_message_param: error_message || null
      })

    if (completeError || !completeResult) {
      console.error('❌ Failed to complete job:', completeError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to complete job',
        details: completeError?.message
      })
    }

    // Get final job statistics
    const { data: jobResults, error: resultsError } = await supabase
      .from('job_results')
      .select('submission_status, processing_time_seconds')
      .eq('job_id', job_id)

    let finalStats = {
      total_directories: job.directory_limit,
      successful_submissions: 0,
      failed_submissions: 0,
      pending_submissions: 0,
      total_processing_time: 0
    }

    if (!resultsError && jobResults) {
      finalStats.successful_submissions = jobResults.filter(r => 
        r.submission_status === 'approved' || r.submission_status === 'submitted'
      ).length
      finalStats.failed_submissions = jobResults.filter(r => 
        r.submission_status === 'failed'
      ).length
      finalStats.pending_submissions = jobResults.filter(r => 
        r.submission_status === 'pending'
      ).length
      finalStats.total_processing_time = jobResults.reduce((total, r) => 
        total + (r.processing_time_seconds || 0), 0
      )
    }

    // Calculate success rate
    const successRate = finalStats.total_directories > 0 
      ? Math.round((finalStats.successful_submissions / finalStats.total_directories) * 100)
      : 0

    console.log(`✅ Completed job ${job_id} with status ${final_status}`)
    console.log(`   Success rate: ${successRate}% (${finalStats.successful_submissions}/${finalStats.total_directories})`)

    // Send notification to customer (if notification system exists)
    try {
      await supabase
        .from('customer_notifications')
        .insert({
          customer_id: job.customer_id,
          type: 'job_completed',
          title: `Directory Submission ${final_status === 'completed' ? 'Completed' : 'Failed'}`,
          message: `Your ${job.package_type} package submission has ${final_status}. Success rate: ${successRate}%`,
          data: {
            job_id: job_id,
            final_status: final_status,
            stats: finalStats
          },
          created_at: new Date().toISOString()
        })
    } catch (notificationError) {
      console.error('⚠️ Failed to send notification:', notificationError)
      // Don't fail the request for notification errors
    }

    res.status(200).json({
      success: true,
      data: {
        job_id: job_id,
        customer_id: job.customer_id,
        business_name: job.business_name,
        final_status: final_status,
        completed_at: new Date().toISOString(),
        statistics: finalStats,
        success_rate: successRate,
        processing_summary: {
          started_at: job.started_at,
          completed_at: new Date().toISOString(),
          total_time_seconds: Math.floor((new Date().getTime() - new Date(job.started_at).getTime()) / 1000)
        }
      },
      message: `Job ${final_status} successfully`
    })

  } catch (error) {
    console.error('❌ Job completion error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to complete job',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}