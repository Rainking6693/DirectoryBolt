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
  try {
    // Authenticate using API key (extendable to staff session)
    const apiKey = (req.headers['x-api-key'] as string) || (req.headers.authorization?.replace('Bearer ', '') as string)
    if (!apiKey || apiKey !== process.env.AUTOBOLT_API_KEY) {
      return res.status(401).json({ success: false, error: 'Unauthorized. Valid AUTOBOLT_API_KEY required.' })
    }

    if (req.method === 'POST') {
      // Ingest structured submission logs in batch
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
        const { jobId, entries, status, timestamp } = body || {}
        if (!jobId || !Array.isArray(entries) || entries.length === 0) {
          return res.status(400).json({ success: false, error: 'jobId and non-empty entries[] are required' })
        }

        // Lookup customer_id for this job
        const { data: jobRow, error: jobErr } = await supabase
          .from('jobs')
          .select('id, customer_id')
          .eq('id', jobId)
          .maybeSingle()
        if (jobErr) {
          console.error('[submission-logs POST] job lookup error', jobErr)
        }
        const customerId = jobRow?.customer_id || null

        // Map worker directoryResults to logs rows
        const rows = entries.map((e: any) => ({
          customer_id: customerId,
          job_id: jobId,
          directory_name: e.directoryName || e.directory || 'unknown',
          action: e.status === 'success' ? 'submit' : e.status === 'manual_required' ? 'verify' : e.status === 'error' ? 'error' : 'submit',
          timestamp: new Date().toISOString(),
          details: e.status || 'unknown',
          screenshot_url: e.errorScreenshot || e.screenshot || null,
          success: Boolean(e.success),
          processing_time_ms: e.processingTimeMs || null,
          error_message: e.error || null,
          form_data: e.formData || null,
          response_data: e.submissionUrl ? { submissionUrl: e.submissionUrl } : null,
        }))

        const { error: insErr } = await supabase
          .from('autobolt_submission_logs')
          .insert(rows)

        if (insErr) {
          console.error('❌ Failed to insert submission logs:', insErr)
          return res.status(500).json({ success: false, error: 'Failed to insert logs' })
        }

        return res.status(200).json({ success: true, data: { logs: [], total_count: rows.length, filters_applied: { limit: rows.length } } })
      } catch (e: any) {
        console.error('[submission-logs POST] error', e?.message || e)
        return res.status(500).json({ success: false, error: 'Internal server error' })
      }
    }

    // GET handler follows below
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