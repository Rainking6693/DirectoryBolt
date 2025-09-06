// LEGACY API ENDPOINT - REDIRECTS TO NEW AI-POWERED ANALYSIS
// This file is kept for backward compatibility
// All new analysis requests should use the TypeScript version

// Import the new AI-powered analysis handler
import analyzeHandler from './analyze.ts'

// Redirect all requests to the new AI-powered analysis endpoint
export default function handler(req, res) {
  // Forward the request to the new TypeScript handler
  return analyzeHandler(req, res)
}

// Export handler wrapped with rate limiting
export default withRateLimit(rateLimitConfigs.analyze, '/api/analyze')(handler)