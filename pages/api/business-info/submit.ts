import { NextApiRequest, NextApiResponse } from 'next'
import { createAirtableService, BusinessSubmissionRecord } from '../../../lib/services/airtable'

interface BusinessSubmission {
  firstName: string
  lastName: string
  businessName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  website: string
  description: string
  facebook?: string
  instagram?: string
  linkedin?: string
  logo?: string // Will be file path after upload
  sessionId?: string
  packageType?: string
  submissionStatus: string
  purchaseDate: string
  customerId?: string
}

/**
 * Map Stripe package types to Airtable package types
 * CRITICAL: Must match payment plan IDs exactly
 */
function mapPackageType(stripePackage?: string): 'starter' | 'growth' | 'pro' | 'subscription' {
  switch (stripePackage?.toLowerCase()) {
    case 'starter':
    case 'price_starter_49_usd':
      return 'starter'
    case 'growth':
    case 'price_growth_89_usd':
      return 'growth'
    case 'pro':
    case 'professional':
    case 'price_pro_159_usd':
      return 'pro'
    case 'subscription':
    case 'price_subscription_49_usd':
      return 'subscription'
    default:
      return 'starter' // Default fallback
  }
}

// Enable standard bodyParser (no file uploads for now)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed. Use POST.' 
    })
  }

  try {
    // Extract form data from request body (no file uploads for now)
    const businessData: BusinessSubmission = {
      firstName: req.body.firstName || '',
      lastName: req.body.lastName || '',
      businessName: req.body.businessName || '',
      email: req.body.email || '',
      phone: req.body.phone || '',
      address: req.body.address || '',
      city: req.body.city || '',
      state: req.body.state || '',
      zip: req.body.zip || '',
      website: req.body.website || '',
      description: req.body.description || '',
      facebook: req.body.facebook || '',
      instagram: req.body.instagram || '',
      linkedin: req.body.linkedin || '',
      sessionId: req.body.sessionId || '',
      packageType: req.body.packageType || '',
      submissionStatus: req.body.submissionStatus || 'pending',
      purchaseDate: req.body.purchaseDate || new Date().toISOString(),
    }

    // Note: Logo file upload temporarily disabled - can be implemented with base64 or external service

    // Initialize Airtable service
    let airtableService
    try {
      airtableService = createAirtableService()
    } catch (error) {
      console.error('❌ Failed to initialize Airtable service:', error)
      return res.status(500).json({
        success: false,
        message: 'Customer data service unavailable. Please contact support.',
        error: 'Airtable configuration error'
      })
    }

    // Create Airtable record with business submission data
    const airtableRecord = await airtableService.createBusinessSubmission({
      firstName: businessData.firstName,
      lastName: businessData.lastName,
      packageType: mapPackageType(businessData.packageType),
      submissionStatus: 'pending',
      purchaseDate: businessData.purchaseDate,
      businessName: businessData.businessName,
      email: businessData.email,
      phone: businessData.phone,
      address: businessData.address,
      city: businessData.city,
      state: businessData.state,
      zip: businessData.zip,
      website: businessData.website,
      description: businessData.description,
      facebook: businessData.facebook,
      instagram: businessData.instagram,
      linkedin: businessData.linkedin,
      sessionId: businessData.sessionId,
      logo: businessData.logo
    })

    console.log('📝 Business Info Submission:', {
      customerId: airtableRecord.customerId,
      businessName: airtableRecord.businessName,
      email: airtableRecord.email,
      packageType: airtableRecord.packageType,
      sessionId: airtableRecord.sessionId,
      hasLogo: !!airtableRecord.logo,
      airtableRecordId: airtableRecord.recordId
    })

    // Success response with actual Airtable data
    const response = {
      success: true,
      customerId: airtableRecord.customerId,
      message: 'Business information saved successfully',
      data: {
        recordId: airtableRecord.recordId,
        customerId: airtableRecord.customerId,
        businessName: airtableRecord.businessName,
        submissionStatus: airtableRecord.submissionStatus,
        packageType: airtableRecord.packageType,
        totalDirectories: airtableRecord.totalDirectories,
        createdAt: new Date().toISOString()
      }
    }

    console.log('✅ Business info submission successful:', response.data)
    
    return res.status(200).json(response)

  } catch (error) {
    console.error('❌ Business info submission failed:', error)
    
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to save business information. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : 'Internal server error'
    })
  }
}