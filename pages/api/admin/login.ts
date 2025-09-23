// Admin Dashboard Login API
// Handles secure admin authentication and session management

import { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔐 Admin login attempt')

    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required'
      })
    }

    // Validate against admin credentials
    const validUsername = process.env.ADMIN_USERNAME || 'admin'
    const validPassword = process.env.ADMIN_PASSWORD || 'DirectoryBolt2025!'

    if (username !== validUsername || password !== validPassword) {
      console.log('❌ Invalid admin credentials provided')
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password'
      })
    }

    console.log('✅ Admin login successful')

    // Set secure session cookie
    const sessionToken = process.env.ADMIN_SESSION_TOKEN || 'DirectoryBolt-Session-2025'
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    }

    const cookie = serialize('admin-session', sessionToken, cookieOptions)
    res.setHeader('Set-Cookie', cookie)

    // Return success response with user data
    return res.status(200).json({
      success: true,
      message: 'Login successful',
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
        }
      },
      redirectTo: '/admin-dashboard'
    })

  } catch (error) {
    console.error('❌ Admin login error:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    })
  }
}