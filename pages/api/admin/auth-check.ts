import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔐 Admin auth check requested from IP:', req.headers['x-forwarded-for'] || req.socket.remoteAddress)
    
    // Check for admin API key in headers (highest priority)
    const adminKey = req.headers['x-admin-key'] || req.headers['authorization']
    const validAdminKey = process.env.ADMIN_API_KEY
    
    if (!validAdminKey) {
      console.error('❌ ADMIN_API_KEY environment variable not configured')
      return res.status(500).json({
        authenticated: false,
        error: 'Admin authentication system not properly configured'
      })
    }
    
    if (adminKey === validAdminKey || adminKey === `Bearer ${validAdminKey}`) {
      console.log('✅ Admin authenticated via API key')
      return res.status(200).json({ 
        authenticated: true, 
        user: { 
          id: 'admin-user',
          username: 'admin',
          email: 'ben.stone@directorybolt.com',
          first_name: 'BEN',
          last_name: 'STONE',
          role: 'super_admin',
          permissions: {
            system: true,
            users: true,
            analytics: true,
            billing: true,
            support: true
          },
          method: 'api_key' 
        }
      })
    }

    // Check for admin session/cookie
    const adminSession = req.cookies['admin-session']
    const validAdminSession = process.env.ADMIN_SESSION_TOKEN
    
    if (!validAdminSession) {
      console.error('❌ ADMIN_SESSION_TOKEN environment variable not configured')
      return res.status(500).json({
        authenticated: false,
        error: 'Admin session system not properly configured'
      })
    }
    
    if (adminSession === validAdminSession) {
      console.log('✅ Admin authenticated via session')
      return res.status(200).json({ 
        authenticated: true, 
        user: { 
          id: 'admin-user',
          username: 'admin',
          email: 'ben.stone@directorybolt.com',
          first_name: 'BEN',
          last_name: 'STONE',
          role: 'super_admin',
          permissions: {
            system: true,
            users: true,
            analytics: true,
            billing: true,
            support: true
          },
          method: 'session' 
        }
      })
    }

    // Check for basic auth credentials
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
      const [username, password] = credentials.split(':')
      
      // SECURITY: Both environment variables MUST be set - no fallbacks
      const validUsername = process.env.ADMIN_USERNAME
      const validPassword = process.env.ADMIN_PASSWORD
      
      if (!validUsername || !validPassword) {
        console.error('❌ Admin basic auth credentials not configured in environment')
        return res.status(500).json({
          authenticated: false,
          error: 'Admin basic authentication system not properly configured'
        })
      }
      
      if (username === validUsername && password === validPassword) {
        console.log('✅ Admin authenticated via basic auth')
        return res.status(200).json({ 
          authenticated: true, 
          user: { 
            id: 'admin-user',
            username: 'admin',
            email: 'ben.stone@directorybolt.com',
            first_name: 'BEN',
            last_name: 'STONE',
            role: 'super_admin',
            permissions: {
              system: true,
              users: true,
              analytics: true,
              billing: true,
              support: true
            },
            method: 'basic_auth' 
          }
        })
      }
    }

    // No valid admin authentication found
    console.log('❌ Admin authentication failed - no valid credentials')
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Admin authentication required',
      methods: ['API Key (x-admin-key header)', 'Session Cookie (admin-session)', 'Basic Auth']
    })

  } catch (error) {
    console.error('❌ Admin auth check error:', error)
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Authentication service temporarily unavailable'
    })
  }
}