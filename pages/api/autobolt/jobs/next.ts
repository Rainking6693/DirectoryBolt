/**
 * AutoBolt Jobs API - Get Next Job
 * 
 * GET /api/autobolt/jobs/next
 * Returns the next job in queue for AutoBolt processing
 * 
 * Security: Requires AUTOBOLT_API_KEY authentication
 * Usage: AutoBolt Chrome extension calls this to get next customer to process
 * 
 * Phase 1 - Task 1.2 Implementation
 * Agent: Shane (Backend Developer)
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { withRateLimit, rateLimiters } from '../../../../lib/middleware/production-rate-limit'

// Initialize Supabase client with service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface JobResponse {
  job?: {
    job_id: string
    package_size: number
    customer: {
      id: string
      business_name?: string | null
      email?: string | null
      phone?: string | null
      address?: string | null
      city?: string | null
      state?: string | null
      zip?: string | null
      website?: string | null
      description?: string | null
      facebook?: string | null
      instagram?: string | null
      linkedin?: string | null
    }
  } | null
  error?: string
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<JobResponse>
) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Authenticate using API key
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')
    
    if (!apiKey || apiKey !== process.env.AUTOBOLT_API_KEY) {
      return res.status(403).json({ error: 'Unauthorized' })
    }
    // Get next pending job from jobs (highest priority = lower number)
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .select('id, customer_id, package_size, status, priority_level, created_at')
      .eq('status', 'pending')
      .order('priority_level', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (jobErr) {
      console.error('❌ Failed to fetch job from queue:', jobErr)
      return res.status(500).json({ error: 'Failed to fetch job' })
    }
    
    if (!job) {
      console.log('ℹ️ No jobs in queue')
      return res.status(200).json({ job: null })
    }

    console.log(`🎯 Found job for customer ${job.customer_id}`)

    // Mark job as in_progress
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        status: 'in_progress', 
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)

    if (updateError) {
      console.error('❌ Failed to update job status:', updateError)
      return res.status(500).json({ error: 'Failed to update job status' })
    }

    // Fetch customer details (best-effort)
    const { data: customerRow } = await supabase
      .from('customers')
      .select('id, business_name, email, phone, address, city, state, zip, website, description, facebook, instagram, linkedin, business_data')
      .eq('id', job.customer_id)
      .maybeSingle()

    const businessData = (customerRow && (customerRow as any).business_data) || {}

    return res.status(200).json({
      job: {
        job_id: job.id,
        package_size: job.package_size,
        customer: {
          id: job.customer_id,
          business_name: (customerRow as any)?.business_name || null,
          email: (customerRow as any)?.email || null,
          phone: businessData.phone || null,
          address: businessData.address || null,
          city: businessData.city || null,
          state: businessData.state || null,
          zip: businessData.zip || null,
          website: businessData.website || null,
          description: businessData.description || null,
          facebook: businessData.facebook || null,
          instagram: businessData.instagram || null,
          linkedin: businessData.linkedin || null
        }
      }
    })

  } catch (error) {
    console.error('AutoBolt Get Next Job API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withRateLimit(handler, rateLimiters.general)