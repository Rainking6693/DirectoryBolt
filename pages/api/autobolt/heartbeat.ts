// AutoBolt Extension - Heartbeat API
// Handles heartbeat signals from the AutoBolt Chrome extension

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('💓 AutoBolt extension heartbeat received')

    const { 
      extension_id,
      status,
      current_customer_id,
      current_queue_id,
      directories_processed,
      directories_failed,
      error_message
    } = req.body

    if (!extension_id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Extension ID is required'
      })
    }

    // Update extension status
    const { error: updateError } = await supabase
      .from('autobolt_extension_status')
      .upsert({
        extension_id: extension_id,
        status: status || 'online',
        last_heartbeat: new Date().toISOString(),
        current_customer_id: current_customer_id || null,
        current_queue_id: current_queue_id || null,
        directories_processed: directories_processed || 0,
        directories_failed: directories_failed || 0,
        error_message: error_message || null,
        updated_at: new Date().toISOString()
      })

    if (updateError) {
      console.error('❌ Failed to update extension heartbeat:', updateError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to update extension status'
      })
    }

    console.log(`✅ Heartbeat updated for extension: ${extension_id}`)

    res.status(200).json({
      success: true,
      message: 'Heartbeat received',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AutoBolt heartbeat error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process heartbeat',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
