import { NextApiRequest, NextApiResponse } from 'next'

interface SystemAlert {
  id: string
  type: 'system' | 'directory' | 'customer' | 'compliance'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  timestamp: string
  resolved: boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Mock alerts for now
    const alerts: SystemAlert[] = [
      {
        id: 'alert-sys-001',
        type: 'system',
        severity: 'medium',
        message: 'High memory usage detected on processing server',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        resolved: false
      },
      {
        id: 'alert-dir-002',
        type: 'directory',
        severity: 'low',
        message: 'Slow response time from Yelp directory API',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        resolved: false
      },
      {
        id: 'alert-cust-003',
        type: 'customer',
        severity: 'high',
        message: 'Customer processing queue backup detected',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        resolved: true
      }
    ]

    res.status(200).json({ alerts })
  } catch (error) {
    console.error('Failed to get alerts:', error)
    res.status(500).json({ error: 'Failed to get alerts' })
  }
}