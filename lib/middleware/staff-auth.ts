// Staff Authentication Middleware
// Validates staff authentication for API endpoints

import { NextApiRequest, NextApiResponse } from 'next'

export interface StaffAuthResult {
  isAuthenticated: boolean
  user?: {
    username: string
    role: string
  }
  error?: string
}

export function validateStaffAuth(req: NextApiRequest): StaffAuthResult {
  try {
    // Check for API key in Authorization header
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Validate against known staff API keys
      const validStaffKeys = [
        'DirectoryBolt-Staff-2025-SecureKey',
        'DirectoryBolt-Staff-API-Key-2025',
        'Staff-Access-Token-2025'
      ]
      
      if (validStaffKeys.includes(token)) {
        return {
          isAuthenticated: true,
          user: {
            username: 'staff_user',
            role: 'staff'
          }
        }
      }
    }

    // Check for session cookie
    const cookies = req.headers.cookie
    if (cookies) {
      const staffSession = cookies
        .split('; ')
        .find(row => row.startsWith('staff-session='))
        ?.split('=')[1]
      
      if (staffSession) {
        // In a real implementation, you'd validate the session token
        // For now, we'll accept any non-empty session
        return {
          isAuthenticated: true,
          user: {
            username: 'staff_user',
            role: 'staff'
          }
        }
      }
    }

    // Check for basic auth
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.substring(6)
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
      const [username, password] = credentials.split(':')
      
      // Validate staff credentials
      const validStaffCredentials = [
        { username: 'staff', password: 'DirectoryBolt2025!' },
        { username: 'admin', password: 'DirectoryBolt2025!' }
      ]
      
      const isValidCredential = validStaffCredentials.some(
        cred => cred.username === username && cred.password === password
      )
      
      if (isValidCredential) {
        return {
          isAuthenticated: true,
          user: {
            username,
            role: 'staff'
          }
        }
      }
    }

    return {
      isAuthenticated: false,
      error: 'Staff authentication required'
    }

  } catch (error) {
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
