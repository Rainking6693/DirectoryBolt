// Staff Dashboard Login API
// Handles secure staff authentication and session management

import { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔐 Staff login attempt')

    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required'
      })
    }

    // Validate against environment credentials
    const validUsername = process.env.STAFF_USERNAME
    const validPassword = process.env.STAFF_PASSWORD

    if (!validUsername || !validPassword) {
      console.error('❌ Staff credentials not configured in environment')
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Authentication system not properly configured'
      })
    }

    if (username !== validUsername || password !== validPassword) {
      console.log('❌ Invalid staff credentials provided')
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password'
      })
    }

    console.log('✅ Staff login successful')

    // Set secure session cookie
    const sessionToken = process.env.STAFF_SESSION_TOKEN
    
    if (!sessionToken) {
      console.error('❌ STAFF_SESSION_TOKEN not configured')
      return res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Session system not properly configured'
      })
    }
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    }

    const cookie = serialize('staff-session', sessionToken, cookieOptions)
    res.setHeader('Set-Cookie', cookie)

    // Return success response with user data
    return res.status(200).json({
      success: true,
      message: 'Login successful',
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
        }
      },
      redirectTo: '/staff-dashboard'
    })

  } catch (error) {
    console.error('❌ Staff login error:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    })
  }
}