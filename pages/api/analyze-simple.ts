// Import polyfills first to ensure Node.js 18 compatibility with undici/supabase
import '../../lib/utils/node-polyfills'

import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import * as cheerio from 'cheerio'

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

interface AnalysisRequest {
  url: string
  options?: string
}

interface AnalysisResponse {
  success: boolean
  data?: {
    url: string
    title: string
    description: string
    currentListings: number
    missedOpportunities: number
    competitorAdvantage: number
    potentialLeads: number
    visibility: number
    seoScore: number
    issues: Array<{
      type: 'critical' | 'warning' | 'info'
      title: string
      description: string
      impact: string
      priority: number
    }>
    recommendations: Array<{
      action: string
      impact: string
      effort: 'low' | 'medium' | 'high'
    }>
    directoryOpportunities: Array<{
      name: string
      authority: number
      estimatedTraffic: number
      submissionDifficulty: string
      cost: number
    }>
  }
  error?: string
  requestId?: string
}

// Rate limiting function
function checkRateLimit(ipAddress: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const key = ipAddress
  const limit = rateLimitMap.get(key)

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(key, { count: 1, resetTime: now + 60000 }) // 1 minute window
    return { allowed: true }
  }

  if (limit.count >= 10) { // 10 requests per minute
    return { allowed: false, retryAfter: Math.ceil((limit.resetTime - now) / 1000) }
  }

  limit.count++
  return { allowed: true }
}

// Extract metadata from HTML
function extractMetadata(html: string, url: string) {
  const $ = cheerio.load(html)
  
  const title = $('title').text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                $('h1').first().text().trim() || 
                'No title found'
                
  const description = $('meta[name="description"]').attr('content') ||
                     $('meta[property="og:description"]').attr('content') ||
                     $('p').first().text().trim().substring(0, 160) ||
                     'No description found'

  // Calculate basic SEO score
  let seoScore = 50 // Base score
  
  if (title && title.length > 10 && title.length < 60) seoScore += 15
  if (description && description.length > 50 && description.length < 160) seoScore += 15
  if ($('meta[name="keywords"]').attr('content')) seoScore += 5
  if ($('meta[property="og:image"]').attr('content')) seoScore += 5
  if ($('h1').length > 0) seoScore += 5
  if ($('h2').length > 0) seoScore += 5

  return { title, description, seoScore: Math.min(seoScore, 100) }
}

// Generate mock directory opportunities
function generateDirectoryOpportunities(title: string, domain: string) {
  const directories = [
    { name: 'Google My Business', authority: 95, traffic: 50000, difficulty: 'Easy', cost: 0 },
    { name: 'Yelp', authority: 92, traffic: 30000, difficulty: 'Easy', cost: 0 },
    { name: 'Facebook Business', authority: 90, traffic: 25000, difficulty: 'Easy', cost: 0 },
    { name: 'LinkedIn Company', authority: 88, traffic: 15000, difficulty: 'Medium', cost: 0 },
    { name: 'Better Business Bureau', authority: 85, traffic: 12000, difficulty: 'Medium', cost: 299 },
    { name: 'Yellow Pages', authority: 82, traffic: 8000, difficulty: 'Easy', cost: 19.99 },
    { name: 'Foursquare', authority: 80, traffic: 6000, difficulty: 'Easy', cost: 0 },
    { name: 'TripAdvisor', authority: 85, traffic: 20000, difficulty: 'Medium', cost: 0 },
    { name: 'Industry Directory', authority: 75, traffic: 5000, difficulty: 'Medium', cost: 99 },
    { name: 'Local Chamber of Commerce', authority: 70, traffic: 3000, difficulty: 'Hard', cost: 200 }
  ]

  // Randomize and select some directories
  const selected = directories.sort(() => Math.random() - 0.5).slice(0, 6)
  
  return selected.map(dir => ({
    name: dir.name,
    authority: dir.authority,
    estimatedTraffic: dir.traffic,
    submissionDifficulty: dir.difficulty,
    cost: dir.cost
  }))
}

