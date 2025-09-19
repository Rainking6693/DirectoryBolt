// Staff Dashboard - AutoBolt Queue API
// Provides AutoBolt processing queue data for staff monitoring

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
    console.log('📋 Staff requesting AutoBolt queue data')

    // Get queue items
    const { data: queueItems, error: queueError } = await supabase
      .from('autobolt_processing_queue')
      .select(`
        id,
        customer_id,
        business_name,
        email,
        package_type,
        directory_limit,
        priority_level,
        status,
        created_at,
        started_at,
        completed_at,
        error_message
      `)
      .order('priority_level', { ascending: true })
      .order('created_at', { ascending: true })

    if (queueError) {
      console.error('❌ Failed to get queue items:', queueError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to retrieve queue data',
        details: queueError.message
      })
    }

    // Get queue statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_queue_stats')

    if (statsError) {
      console.error('❌ Failed to get queue stats:', statsError)
      // Fallback to manual calculation
      const manualStats = {
        total_queued: queueItems?.filter(item => item.status === 'queued').length || 0,
        total_processing: queueItems?.filter(item => item.status === 'processing').length || 0,
        total_completed: queueItems?.filter(item => item.status === 'completed').length || 0,
        total_failed: queueItems?.filter(item => item.status === 'failed').length || 0
      }
      
      res.status(200).json({
        success: true,
        data: {
          queue_items: queueItems || [],
          stats: manualStats
        },
        retrieved_at: new Date().toISOString()
      })
      return
    }

    console.log(`✅ Retrieved ${queueItems?.length || 0} AutoBolt queue items`)

    res.status(200).json({
      success: true,
      data: {
        queue_items: queueItems || [],
        stats: stats?.[0] || {
          total_queued: 0,
          total_processing: 0,
          total_completed: 0,
          total_failed: 0
        }
      },
      retrieved_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AutoBolt queue error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve AutoBolt queue data',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
