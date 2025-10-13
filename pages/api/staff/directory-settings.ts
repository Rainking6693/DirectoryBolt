import type { NextApiRequest, NextApiResponse } from 'next'
import { withStaffAuth } from '../../../lib/middleware/staff-auth'
import { createClient } from '@supabase/supabase-js'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ success: false, error: 'Supabase not configured' })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  try {
    // Fetch directory settings from the directories table
    const { data: directories, error } = await supabase
      .from('directories')
      .select('id, name, category, is_active, pacing_min_ms, pacing_max_ms, max_retries')
      .order('name')

    if (error) {
      console.error('[staff:directory-settings] directories query error', error)
      // If table doesn't exist, return empty array instead of error
      if (error.message?.includes('relation "directories" does not exist')) {
        console.log('[staff:directory-settings] Directories table does not exist, returning empty data')
        return res.status(200).json({ success: true, data: [] })
      } else {
        return res.status(500).json({ success: false, error: 'Failed to load directory settings' })
      }
    }

    // Format the data for the frontend
    const formattedData = (directories || []).map((dir: any) => ({
      id: dir.id,
      name: dir.name,
      category: dir.category || 'General',
      enabled: dir.is_active !== false, // Default to enabled if not specified
      pacing_min_ms: dir.pacing_min_ms || 1000,
      pacing_max_ms: dir.pacing_max_ms || 5000,
      max_retries: dir.max_retries || 3,
    }))

    return res.status(200).json({ success: true, data: formattedData })
  } catch (e: any) {
    console.error('[staff:directory-settings] error', e?.message || e)
    return res.status(500).json({ success: false, error: 'Internal error' })
  }
}

export default withStaffAuth(handler)