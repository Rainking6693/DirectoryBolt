// Minimal test version of the analyze API to identify hanging issues

const axios = require('axios')
const cheerio = require('cheerio')

// Simple CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
}

// Simplified URL validation
function validateUrl(url) {
  try {
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Invalid protocol' }
    }
    return { isValid: true, sanitizedUrl: urlObj.toString() }
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' }
  }
}

// Minimal metadata extraction
function extractBasicMetadata(html, url) {
  try {
    const $ = cheerio.load(html)
    const title = $('title').text().trim() || new URL(url).hostname
    const description = $('meta[name="description"]').attr('content') || 'No description available'
    return { title, description, seoScore: 75 }
  } catch (error) {
    console.error('Error extracting metadata:', error.message)
    return { 
      title: new URL(url).hostname, 
      description: 'Error extracting metadata', 
      seoScore: 50 
    }
  }
}

// Generate simple analysis results
function generateSimpleResults(url, title, description, seoScore) {
  return {
    title,
    description,
    seoScore,
    currentListings: Math.floor(Math.random() * 8) + 3,
    missedOpportunities: Math.floor(Math.random() * 15) + 5,
    potentialLeads: Math.floor(Math.random() * 200) + 100,
    visibility: Math.floor(Math.random() * 40) + 60,
    issues: [
      {
        type: 'warning',
        title: 'SEO Optimization Needed',
        description: 'Your website could benefit from better SEO practices.',
        impact: 'Medium',
        priority: 2
      }
    ],
    recommendations: [
      {
        action: 'Optimize meta tags and content structure',
        impact: 'Improve search rankings by 15-25%',
        effort: 'medium'
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
        authority: 93,
        estimatedTraffic: 30000,
        submissionDifficulty: 'Easy',
        cost: 0
      }
    ]
  }
}

module.exports = async function handler(req, res) {
  console.log('=== ANALYZE TEST API START ===')
  console.log('Method:', req.method)
  console.log('Body:', req.body)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value)
    })
    return res.status(200).end()
  }

  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  const requestId = `test_${Date.now()}`
  
  try {
    // Only allow POST
    if (req.method !== 'POST') {
      console.log('Method not allowed:', req.method)
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        requestId
      })
    }

    const { url } = req.body
    console.log('Analyzing URL:', url)

    if (!url) {
      console.log('No URL provided')
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        requestId
      })
    }

    // Validate URL
    const urlValidation = validateUrl(url)
    if (!urlValidation.isValid) {
      console.log('URL validation failed:', urlValidation.error)
      return res.status(400).json({
        success: false,
        error: urlValidation.error,
        requestId
      })
    }

    console.log('URL validated successfully:', urlValidation.sanitizedUrl)

    // Try to fetch website with short timeout
    let title = 'Test Analysis'
    let description = 'Test analysis completed'
    let seoScore = 75

    try {
      console.log('Fetching website content...')
      
      const response = await axios.get(urlValidation.sanitizedUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'DirectoryBolt/2.0 Test Analyzer',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        maxRedirects: 3,
        validateStatus: (status) => status < 500,
        maxContentLength: 2 * 1024 * 1024, // 2MB limit
      })

      console.log('Website fetch completed, status:', response.status)

      if (response.status >= 400) {
        console.log('Website returned error status:', response.status)
        title = `Test Analysis for ${new URL(urlValidation.sanitizedUrl).hostname}`
        description = `Website returned ${response.status} status`
        seoScore = 25
      } else {
        console.log('Extracting metadata from HTML...')
        const metadata = extractBasicMetadata(response.data, urlValidation.sanitizedUrl)
        title = metadata.title
        description = metadata.description
        seoScore = metadata.seoScore
        console.log('Metadata extracted:', { title: title.substring(0, 50), seoScore })
      }

    } catch (fetchError) {
      console.log('Website fetch failed:', fetchError.message)
      title = `Test Analysis for ${new URL(urlValidation.sanitizedUrl).hostname}`
      description = 'Analysis completed with limited data due to fetch error'
      seoScore = 35
    }

    console.log('Generating analysis results...')
    
    // Generate results
    const analysisData = generateSimpleResults(
      urlValidation.sanitizedUrl, 
      title, 
      description, 
      seoScore
    )

    console.log('Analysis completed successfully')

    return res.status(200).json({
      success: true,
      data: analysisData,
      requestId,
      debug: {
        method: req.method,
        url: urlValidation.sanitizedUrl,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('ERROR in test API:', error.message)
    console.error('Stack:', error.stack)
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error during analysis',
      details: error.message,
      requestId
    })
  } finally {
    console.log('=== ANALYZE TEST API END ===')
  }
}