// API endpoint for AutoBolt to get next job
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🤖 AutoBolt requesting next job from queue')

    // Verify API key authentication
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    
    if (!apiKey || apiKey !== process.env.AUTOBOLT_API_KEY) {
      console.error('❌ Invalid or missing AutoBolt API key')
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Valid AutoBolt API key required'
      })
    }

    // Get next job using the updated function
    const { data: nextJob, error: jobError } = await supabase
      .rpc('get_next_job_in_queue')

    if (jobError) {
      console.error('❌ Failed to get next job:', jobError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to retrieve next job',
        details: jobError.message
      })
    }

    if (!nextJob || nextJob.length === 0) {
      console.log('📭 No jobs available in queue')
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No jobs available in queue'
      })
    }

    const job = nextJob[0]
    console.log(`✅ Retrieved job ${job.id} for customer ${job.customer_id}`)

    // Get directories for this job
    const { data: directories, error: dirError } = await supabase
      .from('directories')
      .select('*')
      .limit(job.directory_limit)

    if (dirError) {
      console.error('❌ Failed to get directories:', dirError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to retrieve directories for job',
        details: dirError.message
      })
    }

    res.status(200).json({
      success: true,
      data: {
        job: {
          id: job.id,
          customer_id: job.customer_id,
          business_name: job.business_name,
          email: job.email,
          package_type: job.package_type,
          directory_limit: job.directory_limit,
          priority_level: job.priority_level,
          status: job.status,
          created_at: job.created_at,
          metadata: job.metadata
        },
        directories: directories || [],
        instructions: {
          update_endpoint: '/api/jobs/update',
          complete_endpoint: '/api/jobs/complete',
          progress_reporting: 'Report progress after each directory submission',
          error_handling: 'Log all errors to job_results table'
        }
      },
      retrieved_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AutoBolt job retrieval error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve next job',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}