import { NextApiRequest, NextApiResponse } from 'next'
import { withRateLimit, rateLimiters } from '../../../../lib/middleware/production-rate-limit'

function authenticateStaff(req: NextApiRequest) {
  const staffKey = req.headers['x-staff-key'] || req.headers['authorization']
  const validStaffKey = process.env.STAFF_API_KEY || 'DirectoryBolt-Staff-2025-SecureKey'

  if (staffKey === validStaffKey || staffKey === `Bearer ${validStaffKey}`) {
    return true
  }

  const staffSession = req.headers.cookie?.split('; ').find(row => row.startsWith('staff-session='))?.split('=')[1]
  if (staffSession) {
    return true
  }

  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.replace('Basic ', ''), 'base64').toString()
    const [username, password] = decoded.split(':')
    if (username === 'staff' && password === (process.env.STAFF_DASHBOARD_PASSWORD || 'DirectoryBoltStaff2025!')) {
      return true
    }
  }

  return false
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed. Use POST.' })
  }

  if (!authenticateStaff(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }

  try {
    const { jobIds }: { jobIds?: string[] } = req.body

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'jobIds array is required and cannot be empty' 
      })
    }

    // Validate job IDs format
    const validJobIds = jobIds.filter(id => typeof id === 'string' && id.length > 0)
    if (validJobIds.length !== jobIds.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'All job IDs must be valid non-empty strings' 
      })
    }

    // Use basic retry implementation with direct database queries
    const retryResult = await basicRetryImplementation(validJobIds)

    if (retryResult.success) {
      return res.status(200).json({
        success: true,
        data: {
          retriedJobsCount: retryResult.retriedCount || validJobIds.length,
          failedToRetryCount: retryResult.failedCount || 0,
          jobIds: validJobIds,
          retryTimestamp: new Date().toISOString()
        },
        message: `Successfully queued ${retryResult.retriedCount || validJobIds.length} jobs for retry`
      })
    } else {
      return res.status(500).json({
        success: false,
        error: retryResult.error || 'Failed to retry jobs'
      })
    }

  } catch (error) {
    console.error('AutoBolt Retry Jobs API Error:', error)
    return res.status(500).json({ success: false, error: 'Internal server error. Please try again later.' })
  }
}

// Basic retry implementation if the main retry function is not available
async function basicRetryImplementation(jobIds: string[]) {
  try {
    // Import supabase client
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let retriedCount = 0
    let failedCount = 0

    for (const jobId of jobIds) {
      try {
        // Reset job status to pending for retry
        const { error } = await supabase
          .from('autobolt_jobs')
          .update({
            status: 'pending',
            startedAt: null,
            completedAt: null,
            errorMessage: null,
            updatedAt: new Date().toISOString()
          })
          .eq('id', jobId)
          .eq('status', 'failed') // Only retry failed jobs

        if (error) {
          console.error(`Failed to retry job ${jobId}:`, error)
          failedCount++
        } else {
          retriedCount++
        }
      } catch (jobError) {
        console.error(`Error processing job ${jobId}:`, jobError)
        failedCount++
      }
    }

    return {
      success: true,
      retriedCount,
      failedCount
    }

  } catch (error) {
    console.error('Basic retry implementation error:', error)
    return {
      success: false,
      error: error.message || 'Retry operation failed'
    }
  }
}

export default withRateLimit(handler, rateLimiters.general)