import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Mock directory stats for now
    const stats = {
      total: 480, // Total directories in system
      active: 450, // Active directories
      monitoring: 425, // Currently being monitored
      errors: Math.floor(Math.random() * 10) + 2, // 2-12 errors
      averageResponseTime: 800 + Math.random() * 400 // 800-1200ms average response
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error('Failed to get directory stats:', error)
    res.status(500).json({ error: 'Failed to get directory stats' })
  }
}