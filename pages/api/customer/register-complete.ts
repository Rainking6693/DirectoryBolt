// Complete Customer Registration Pipeline
// Integrates Supabase database, AutoBolt extension, and directory submission

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

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

interface CustomerRegistrationData {
  email: string
  password: string
  full_name: string
  business_name: string
  business_website: string
  business_phone: string
  business_address: string
  business_city: string
  business_state: string
  business_zip: string
  business_description: string
  business_category: string
  package_type: 'starter' | 'growth' | 'professional' | 'pro' | 'enterprise'
  payment_method: 'stripe' | 'paypal'
  stripe_customer_id?: string
}

interface PackageConfig {
  directory_limit: number
  priority_level: number
  processing_speed: 'standard' | 'priority' | 'express'
  features: string[]
  price: number
}

const PACKAGE_CONFIGS: Record<string, PackageConfig> = {
  starter: {
    directory_limit: 50,
    priority_level: 4,
    processing_speed: 'standard',
    features: ['Basic directory submission', 'Email support'],
    price: 149
  },
  growth: {
    directory_limit: 150,
    priority_level: 3,
    processing_speed: 'priority',
    features: ['Priority processing', 'Phone support', 'Analytics dashboard'],
    price: 299
  },
  professional: {
    directory_limit: 300,
    priority_level: 2,
    processing_speed: 'priority',
    features: ['Express processing', 'Dedicated support', 'Advanced analytics'],
    price: 499
  },
  pro: {
    directory_limit: 500,
    priority_level: 1,
    processing_speed: 'express',
    features: ['White-glove service', 'Custom directories', 'API access'],
    price: 799
  },
  enterprise: {
    directory_limit: 1000,
    priority_level: 1,
    processing_speed: 'express',
    features: ['Custom solutions', 'Dedicated account manager', 'SLA guarantee'],
    price: 1499
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const requestId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    console.log('🚀 Starting complete customer registration pipeline', { requestId })
    
    const data: CustomerRegistrationData = req.body

    // Validate required fields
    const requiredFields = ['email', 'password', 'full_name', 'business_name', 'package_type']
    for (const field of requiredFields) {
      if (!data[field as keyof CustomerRegistrationData]) {
        return res.status(400).json({
          error: 'Validation Error',
          message: `Missing required field: ${field}`,
          requestId
        })
      }
    }

    // Validate package type
    if (!PACKAGE_CONFIGS[data.package_type]) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid package type',
        requestId
      })
    }

    const packageConfig = PACKAGE_CONFIGS[data.package_type]

    // Check if customer already exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', data.email)
      .single()

    if (existingCustomer) {
      return res.status(409).json({
        error: 'Customer Exists',
        message: 'An account with this email already exists',
        requestId
      })
    }

    // Generate customer ID
    const customerId = `DIR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12)

    // Create customer record in Supabase
    const customerData = {
      id: uuidv4(),
      customer_id: customerId,
      email: data.email,
      password_hash: passwordHash,
      full_name: data.full_name,
      business_name: data.business_name,
      business_website: data.business_website || '',
      business_phone: data.business_phone || '',
      business_address: data.business_address || '',
      business_city: data.business_city || '',
      business_state: data.business_state || '',
      business_zip: data.business_zip || '',
      business_description: data.business_description || '',
      business_category: data.business_category || '',
      package_type: data.package_type,
      subscription_status: 'active',
      total_directories_allocated: packageConfig.directory_limit,
      directories_submitted: 0,
      failed_directories: 0,
      status: 'pending',
      priority_level: packageConfig.priority_level,
      stripe_customer_id: data.stripe_customer_id || null,
      processing_metadata: {
        package_config: packageConfig,
        registration_date: new Date().toISOString(),
        estimated_completion: new Date(Date.now() + (packageConfig.directory_limit * 2 * 60 * 1000)).toISOString() // 2 minutes per directory
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newCustomer, error: insertError } = await supabase
      .from('customers')
      .insert([customerData])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Supabase insert error:', insertError)
      return res.status(500).json({
        error: 'Database Error',
        message: 'Failed to create customer record',
        requestId
      })
    }

    console.log('✅ Customer created in Supabase:', newCustomer.customer_id)

    // Create queue entry for AutoBolt processing
    const queueData = {
      id: uuidv4(),
      customer_id: newCustomer.customer_id,
      status: 'pending',
      package_type: data.package_type,
      directories_allocated: packageConfig.directory_limit,
      directories_processed: 0,
      directories_failed: 0,
      priority_level: packageConfig.priority_level,
      processing_speed: packageConfig.processing_speed,
      estimated_completion: new Date(Date.now() + (packageConfig.directory_limit * 2 * 60 * 1000)).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error: queueError } = await supabase
      .from('queue_history')
      .insert([queueData])

    if (queueError) {
      console.error('❌ Queue creation error:', queueError)
      // Don't fail the registration, just log the error
    } else {
      console.log('✅ Queue entry created for AutoBolt processing')
    }

    // Create customer notification
    const notificationData = {
      id: uuidv4(),
      customer_id: newCustomer.customer_id,
      notification_type: 'success',
      title: 'Welcome to DirectoryBolt!',
      message: `Your ${data.package_type} package has been activated. We'll start submitting your business to ${packageConfig.directory_limit} directories within the next hour.`,
      action_url: '/dashboard',
      action_text: 'View Dashboard',
      read: false,
      created_at: new Date().toISOString()
    }

    const { error: notificationError } = await supabase
      .from('customer_notifications')
      .insert([notificationData])

    if (notificationError) {
      console.error('❌ Notification creation error:', notificationError)
    } else {
      console.log('✅ Welcome notification created')
    }

    // Trigger AutoBolt extension processing
    try {
      await triggerAutoBoltProcessing(newCustomer.customer_id, data.package_type)
      console.log('✅ AutoBolt processing triggered')
    } catch (error) {
      console.error('❌ AutoBolt trigger error:', error)
      // Don't fail the registration, just log the error
    }

    // Log analytics event
    const analyticsData = {
      id: uuidv4(),
      customer_id: newCustomer.customer_id,
      event_type: 'registration',
      event_name: 'customer_registered',
      event_data: {
        package_type: data.package_type,
        directory_limit: packageConfig.directory_limit,
        business_category: data.business_category,
        registration_source: 'website'
      },
      created_at: new Date().toISOString()
    }

    const { error: analyticsError } = await supabase
      .from('analytics_events')
      .insert([analyticsData])

    if (analyticsError) {
      console.error('❌ Analytics logging error:', analyticsError)
    }

    console.log('🎉 Complete customer registration pipeline successful', { 
      requestId, 
      customerId: newCustomer.customer_id,
      packageType: data.package_type 
    })

    // Return success response
    res.status(201).json({
      success: true,
      data: {
        customer_id: newCustomer.customer_id,
        email: newCustomer.email,
        business_name: newCustomer.business_name,
        package_type: newCustomer.package_type,
        directory_limit: packageConfig.directory_limit,
        estimated_completion: queueData.estimated_completion,
        dashboard_url: '/dashboard',
        message: 'Registration successful! Your business will be submitted to directories automatically.'
      },
      requestId
    })

  } catch (error) {
    console.error('❌ Registration pipeline error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Registration failed. Please try again.',
      requestId
    })
  }
}

// Trigger AutoBolt extension processing
async function triggerAutoBoltProcessing(customerId: string, packageType: string) {
  try {
    // This would typically send a message to the AutoBolt extension
    // For now, we'll create a processing job in the database
    
    const processingJob = {
      id: uuidv4(),
      customer_id: customerId,
      job_type: 'directory_submission',
      status: 'pending',
      package_type: packageType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Store processing job for AutoBolt extension to pick up
    const { error } = await supabase
      .from('batch_operations')
      .insert([{
        id: processingJob.id,
        operation_type: 'process',
        customer_ids: [customerId],
        status: 'pending',
        total_customers: 1,
        processed_customers: 0,
        successful_operations: 0,
        failed_operations: 0,
        created_by: 'system',
        created_at: new Date().toISOString()
      }])

    if (error) {
      throw new Error(`Failed to create processing job: ${error.message}`)
    }

    return processingJob
  } catch (error) {
    console.error('❌ AutoBolt trigger error:', error)
    throw error
  }
}
