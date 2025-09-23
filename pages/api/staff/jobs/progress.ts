/**
 * Staff Jobs Progress API
 * 
 * GET /api/staff/jobs/progress
 * Returns job progress data for staff dashboard monitoring
 * 
 * Security: Requires staff authentication (API key, session, or basic auth)
 * Usage: Staff dashboard JobProgressMonitor component
 * 
 * Phase 2 - Task 2.2 Implementation
 * Agent: Riley (Frontend Engineer)
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, rateLimiters } from '../../../../lib/middleware/production-rate-limit'

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface JobProgressData {
  id: string
  customer_id: string
  business_name: string
  email: string
  package_type: 'starter' | 'growth' | 'pro'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  directories_total: number
  directories_completed: number
  directories_failed: number
  progress_percentage: number
  created_at: string
  started_at?: string
  completed_at?: string
  estimated_completion?: string
  results: Array<{
    id: string
    directory_name: string
    submission_status: 'success' | 'failed'
    response_data?: any
    created_at: string
  }>
}

interface JobProgressStats {
  total_jobs: number
  pending_jobs: number
  in_progress_jobs: number
  completed_jobs: number
  failed_jobs: number
  total_directories: number
  completed_directories: number
  failed_directories: number
  success_rate: number
}

interface JobProgressResponse {
  success: boolean
  data?: {
    jobs: JobProgressData[]
    stats: JobProgressStats
  }
  message?: string
  error?: string
}

// Staff authentication function
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

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobProgressResponse>
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
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

    console.log('🔐 Staff jobs progress requested from IP:', req.headers['x-forwarded-for'] || req.connection.remoteAddress)

    // Get job progress data with fallback for missing migration
    let jobsData = null
    let jobsError = null
    
    // Use jobs + job_results per architecture doc
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, customer_id, package_size, status, created_at, started_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) jobsError = error
    else {
      const jobsWithProgress = await Promise.all(
        (jobs || []).map(async (job) => {
          const { data: results } = await supabase
            .from('job_results')
            .select('id, directory_name, status, submitted_at')
            .eq('job_id', job.id)
          const submitted = (results || []).filter(r => r.status === 'submitted').length
          const failed = (results || []).filter(r => r.status === 'failed').length
          const pending = job.package_size - (submitted + failed)
          const progress = job.package_size > 0 ? Math.round((submitted / job.package_size) * 100) : 0
          return {
            id: job.id,
            customer_id: job.customer_id,
            business_name: undefined,
            email: undefined,
            package_type: String(job.package_size),
            status: job.status,
            directories_total: job.package_size,
            directories_completed: submitted,
            directories_failed: failed,
            progress_percentage: progress,
            created_at: job.created_at,
            started_at: job.started_at,
            completed_at: job.completed_at,
            results: (results || []).map(r => ({
              id: r.id,
              directory_name: r.directory_name,
              submission_status: r.status === 'submitted' ? 'success' : 'failed',
              response_data: undefined,
              created_at: r.submitted_at
            }))
          }
        })
      )
      jobsData = jobsWithProgress
    }

    if (jobsError) {
      console.error('Database error getting job progress:', jobsError)
      
      // Provide helpful error message if tables don't exist
      if (jobsError.code === 'PGRST106' || jobsError.code === 'PGRST202') {
        return res.status(503).json({
          success: false,
          error: 'Job queue system not initialized',
          message: 'Database migration required. Apply migrations/020_create_job_queue_tables.sql in Supabase SQL Editor'
        })
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch job progress data'
      })
    }

    // Calculate statistics with fallback
    let stats: JobProgressStats
    
    // Calculate stats from jobsData for doc model
    const js = Array.isArray(jobsData) ? jobsData : []
    stats = {
      total_jobs: js.length,
      pending_jobs: js.filter(j => j.status === 'pending').length,
      in_progress_jobs: js.filter(j => j.status === 'in_progress').length,
      completed_jobs: js.filter(j => j.status === 'complete' || j.status === 'completed').length,
      failed_jobs: js.filter(j => j.status === 'failed').length,
      total_directories: js.reduce((sum, j) => sum + (j.directories_total || 0), 0),
      completed_directories: js.reduce((sum, j) => sum + (j.directories_completed || 0), 0),
      failed_directories: js.reduce((sum, j) => sum + (j.directories_failed || 0), 0),
      success_rate: 0
    }
    const totalProcessed = stats.completed_directories + stats.failed_directories
    stats.success_rate = totalProcessed > 0 ? Math.round((stats.completed_directories / totalProcessed) * 100) : 0

    // Ensure we have valid data structure
    const finalJobs = Array.isArray(jobsData) ? jobsData : []

    // Return job progress data
    return res.status(200).json({
      success: true,
      data: {
        jobs: finalJobs,
        stats: stats
      }
    })

  } catch (error) {
    console.error('Staff Jobs Progress API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    })
  }
}

export default withRateLimit(handler, rateLimiters.admin)