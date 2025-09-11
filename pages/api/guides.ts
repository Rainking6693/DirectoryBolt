import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

interface Guide {
  id: string
  title: string
  category: string
  difficulty: string
  estimatedReadTime: string
  publishedAt: string
  updatedAt: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const guidesDirectory = path.join(process.cwd(), 'data', 'guides')
    
    // Check if guides directory exists
    if (!fs.existsSync(guidesDirectory)) {
      return res.status(200).json([])
    }

    // Read all guide files
    const guideFiles = fs.readdirSync(guidesDirectory).filter(file => file.endsWith('.json'))
    const guides: Guide[] = []

    for (const file of guideFiles) {
      try {
        const filePath = path.join(guidesDirectory, file)
        const fileContent = fs.readFileSync(filePath, 'utf8')
        
        // Skip empty files
        if (!fileContent.trim()) continue
        
        const guide = JSON.parse(fileContent)
        
        // Extract basic info for API response
        guides.push({
          id: guide.id || path.basename(file, '.json'),
          title: guide.title || guide.directoryName || 'Untitled Guide',
          category: guide.category || 'General',
          difficulty: guide.difficulty || 'beginner',
          estimatedReadTime: guide.estimatedReadTime || '5 min read',
          publishedAt: guide.publishedAt || new Date().toISOString(),
          updatedAt: guide.updatedAt || new Date().toISOString()
        })
      } catch (error) {
        // Skip invalid JSON files but don't fail the entire request
        console.warn(`Skipping invalid guide file: ${file}`, error)
        continue
      }
    }

    // Sort guides by updated date (newest first)
    guides.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    res.status(200).json({
      success: true,
      count: guides.length,
      guides: guides
    })
  } catch (error) {
    console.error('Error fetching guides:', error)
    res.status(500).json({
      error: 'Failed to fetch guides',
      success: false,
      guides: []
    })
  }
}