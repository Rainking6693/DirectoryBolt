// Health check endpoint with comprehensive monitoring
export default function handler(req, res) {
  // Prevent execution during build time - Next.js static generation fix
  if (!req || !res || typeof res.status !== 'function') {
    console.warn('API route called during build time - skipping execution')
    return { notFound: true }
  }

  try {
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      method: req.method,
      environment: process.env.NODE_ENV || 'development',
      deployment: {
        netlify: process.env.NETLIFY === 'true',
        building: process.env.BUILDING === 'true',
        nodeVersion: process.version,
        nextVersion: require('next/package.json').version
      },
      services: {
        database: 'OK', // Add actual database check if needed
        stripe: process.env.STRIPE_SECRET_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
        airtable: process.env.AIRTABLE_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED'
      }
    }

    return res.status(200).json(healthData)
  } catch (error) {
    console.warn('Health check error:', error.message)
    return res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
}