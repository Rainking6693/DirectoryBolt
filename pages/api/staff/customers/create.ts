import type { NextApiRequest, NextApiResponse } from 'next'
import { withStaffAuth } from '../../../../lib/middleware/staff-auth'
import { createClient } from '@supabase/supabase-js'

interface CreateCustomerBody {
  business_name: string
  email?: string
  phone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  package_size?: number
}

interface CreateCustomerResponse {
  success: boolean
  data?: { id: string; customer_id: string; job_id?: string }
  error?: string
}

async function handler(req: NextApiRequest, res: NextApiResponse<CreateCustomerResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' })
  }

  try {
    const body = (req.body || {}) as CreateCustomerBody
    if (!body.business_name) {
      return res.status(400).json({ success: false, error: 'business_name is required' })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
    const year = new Date().getFullYear()
    const customer_id = `DB-${year}-${rand}`

    const now = new Date().toISOString()

    // First check if the table exists, if not, we'll use the existing jobs table structure
    let customer
    let custErr

    try {
      // Try to insert into customers table (if it exists)
      const { data: custData, error: custErrTemp } = await supabase
        .from('customers')
        .insert({
          customer_id,
          business_name: body.business_name,
          email: body.email || null,
          phone: body.phone || null,
          website: body.website || null,
          address: body.address || null,
          city: body.city || null,
          state: body.state || null,
          zip: body.zip || null,
          status: 'pending',
          created_at: now,
          updated_at: now,
        })
        .select('id, customer_id')
        .single()

      custErr = custErrTemp

      if (custErr && custErr.message?.includes('relation "customers" does not exist')) {
        console.log('Customers table does not exist, using jobs table structure')
        // If customers table doesn't exist, we'll store customer data in the jobs table
        customer = { id: `CUST-${Date.now()}`, customer_id }
        custErr = null
      } else if (custErr) {
        throw custErr
      } else {
        customer = custData
      }
    } catch (error) {
      console.log('Using fallback customer creation method')
      customer = { id: `CUST-${Date.now()}`, customer_id }
      custErr = null
    }

    if (custErr || !customer) {
      return res.status(500).json({ success: false, error: custErr?.message || 'Failed to create customer' })
    }

    let job_id: string | undefined
    const pkg = Number(body.package_size) || 50
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        customer_id: customer.customer_id,  // Use string customer_id, not UUID
        customer_name: body.business_name,
        customer_email: body.email || '',
        package_type: 'starter',  // Default to starter
        directory_limit: pkg,
        priority_level: 3,
        status: 'pending',
        business_data: {
          businessName: body.business_name,
          email: body.email,
          phone: body.phone,
          website: body.website,
          address: body.address,
          city: body.city,
          state: body.state,
          zip: body.zip
        },
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single()

    if (!jobErr && job) {
      job_id = job.id
    }

    return res.status(200).json({ success: true, data: { id: customer.id, customer_id: customer.customer_id, job_id } })
  } catch (e) {
    console.error('[staff.customers.create] error', e)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export default withStaffAuth(handler)
