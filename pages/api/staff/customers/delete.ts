import type { NextApiRequest, NextApiResponse } from 'next'
import { withStaffAuth } from '../../../../lib/middleware/staff-auth'
import { createClient } from '@supabase/supabase-js'

interface DeleteCustomerResponse {
  success: boolean
  data?: { deleted_customer_id?: string }
  error?: string
}

async function handler(req: NextApiRequest, res: NextApiResponse<DeleteCustomerResponse>) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'DELETE'])
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const { id, customer_id } = (req.body || {}) as { id?: string; customer_id?: string }
  if (!id && !customer_id) {
    return res.status(400).json({ success: false, error: 'id or customer_id is required' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' })
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey)

    // Resolve internal UUID id from either provided id or customer_id
    let internalId: string | null = id || null
    if (!internalId && customer_id) {
      const { data: c, error } = await supabase
        .from('customers')
        .select('id')
        .eq('customer_id', customer_id)
        .single()
      if (error || !c) {
        return res.status(404).json({ success: false, error: 'Customer not found' })
      }
      internalId = c.id
    }

    if (!internalId) {
      return res.status(404).json({ success: false, error: 'Customer not found' })
    }

    // Delete related jobs first
    await supabase.from('jobs').delete().eq('customer_id', internalId)

    // Delete customer
    const { error: delErr } = await supabase.from('customers').delete().eq('id', internalId)
    if (delErr) {
      return res.status(500).json({ success: false, error: delErr.message })
    }

    return res.status(200).json({ success: true, data: { deleted_customer_id: internalId } })
  } catch (e) {
    console.error('[staff.customers.delete] error', e)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export default withStaffAuth(handler)
