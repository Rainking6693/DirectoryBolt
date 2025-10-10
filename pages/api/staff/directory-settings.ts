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
    // Dynamic import to avoid build-time loading
    const DirectoryConfiguration = (await import('../../../worker/directory-config.js')).default
    
    // Load base directories
    const dc = new DirectoryConfiguration()
    await dc.initialize()

    // Fetch overrides
    const { data: overrides, error } = await supabase
      .from('directory_overrides')
      .select('directory_id, enabled, pacing_min_ms, pacing_max_ms, max_retries')

    if (error) {
      console.error('[staff:directory-settings] overrides query error', error)
      return res.status(500).json({ success: false, error: 'Failed to load overrides' })
    }

    // Merge overrides
    const map = new Map<string, any>()
    for (const o of overrides || []) map.set(String(o.directory_id), o)

    const merged = (dc.directories || []).map((d: any) => {
      const o = map.get(d.id)
      return {
        id: d.id,
        name: d.name,
        category: d.category,
        enabled: typeof (o?.enabled) === 'boolean' ? o.enabled : (d.enabled !== false),
        pacing_min_ms: typeof (o?.pacing_min_ms) === 'number' ? o.pacing_min_ms : (d.pacing?.minDelayMs || null),
        pacing_max_ms: typeof (o?.pacing_max_ms) === 'number' ? o.pacing_max_ms : (d.pacing?.maxDelayMs || null),
        max_retries: typeof (o?.max_retries) === 'number' ? o.max_retries : (d.maxRetries || 1),
      }
    })

    return res.status(200).json({ success: true, data: merged })
  } catch (e: any) {
    console.error('[staff:directory-settings] error', e?.message || e)
    return res.status(500).json({ success: false, error: 'Internal error' })
  }
}

export default withStaffAuth(handler)