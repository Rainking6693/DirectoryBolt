// Simple health check endpoint with build-time safety
module.exports = function handler(req, res) {
  // Prevent execution during build time - Next.js static generation fix
  if (!req || !res || typeof res.status !== 'function') {
    console.warn('API route called during build time - skipping execution')
    return { notFound: true }
  }

  try {
    return res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      method: req.method,
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    console.warn('Health check error:', error.message)
    return res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString()
    })
  }
}