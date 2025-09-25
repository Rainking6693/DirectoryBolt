// API endpoint for AutoBolt to update job progress
// Updated to work with new 'job_results' table schema

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

interface UpdateJobRequest {
  job_id: string
  directory_name: string
  submission_status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'failed'
  listing_url?: string
  error_message?: string
  processing_time_seconds?: number
  domain_authority?: number
  estimated_traffic?: number
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔄 AutoBolt updating job progress')

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
      directory_name,
      submission_status,
      listing_url,
      error_message,
      processing_time_seconds,
      domain_authority,
      estimated_traffic
    }: UpdateJobRequest = req.body

    if (!job_id || !directory_name || !submission_status) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'job_id, directory_name, and submission_status are required'
      })
    }

    // Verify job exists and is in processing status
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, customer_id, status')
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

    // Update job progress using the database function
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_job_progress', {
        job_id_param: job_id,
        directory_name_param: directory_name,
        submission_status_param: submission_status,
        listing_url_param: listing_url || null,
        error_message_param: error_message || null
      })

    if (updateError || !updateResult) {
      console.error('❌ Failed to update job progress:', updateError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update job progress',
        details: updateError?.message
      })
    }

    // Also insert detailed tracking data
    const { error: insertError } = await supabase
      .from('job_results')
      .upsert({
        customer_id: job.customer_id,
        job_id: job_id,
        directory_name: directory_name,
        submission_status: submission_status,
        listing_url: listing_url,
        error_message: error_message,
        processing_time_seconds: processing_time_seconds,
        domain_authority: domain_authority,
        estimated_traffic: estimated_traffic,
        submitted_at: submission_status === 'submitted' || submission_status === 'approved' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'customer_id,job_id,directory_name'
      })

    if (insertError) {
      console.error('❌ Failed to insert job result details:', insertError)
      // Don't fail the request, just log the error
    }

    console.log(`✅ Updated job ${job_id} progress: ${directory_name} -> ${submission_status}`)

    // Get updated job progress
    const { data: progress, error: progressError } = await supabase
      .from('job_results')
      .select('submission_status')
      .eq('job_id', job_id)

    let progressStats = {
      total: 0,
      completed: 0,
      failed: 0,
      pending: 0
    }

    if (!progressError && progress) {
      progressStats.total = progress.length
      progressStats.completed = progress.filter(p => p.submission_status === 'approved' || p.submission_status === 'submitted').length
      progressStats.failed = progress.filter(p => p.submission_status === 'failed').length
      progressStats.pending = progress.filter(p => p.submission_status === 'pending').length
    }

    res.status(200).json({
      success: true,
      data: {
        job_id: job_id,
        directory_name: directory_name,
        submission_status: submission_status,
        progress: progressStats,
        updated_at: new Date().toISOString()
      },
      message: 'Job progress updated successfully'
    })

  } catch (error) {
    console.error('❌ Job update error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update job progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}