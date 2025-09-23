/**
 * AutoBolt Submission Logs API
 * 
 * GET /api/autobolt/submission-logs - Get real-time submission activity logs
 * Provides detailed logging for transparency and debugging
 * 
 * Security: Requires staff authentication or AUTOBOLT_API_KEY
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, rateLimiters } from '../../../lib/middleware/production-rate-limit'

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SubmissionLog {
  log_id: string
  customer_id: string
  job_id: string
  directory_name: string
  action: 'form_fill' | 'submit' | 'captcha' | 'verify' | 'error' | 'screenshot'
  timestamp: string
  details: string
  screenshot_url?: string
  success: boolean
  processing_time_ms?: number
  error_message?: string
  form_data?: Record<string, any>
  response_data?: Record<string, any>
}

interface SubmissionLogsResponse {
  success: boolean
  data?: {
    logs: SubmissionLog[]
    total_count: number
    filters_applied: {
      customer_id?: string
      job_id?: string
      action?: string
      since?: string
      limit: number
    }
  }
  error?: string
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmissionLogsResponse>
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    })
  }

  try {
    // Authenticate using API key or staff session
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    
    // For now, require API key (can extend to support staff session later)
    if (!apiKey || apiKey !== process.env.AUTOBOLT_API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized. Valid AUTOBOLT_API_KEY required.'
      })
    }

    // Parse query parameters
    const {
      customer_id,
      job_id,
      action,
      since,
      limit = '100',
      include_screenshots = 'false'
    } = req.query

    const limitNum = Math.min(parseInt(limit as string) || 100, 500) // Max 500 logs

    // Build query
    let query = supabase
      .from('autobolt_submission_logs')
      .select(`
        id,
        customer_id,
        job_id,
        directory_name,
        action,
        timestamp,
        details,
        screenshot_url,
        success,
        processing_time_ms,
        error_message,
        form_data,
        response_data,
        created_at
      `)
      .order('timestamp', { ascending: false })
      .limit(limitNum)

    // Apply filters
    if (customer_id) {
      query = query.eq('customer_id', customer_id)
    }

    if (job_id) {
      query = query.eq('job_id', job_id)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (since) {
      const sinceDate = new Date(since as string)
      if (!isNaN(sinceDate.getTime())) {
        query = query.gte('timestamp', sinceDate.toISOString())
      }
    } else {
      // Default: logs from last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      query = query.gte('timestamp', yesterday.toISOString())
    }

    const { data: logs, error: logsError, count } = await query

    if (logsError) {
      console.error('❌ Failed to fetch submission logs:', logsError)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch submission logs'
      })
    }

    // Transform the data to match our interface
    const transformedLogs: SubmissionLog[] = (logs || []).map(log => ({
      log_id: log.id,
      customer_id: log.customer_id,
      job_id: log.job_id,
      directory_name: log.directory_name,
      action: log.action,
      timestamp: log.timestamp,
      details: log.details,
      screenshot_url: include_screenshots === 'true' ? log.screenshot_url : undefined,
      success: log.success,
      processing_time_ms: log.processing_time_ms,
      error_message: log.error_message,
      form_data: log.form_data,
      response_data: log.response_data
    }))

    console.log(`✅ Retrieved ${transformedLogs.length} submission logs`)

    return res.status(200).json({
      success: true,
      data: {
        logs: transformedLogs,
        total_count: count || transformedLogs.length,
        filters_applied: {
          customer_id: customer_id as string,
          job_id: job_id as string,
          action: action as string,
          since: since as string,
          limit: limitNum
        }
      }
    })

  } catch (error) {
    console.error('AutoBolt Submission Logs API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    })
  }
}

export default withRateLimit(handler, rateLimiters.general)