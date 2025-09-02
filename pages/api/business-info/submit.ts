import { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
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
 */
function mapPackageType(stripePackage?: string): 'starter' | 'growth' | 'professional' | 'enterprise' {
  switch (stripePackage?.toLowerCase()) {
    case 'starter':
    case 'price_starter_49_usd':
      return 'starter'
    case 'growth':
    case 'price_growth_89_usd':
      return 'growth'
    case 'professional':
    case 'pro':
    case 'price_pro_159_usd':
      return 'professional'
    case 'enterprise':
      return 'enterprise'
    default:
      return 'starter' // Default fallback
  }
}

// Disable bodyParser to handle file uploads
export const config = {
  api: {
    bodyParser: false,
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
    // Parse form data including file uploads
    const form = formidable({
      uploadDir: './uploads',
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // 5MB max file size
    })

    // Ensure uploads directory exists
    if (!fs.existsSync('./uploads')) {
      fs.mkdirSync('./uploads', { recursive: true })
    }

    const [fields, files] = await form.parse(req)
    
    // Extract form data
    const businessData: BusinessSubmission = {
      firstName: Array.isArray(fields.firstName) ? fields.firstName[0] : fields.firstName || '',
      lastName: Array.isArray(fields.lastName) ? fields.lastName[0] : fields.lastName || '',
      businessName: Array.isArray(fields.businessName) ? fields.businessName[0] : fields.businessName || '',
      email: Array.isArray(fields.email) ? fields.email[0] : fields.email || '',
      phone: Array.isArray(fields.phone) ? fields.phone[0] : fields.phone || '',
      address: Array.isArray(fields.address) ? fields.address[0] : fields.address || '',
      city: Array.isArray(fields.city) ? fields.city[0] : fields.city || '',
      state: Array.isArray(fields.state) ? fields.state[0] : fields.state || '',
      zip: Array.isArray(fields.zip) ? fields.zip[0] : fields.zip || '',
      website: Array.isArray(fields.website) ? fields.website[0] : fields.website || '',
      description: Array.isArray(fields.description) ? fields.description[0] : fields.description || '',
      facebook: Array.isArray(fields.facebook) ? fields.facebook[0] : fields.facebook || '',
      instagram: Array.isArray(fields.instagram) ? fields.instagram[0] : fields.instagram || '',
      linkedin: Array.isArray(fields.linkedin) ? fields.linkedin[0] : fields.linkedin || '',
      sessionId: Array.isArray(fields.sessionId) ? fields.sessionId[0] : fields.sessionId || '',
      packageType: Array.isArray(fields.packageType) ? fields.packageType[0] : fields.packageType || '',
      submissionStatus: Array.isArray(fields.submissionStatus) ? fields.submissionStatus[0] : fields.submissionStatus || 'pending',
      purchaseDate: Array.isArray(fields.purchaseDate) ? fields.purchaseDate[0] : fields.purchaseDate || new Date().toISOString(),
    }

    // Handle logo file if uploaded
    if (files.logo && Array.isArray(files.logo) && files.logo[0]) {
      businessData.logo = files.logo[0].filepath
    }

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
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}