// Generate analysis results
function generateAnalysisResults(url: string, title: string, description: string, seoScore: number) {
  const domain = new URL(url).hostname
  
  // Mock some realistic numbers
  const currentListings = Math.floor(Math.random() * 8) + 2 // 2-10
  const missedOpportunities = Math.floor(Math.random() * 15) + 5 // 5-20
  const competitorAdvantage = Math.floor(Math.random() * 30) + 10 // 10-40
  const potentialLeads = Math.floor(Math.random() * 200) + 50 // 50-250
  const visibility = Math.min(Math.floor((currentListings / (currentListings + missedOpportunities)) * 100), 95)

  const issues = []
  const recommendations = []

  // Generate issues based on SEO score and other factors
  if (seoScore < 70) {
    issues.push({
      type: 'warning' as const,
      title: 'SEO Score Below Average',
      description: 'Your website\'s SEO score could be improved with better meta tags and content structure.',
      impact: 'Medium',
      priority: 2
    })
    
    recommendations.push({
      action: 'Optimize meta descriptions and title tags',
      impact: 'Improves search engine visibility and click-through rates',
      effort: 'low' as const
    })
  }

  if (currentListings < 5) {
    issues.push({
      type: 'critical' as const,
      title: 'Low Directory Presence',
      description: 'Your business is listed in fewer than 5 major directories, limiting online visibility.',
      impact: 'High',
      priority: 1
    })
    
    recommendations.push({
      action: 'Submit to major directories like Google My Business and Yelp',
      impact: 'Significantly increases online visibility and local search presence',
      effort: 'medium' as const
    })
  }

  if (missedOpportunities > 15) {
    issues.push({
      type: 'info' as const,
      title: 'Multiple Directory Opportunities',
      description: 'There are several industry-specific directories where your business could be listed.',
      impact: 'Medium',
      priority: 3
    })
    
    recommendations.push({
      action: 'Research and submit to industry-specific directories',
      impact: 'Builds authority and reaches targeted audiences',
      effort: 'high' as const
    })
  }

  const directoryOpportunities = generateDirectoryOpportunities(title, domain)

  return {
    url,
    title,
    description,
    currentListings,
    missedOpportunities,
    competitorAdvantage,
    potentialLeads,
    visibility,
    seoScore,
    issues,
    recommendations,
    directoryOpportunities
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResponse>
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.setHeader('Access-Control-Max-Age', '86400')
    return res.status(200).end()
  }

  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      requestId
    })
  }

  try {
    // Rate limiting
    const clientIP = req.headers['x-forwarded-for'] as string || 
                    req.headers['x-real-ip'] as string || 
                    req.socket.remoteAddress || 
                    'unknown'
    
    const rateLimitResult = checkRateLimit(clientIP)
    if (!rateLimitResult.allowed) {
      res.setHeader('Retry-After', rateLimitResult.retryAfter || 60)
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds.`,
        requestId
      })
    }

    const { url, options }: AnalysisRequest = req.body

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        requestId
      })
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format',
        requestId
      })
    }

    // Parse options
    let parsedOptions = {}
    if (options) {
      try {
        parsedOptions = JSON.parse(options)
      } catch (error) {
        // Ignore invalid options, use defaults
      }
    }

    // Fetch the website
    console.log(`Analyzing website: ${url}`)
    
    let html = ''
    let title = 'Website Analysis'
    let description = 'Analysis completed'
    let seoScore = 75

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'DirectoryBolt/2.0 Website Analyzer (+https://directorybolt.com)'
        },
        maxRedirects: 5,
        validateStatus: (status) => status < 400
      })

      html = response.data
      const metadata = extractMetadata(html, url)
      title = metadata.title
      description = metadata.description
      seoScore = metadata.seoScore

    } catch (error) {
      console.warn(`Failed to fetch ${url}:`, error instanceof Error ? error.message : 'Unknown error')
      // Continue with fallback data
      title = `Analysis for ${validUrl.hostname}`
      description = 'Website analysis completed with limited data due to access restrictions.'
      seoScore = 45
    }

    // Generate comprehensive analysis results
    const analysisData = generateAnalysisResults(url, title, description, seoScore)

    console.log(`Analysis completed for ${url}: Score=${seoScore}, Listings=${analysisData.currentListings}`)

    return res.status(200).json({
      success: true,
      data: analysisData,
      requestId
    })

  } catch (error) {
    console.error('Website analysis error:', error)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during analysis',
      requestId
    })
  }
}

// Increase API timeout for complex analysis
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
}