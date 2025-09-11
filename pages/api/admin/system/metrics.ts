import { NextApiRequest, NextApiResponse } from 'next'
import { verifyAdminAuth } from '../../../../lib/auth/admin-auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // SECURITY FIX: Require admin authentication for system metrics access
  if (!(await verifyAdminAuth(req, res))) {
    return // Response already sent by verifyAdminAuth
  }

  try {
    // Mock system metrics for now
    const metrics = {
      cpu: Math.random() * 0.8, // 0-80% CPU usage
      memory: Math.random() * 0.7, // 0-70% memory usage
      network: Math.random() * 0.6, // 0-60% network usage
      responseTime: 150 + Math.random() * 300, // 150-450ms response time
      uptime: 86400 + Math.random() * 172800, // 1-3 days uptime in seconds
      activeConnections: Math.floor(Math.random() * 100) + 20 // 20-120 connections
    }

    res.status(200).json(metrics)
  } catch (error) {
    console.error('Failed to get system metrics:', error)
    res.status(500).json({ error: 'Failed to get system metrics' })
  }
}