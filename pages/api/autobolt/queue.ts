import { NextApiRequest, NextApiResponse } from 'next'
import { rateLimit } from '../../../lib/utils/rate-limit'

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

interface AutoBoltResponse {
  success: boolean
  queueId?: string
  estimatedCompletion?: string
  error?: string
  message?: string
}

// Mock AutoBolt API configuration
// TODO: Replace with actual AutoBolt API endpoints from Shane's backend
const AUTOBOLT_CONFIG = {
  baseUrl: process.env.AUTOBOLT_API_URL || 'https://api.autobolt.com',
  apiKey: process.env.AUTOBOLT_API_KEY || 'mock-api-key',
  customersEndpoint: '/api/customers/register',
  queueEndpoint: '/api/queue/submit'
}

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

    // Create customer record in AutoBolt system
    const customerRegistration = await registerCustomerWithAutoBolt(customer, paymentData)
    
    if (!customerRegistration.success) {
      return res.status(400).json({
        success: false,
        error: `Customer registration failed: ${customerRegistration.error}`
      })
    }

    // Submit to processing queue
    const queueSubmission = await submitToAutoBoItQueue({
      customerId: customerRegistration.customerId,
      customer,
      package: packageType,
      categories,
      paymentData,
      billingCycle
    })

    if (!queueSubmission.success) {
      return res.status(400).json({
        success: false,
        error: `Queue submission failed: ${queueSubmission.error}`
      })
    }

    // Return success response
    return res.status(200).json({
      success: true,
      queueId: queueSubmission.queueId,
      estimatedCompletion: queueSubmission.estimatedCompletion,
      message: 'Successfully added to processing queue'
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

async function registerCustomerWithAutoBolt(
  customer: CustomerData,
  paymentData: { sessionId: string; customerId?: string; subscriptionId?: string }
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  
  // For development/demo purposes, we'll simulate the API call
  // TODO: Replace with actual AutoBolt API integration
  if (process.env.NODE_ENV === 'development' || !process.env.AUTOBOLT_API_KEY) {
    console.log('🔧 [DEV MODE] Simulating AutoBolt customer registration:', {
      customer: customer.businessName,
      email: customer.email,
      sessionId: paymentData.sessionId
    })
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      success: true,
      customerId: `mock-customer-${Date.now()}`
    }
  }

  try {
    const response = await fetch(`${AUTOBOLT_CONFIG.baseUrl}${AUTOBOLT_CONFIG.customersEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTOBOLT_CONFIG.apiKey}`,
        'X-API-Source': 'DirectoryBolt'
      },
      body: JSON.stringify({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        businessName: customer.businessName,
        businessWebsite: customer.businessWebsite,
        businessDescription: customer.businessDescription,
        paymentData: {
          sessionId: paymentData.sessionId,
          customerId: paymentData.customerId,
          subscriptionId: paymentData.subscriptionId
        },
        source: 'DirectoryBolt'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const result = await response.json()
    return {
      success: true,
      customerId: result.customerId || result.id
    }

  } catch (error) {
    console.error('AutoBolt Customer Registration Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

async function submitToAutoBoItQueue(data: {
  customerId: string
  customer: CustomerData
  package: string
  categories: string[]
  paymentData: { sessionId: string; customerId?: string; subscriptionId?: string }
  billingCycle: 'monthly' | 'annual'
}): Promise<{ success: boolean; queueId?: string; estimatedCompletion?: string; error?: string }> {

  // For development/demo purposes, we'll simulate the API call
  // TODO: Replace with actual AutoBolt API integration
  if (process.env.NODE_ENV === 'development' || !process.env.AUTOBOLT_API_KEY) {
    console.log('🔧 [DEV MODE] Simulating AutoBolt queue submission:', {
      customerId: data.customerId,
      package: data.package,
      categories: data.categories,
      billingCycle: data.billingCycle
    })
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const queueId = `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const estimatedDays = data.package === 'enterprise' ? 1 : data.package === 'professional' ? 2 : 3
    const estimatedCompletion = new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000).toISOString()
    
    return {
      success: true,
      queueId,
      estimatedCompletion
    }
  }

  try {
    // Calculate directory count based on package
    const directoryLimits = {
      starter: 50,
      growth: 200,
      professional: 500,
      enterprise: 1000 // "Unlimited" but capped for processing
    }

    const response = await fetch(`${AUTOBOLT_CONFIG.baseUrl}${AUTOBOLT_CONFIG.queueEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTOBOLT_CONFIG.apiKey}`,
        'X-API-Source': 'DirectoryBolt'
      },
      body: JSON.stringify({
        customerId: data.customerId,
        packageType: data.package,
        directoryCount: directoryLimits[data.package as keyof typeof directoryLimits] || 50,
        categories: data.categories,
        priority: data.package === 'enterprise' ? 'high' : data.package === 'professional' ? 'medium' : 'normal',
        billingCycle: data.billingCycle,
        businessInfo: {
          name: data.customer.businessName,
          website: data.customer.businessWebsite,
          description: data.customer.businessDescription
        },
        paymentReference: {
          sessionId: data.paymentData.sessionId,
          subscriptionId: data.paymentData.subscriptionId
        },
        source: 'DirectoryBolt'
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const result = await response.json()
    return {
      success: true,
      queueId: result.queueId || result.id,
      estimatedCompletion: result.estimatedCompletion
    }

  } catch (error) {
    console.error('AutoBolt Queue Submission Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}