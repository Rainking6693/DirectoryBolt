import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // SECURITY FIX: Implement proper authentication
  console.log('🔐 Admin auth check requested from IP:', req.headers['x-forwarded-for'] || req.socket.remoteAddress)
  
  // Check for admin API key in headers (highest priority)
  const adminKey = req.headers['x-admin-key'] || req.headers['authorization']
  const validAdminKey = process.env.ADMIN_API_KEY || 'DirectoryBolt-Admin-2025-SecureKey'
  
  if (adminKey === validAdminKey || adminKey === `Bearer ${validAdminKey}`) {
    console.log('✅ Admin authenticated via API key')
    return res.status(200).json({ 
      authenticated: true, 
      user: { role: 'admin', method: 'api_key' }
    })
  }

  // Check for admin session/cookie
  const adminSession = req.cookies['admin-session']
  const validAdminSession = process.env.ADMIN_SESSION_TOKEN || 'DirectoryBolt-Session-2025'
  
  if (adminSession === validAdminSession) {
    console.log('✅ Admin authenticated via session')
    return res.status(200).json({ 
      authenticated: true, 
      user: { role: 'admin', method: 'session' }
    })
  }

  // Check for basic auth credentials
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
    const [username, password] = credentials.split(':')
    
    const validUsername = process.env.ADMIN_USERNAME || 'admin'
    const validPassword = process.env.ADMIN_PASSWORD || 'DirectoryBolt2025!'
    
    if (username === validUsername && password === validPassword) {
      console.log('✅ Admin authenticated via basic auth')
      return res.status(200).json({ 
        authenticated: true, 
        user: { role: 'admin', email: 'admin@directorybolt.com', method: 'basic_auth' }
      })
    }
  }

  // SECURITY FIX: Development bypass removed for production security
  // All authentication must go through proper channels

  // No valid admin authentication found
  console.log('❌ Admin authentication failed - no valid credentials')
  return res.status(401).json({ 
    error: 'Unauthorized', 
    message: 'Admin authentication required',
    methods: ['API Key (x-admin-key header)', 'Session Cookie (admin-session)', 'Basic Auth']
  })
}