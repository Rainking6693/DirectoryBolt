// const monitor = require('../../lib/monitoring/analysis-monitor')
// Monitoring disabled to fix hanging issues

// Simple authentication for monitoring endpoint
function isAuthorized(req) {
  const authHeader = req.headers.authorization
  const token = process.env.MONITOR_ACCESS_TOKEN
  
  if (!token) return false
  
  return authHeader === `Bearer ${token}`
}

module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  // Check authorization in production
  if (process.env.NODE_ENV === 'production' && !isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  try {
    const { type = 'health' } = req.query
    
    switch (type) {
      case 'health':
        return res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          message: 'Monitoring system temporarily disabled'
        })
        
      case 'metrics':
        return res.status(200).json({
          message: 'Monitoring metrics temporarily unavailable',
          timestamp: new Date().toISOString()
        })
        
      case 'errors':
        return res.status(200).json({
          errors: [],
          total: 0,
          message: 'Error tracking temporarily disabled'
        })
        
      case 'report':
        return res.status(200).json({
          message: 'Monitoring reports temporarily unavailable',
          timestamp: new Date().toISOString()
        })
        
      default:
        return res.status(400).json({ error: 'Invalid type parameter' })
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}