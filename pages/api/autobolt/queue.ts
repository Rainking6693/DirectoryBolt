// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'
import { rateLimit } from '../../../lib/utils/rate-limit'
import { queueManager } from '../../../lib/services/queue-manager'
import { getSupabaseAdminClient } from '../../../lib/server/supabaseAdmin'
import { enqueueCustomerForAutoBolt } from '../../../lib/server/autoboltQueueSync'
import type { AutoBoltResponse } from '../../../types/api'
import {
  findPendingCustomerBySessionOrEmail,
  updateSubmissionStatus
} from '../../../lib/services/customer-service'

// Rate limiting for AutoBolt API
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Limit each IP to 500 requests per interval
})

interface CustomerData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  businessName: string
  businessWebsite: string
  businessDescription: string
}

interface QueueSubmissionRequest {
  customer: CustomerData
  package: string
  categories: string[]
  paymentData: {
    sessionId: string
    customerId?: string
    subscriptionId?: string
  }
  billingCycle: 'monthly' | 'annual'
}

// AutoBolt Queue Integration with Airtable
// Phase 3, Section 3.1 Implementation

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AutoBoltResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    })
  }

  try {
    // Apply rate limiting
    await limiter.check(res, 10, 'autobolt-queue') // 10 requests per minute per IP
  } catch {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.'
    })
  }

  try {
    const {
      customer,
      package: packageType,
      categories,
      paymentData,
      billingCycle
    }: QueueSubmissionRequest = req.body

    // Validate required fields
    const validationError = validateQueueSubmission({
      customer,
      package: packageType,
      categories,
      paymentData,
      billingCycle
    })

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError
      })
    }

    // Get the customer's Airtable record to ensure they exist and get their customerId
    const customerRecord = await findPendingCustomerBySessionOrEmail(
      paymentData.sessionId ?? null,
      customer.email
    )

    if (!customerRecord) {
      return res.status(400).json({
        success: false,
        error: 'Customer not found in system. Please complete the business information form first.',
        message: 'Customer must go through payment → business info → queue workflow'
      })
    }

    // Check if customer is already in queue
    if (customerRecord.submissionStatus && customerRecord.submissionStatus !== 'pending') {
      return res.status(409).json({
        success: false,
        error: `Customer is already ${customerRecord.submissionStatus}`,
        message: 'Customer has already been processed or is currently in progress'
      })
    }

    // Add to queue for processing (this marks them for AutoBolt processing)
    console.log(`🔄 Adding customer ${customerRecord.customerId} to AutoBolt processing queue`)
    
    // Enqueue into Supabase-backed AutoBolt processing queue
    const supabase = getSupabaseAdminClient()
    if (supabase) {
      const result = await enqueueCustomerForAutoBolt(supabase as any, {
        customer_id: customerRecord.customerId,
        business_name: customerRecord.businessName,
        email: customerRecord.email,
        package_type: customerRecord.packageType
      } as any)
      if (!result.success) {
        console.warn('[autobolt.queue] enqueue failed/deferred:', result.message)
      }
    } else {
      console.warn('[autobolt.queue] Supabase not configured; enqueue deferred')
    }

    const queueId = `queue-${Date.now()}-${customerRecord.customerId}`
    
    // Estimate completion time based on package type
    const estimatedDays = packageType === 'pro' ? 1 : packageType === 'growth' ? 2 : 3
    const estimatedCompletion = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000).toISOString()

    await updateSubmissionStatus(customerRecord.customerId, 'in-progress')

    // Return success response
    return res.status(200).json({
      success: true,
      queueId,
      customerId: customerRecord.customerId,
      estimatedCompletion,
      message: 'Customer ready for AutoBolt processing. Processing will begin automatically.',
      data: {
        customerId: customerRecord.customerId,
        businessName: customerRecord.businessName,
        packageType: customerRecord.packageType,
        directoryLimit: getDirectoryLimit(customerRecord.packageType),
        submissionStatus: customerRecord.submissionStatus
      }
    })

  } catch (error) {
    console.error('AutoBolt Queue API Error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    })
  }
}

function validateQueueSubmission(data: QueueSubmissionRequest): string | null {
  const { customer, package: packageType, categories, paymentData, billingCycle } = data

  // Customer validation
  if (!customer.firstName?.trim()) return 'Customer first name is required'
  if (!customer.lastName?.trim()) return 'Customer last name is required'
  if (!customer.email?.trim()) return 'Customer email is required'
  if (!customer.businessName?.trim()) return 'Business name is required'
  if (!customer.businessWebsite?.trim()) return 'Business website is required'
  if (!customer.businessDescription?.trim()) return 'Business description is required'

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(customer.email)) {
    return 'Invalid email address format'
  }

  // Website validation
  const urlRegex = /^https?:\/\/.+/
  if (!urlRegex.test(customer.businessWebsite)) {
    return 'Invalid website URL format'
  }

  // Package validation
  const validPackages = ['starter', 'growth', 'professional', 'enterprise']
  if (!validPackages.includes(packageType)) {
    return `Invalid package type. Must be one of: ${validPackages.join(', ')}`
  }

  // Categories validation
  if (!Array.isArray(categories) || categories.length === 0) {
    return 'At least one directory category is required'
  }

  // Payment data validation
  if (!paymentData?.sessionId?.trim()) {
    return 'Payment session ID is required'
  }

  // Billing cycle validation
  if (!['monthly', 'annual'].includes(billingCycle)) {
    return 'Invalid billing cycle. Must be monthly or annual'
  }

  return null
}

function getDirectoryLimit(packageType: string): number {
  const limits = {
    'starter': 50,
    'growth': 100,
    'pro': 200,
    'subscription': 0 // Subscription is ongoing, not bulk
  }
  return limits[packageType?.toLowerCase() as keyof typeof limits] || 50
}