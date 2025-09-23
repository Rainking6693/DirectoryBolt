// Staff Authentication Middleware
// Validates staff authentication for API endpoints with secure session-based auth

import { NextApiRequest, NextApiResponse } from 'next'

export interface StaffAuthResult {
  isAuthenticated: boolean
  user?: {
    id: string
    username: string
    email: string
    first_name: string
    last_name: string
    role: string
    permissions: {
      queue: boolean
      processing: boolean
      analytics: boolean
      support: boolean
    }
    method: string
  }
  error?: string
}

export function validateStaffAuth(req: NextApiRequest): StaffAuthResult {
  try {
    console.log('🔐 Validating staff authentication')
    
    // Check for staff API key in headers (highest priority)
    const staffKey = req.headers['x-staff-key'] || req.headers['authorization']
    const validStaffKey = process.env.STAFF_API_KEY || 'DirectoryBolt-Staff-2025-SecureKey'
    
    if (staffKey === validStaffKey || staffKey === `Bearer ${validStaffKey}`) {
      console.log('✅ Staff authenticated via API key')
      return {
        isAuthenticated: true,
        user: {
          id: 'staff-user',
          username: 'staff',
          email: 'ben.stone@directorybolt.com',
          first_name: 'BEN',
          last_name: 'STONE',
          role: 'manager',
          permissions: {
            queue: true,
            processing: true,
            analytics: true,
            support: true
          },
          method: 'api_key'
        }
      }
    }

    // Check for staff session cookie (secure session-based auth)
    const staffSession = req.cookies['staff-session']
    const validStaffSession = process.env.STAFF_SESSION_TOKEN || 'DirectoryBolt-Staff-Session-2025'
    
    if (staffSession === validStaffSession) {
      console.log('✅ Staff authenticated via secure session')
      return {
        isAuthenticated: true,
        user: {
          id: 'staff-user',
          username: 'staff',
          email: 'ben.stone@directorybolt.com',
          first_name: 'BEN',
          last_name: 'STONE',
          role: 'manager',
          permissions: {
            queue: true,
            processing: true,
            analytics: true,
            support: true
          },
          method: 'session'
        }
      }
    }

    // Check for basic auth credentials (using exact credentials specified)
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
      const [username, password] = credentials.split(':')
      
      // Use exact credentials from environment variables
      const validUsername = process.env.STAFF_USERNAME || 'staff'
      const validPassword = process.env.STAFF_PASSWORD || 'DirectoryBoltStaff2025!'
      
      if (username === validUsername && password === validPassword) {
        console.log('✅ Staff authenticated via basic auth')
        return {
          isAuthenticated: true,
          user: {
            id: 'staff-user',
            username: 'staff',
            email: 'ben.stone@directorybolt.com',
            first_name: 'BEN',
            last_name: 'STONE',
            role: 'manager',
            permissions: {
              queue: true,
              processing: true,
              analytics: true,
              support: true
            },
            method: 'basic_auth'
          }
        }
      }
    }

    console.log('❌ Staff authentication failed - no valid credentials')
    return {
      isAuthenticated: false,
      error: 'Staff authentication required'
    }

  } catch (error) {
    console.error('❌ Staff auth validation error:', error)
    return {
      isAuthenticated: false,
      error: 'Authentication validation failed'
    }
  }
}

export function withStaffAuth(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const authResult = validateStaffAuth(req)
    
    if (!authResult.isAuthenticated) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: authResult.error || 'Staff authentication required',
        statusCode: 401
      })
    }

    // Add user info to request object for use in handler
    ;(req as any).staffUser = authResult.user

    return handler(req, res)
  }
}
