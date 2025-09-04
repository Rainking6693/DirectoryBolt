import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { url } = req.body

    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' })
    }

    // Mock response matching the expected format
    const mockResponse = {
      success: true,
      data: {
        url: url,
        title: 'Example Website Analysis',
        description: 'This is a test analysis of the provided website.',
        currentListings: 3,
        missedOpportunities: 12,
        competitorAdvantage: 25,
        potentialLeads: 150,
        visibility: 20,
        seoScore: 72,
        issues: [
          {
            type: 'warning' as const,
            title: 'Low Directory Presence',
            description: 'Your business could benefit from more directory listings.',
            impact: 'Medium',
            priority: 2
          }
        ],
        recommendations: [
          {
            action: 'Submit to Google My Business',
            impact: 'Increase local visibility and search presence',
            effort: 'low' as const
          },
          {
            action: 'Create Yelp business profile',
            impact: 'Improve customer review visibility',
            effort: 'medium' as const
          }
        ],
        directoryOpportunities: [
          {
            name: 'Google My Business',
            authority: 98,
            estimatedTraffic: 50000,
            submissionDifficulty: 'Easy',
            cost: 0
          },
          {
            name: 'Yelp',
            authority: 92,
            estimatedTraffic: 30000,
            submissionDifficulty: 'Easy',
            cost: 0
          },
          {
            name: 'Facebook Business',
            authority: 90,
            estimatedTraffic: 25000,
            submissionDifficulty: 'Easy',
            cost: 0
          }
        ]
      },
      requestId: `req_${Date.now()}_test`
    }

    return res.status(200).json(mockResponse)

  } catch (error) {
    console.error('Test endpoint error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      requestId: `req_${Date.now()}_error`
    })
  }
}