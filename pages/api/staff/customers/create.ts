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
  data?: {
    id: string
    customer_id: string
    job_id?: string
    business_name?: string
  }
  error?: string
}

type ErrorWithMessage = {
  message?: string
}

function getErrorMessage(error: unknown): string | undefined {
  if (!error) {
    return undefined
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as ErrorWithMessage).message
    return typeof message === 'string' ? message : undefined
  }

  return undefined
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

    // Create customer record - use a simple approach that works
    let customer: any
    let customerError: any = null

    try {
      // Try to create in a customer_data table first, fallback to storing in job
      const { data: custData, error: rawCustErr } = await supabase
        .from('customer_data')
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
          package_size: Number(body.package_size) || 50,
          status: 'active',
          created_at: now,
          updated_at: now,
        })
        .select('id, customer_id')
        .single()

      const custErr = (rawCustErr ?? null) as ErrorWithMessage | null
      const custErrMessage = getErrorMessage(custErr)

      if (custErr && custErrMessage?.includes('relation "customer_data" does not exist')) {
        console.log('customer_data table does not exist, storing in job business_data')
        customer = { id: customer_id, customer_id }
        customerError = null
      } else if (custErr) {
        console.log(
          'Error creating customer, storing in job business_data:',
          custErrMessage ?? custErr
        )
        customer = { id: customer_id, customer_id }
        customerError = custErr
      } else {
        customer = custData
        console.log('✅ Customer created in customer_data table:', customer_id)
        customerError = null
      }
    } catch (error) {
      console.log('Error creating customer, storing in job business_data')
      customer = { id: customer_id, customer_id }
      customerError = error
    }

    let job_id: string | undefined
    const pkg = Number(body.package_size) || 50

    // Create job with customer data embedded
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        customer_id: customer_id,
        customer_name: body.business_name,
        customer_email: body.email || '',
        package_type: 'starter',
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
          zip: body.zip,
          package_size: pkg
        },
        created_at: now,
        updated_at: now,
      })
      .select('id')
      .single()

    if (!jobErr && job) {
      job_id = job.id
      console.log('✅ Job created:', job_id, 'for customer:', customer_id)
    } else {
      console.error('❌ Failed to create job:', jobErr)
    }

    return res.status(200).json({
      success: true,
      data: {
        id: customer_id,
        customer_id: customer_id,
        job_id,
        business_name: body.business_name
      }
    })
  } catch (e) {
    console.error('[staff.customers.create] error', e)
    return res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

export default withStaffAuth(handler)
