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
    // Mock customer stats for now
    const stats = {
      totalCustomers: Math.floor(Math.random() * 500) + 100, // 100-600 customers
      activeMonitoring: Math.floor(Math.random() * 50) + 20, // 20-70 active
      alertsGenerated: Math.floor(Math.random() * 20) + 5, // 5-25 alerts
      complianceRequests: Math.floor(Math.random() * 10) + 2 // 2-12 compliance requests
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error('Failed to get customer stats:', error)
    res.status(500).json({ error: 'Failed to get customer stats' })
  }
}