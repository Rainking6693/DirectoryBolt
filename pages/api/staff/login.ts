import type { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'

interface StaffLoginResponse {
  success: boolean
  sessionToken?: string
  user?: {
    id: string
    username: string
    email: string
    first_name: string
    last_name: string
    role: string
    permissions: Record<string, boolean>
  }
  error?: string
  message?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StaffLoginResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { username, password } = req.body
    
    // Get environment variables
    const validUsername = process.env.STAFF_USERNAME
    const validPassword = process.env.STAFF_PASSWORD
    
    if (!validUsername || !validPassword) {
      console.error('❌ STAFF_USERNAME or STAFF_PASSWORD not configured')
      return res.status(500).json({
        success: false,
        error: 'Staff authentication not properly configured',
        message: 'Contact administrator to set STAFF_USERNAME and STAFF_PASSWORD environment variables'
      })
    }
    
    // Validate credentials
    if (username !== validUsername || password !== validPassword) {
      console.log(`❌ Staff login failed for username: ${username}`)
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      })
    }
    
    // Generate session token (simple JWT-like token)
    const sessionToken = crypto
      .createHash('sha256')
      .update(`${username}:${password}:${Date.now()}:${process.env.STAFF_SESSION_SECRET || 'default-secret'}`)
      .digest('hex')
    
    // Successful authentication
    console.log(`✅ Staff login successful for: ${username}`)
    
    const user = {
      id: 'staff-user',
      username,
      email: 'ben.stone@directorybolt.com',
      first_name: 'Staff',
      last_name: 'User',
      role: 'staff_manager',
      permissions: {
        queue: true,
        processing: true,
        analytics: true,
        support: true,
        customers: true
      }
    }
    
    // Set secure session cookie
    res.setHeader('Set-Cookie', [
      `staff_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`, // 7 days
      `staff_user=${encodeURIComponent(JSON.stringify(user))}; Path=/; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}`
    ])
    
    return res.status(200).json({
      success: true,
      sessionToken,
      user
    })
    
  } catch (error) {
    console.error('❌ Staff login error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication service temporarily unavailable'
    })
  }
}
