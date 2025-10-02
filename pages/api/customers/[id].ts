import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface CustomerDetailResponse {
  success: boolean
  customer?: any
  error?: string
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CustomerDetailResponse>
) {
  const { id } = req.query
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Invalid customer ID'
    })
  }

  try {
    // Check staff/admin authentication
    const authHeader = req.headers.authorization
    const staffSession = req.cookies.staff_session
    const adminKey = req.headers['x-admin-key']
    
    const validStaffKey = process.env.STAFF_API_KEY
    const validAdminKey = process.env.ADMIN_API_KEY
    
    const isStaffAuth = authHeader === `Bearer ${validStaffKey}` || !!staffSession
    const isAdminAuth = adminKey === validAdminKey || authHeader === `Bearer ${validAdminKey}`
    
    if (!isStaffAuth && !isAdminAuth) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Staff or admin authentication required'
      })
    }

    // Handle different HTTP methods
    if (req.method === 'GET') {
      return handleGetCustomer(id, res)
    } else if (req.method === 'PUT' || req.method === 'PATCH') {
      return handleUpdateCustomer(id, req, res)
    } else if (req.method === 'DELETE') {
      return handleDeleteCustomer(id, res)
    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE'])
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      })
    }
    
  } catch (error) {
    console.error('❌ Customer API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleGetCustomer(
  id: string,
  res: NextApiResponse<CustomerDetailResponse>
) {
  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !customer) {
    return res.status(404).json({
      success: false,
      error: 'Customer not found',
      message: `No customer found with ID: ${id}`
    })
  }
  
  // Also fetch related jobs
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
  
  return res.status(200).json({
    success: true,
    customer: {
      ...customer,
      jobs: jobs || []
    }
  })
}

async function handleUpdateCustomer(
  id: string,
  req: NextApiRequest,
  res: NextApiResponse<CustomerDetailResponse>
) {
  const updates = req.body
  
  const { data: customer, error } = await supabase
    .from('customers')
    .update({
      ...updates,
      updatedAt: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('❌ Failed to update customer:', error)
    return res.status(500).json({
      success: false,
      error: 'Database error',
      message: error.message
    })
  }
  
  console.log(`✅ Customer updated: ${id}`)
  
  return res.status(200).json({
    success: true,
    customer
  })
}

async function handleDeleteCustomer(
  id: string,
  res: NextApiResponse<CustomerDetailResponse>
) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
  
  if (error) {
    console.error('❌ Failed to delete customer:', error)
    return res.status(500).json({
      success: false,
      error: 'Database error',
      message: error.message
    })
  }
  
  console.log(`✅ Customer deleted: ${id}`)
  
  return res.status(200).json({
    success: true,
    message: `Customer ${id} successfully deleted`
  })
}

