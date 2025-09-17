import { NextApiRequest, NextApiResponse } from 'next'
import { verifyAdminAuth } from '../../../../lib/auth/admin-auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // SECURITY FIX: Require admin authentication for customer stats access
  if (!(await verifyAdminAuth(req, res))) {
    return // Response already sent by verifyAdminAuth
  }

  try {
    // Import Google Sheets service
    const { createGoogleSheetsService } = require('../../../../lib/services/google-sheets.js')
    
    // Initialize the service
    const googleSheetsService = createGoogleSheetsService()
    await googleSheetsService.initialize()

    // Get all customers from Google Sheets
    const result = await googleSheetsService.getAllCustomers(1000)
    
    if (result.success) {
      const customers = result.customers
      
      // Calculate real stats from actual data
      const totalCustomers = customers.length
      const activeCustomers = customers.filter(c => c.status === 'active').length
      const monitoringCustomers = customers.filter(c => c.packageType && c.packageType !== 'starter').length
      
      const stats = {
        totalCustomers,
        activeMonitoring: monitoringCustomers,
        alertsGenerated: 0, // TODO: Add alerts tracking
        complianceRequests: 0 // TODO: Add compliance tracking
      }

      res.status(200).json(stats)
    } else {
      console.error('Failed to fetch customers from Google Sheets:', result.error)
      
      // Fallback to mock data if Google Sheets fails
      const stats = {
        totalCustomers: 0,
        activeMonitoring: 0,
        alertsGenerated: 0,
        complianceRequests: 0,
        error: 'Google Sheets connection failed'
      }

      res.status(200).json(stats)
    }
  } catch (error) {
    console.error('Failed to get customer stats:', error)
    
    // Return error response with details
    res.status(500).json({ 
      error: 'Failed to get customer stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}