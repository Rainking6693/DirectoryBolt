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
    
    // BYPASS MODE: Use env vars if present, otherwise fallback to test credentials
    const validUsername = process.env.STAFF_USERNAME || 'staffuser'
    const validPassword = process.env.STAFF_PASSWORD || 'DirectoryBoltStaff2025!'
    
    console.log('🔐 Staff login attempt:', {
      username,
      usingEnvVars: !!process.env.STAFF_USERNAME,
      usingFallback: !process.env.STAFF_USERNAME
    })
    
    // Validate credentials
    if (username !== validUsername || password !== validPassword) {
      console.log(`❌ Staff login failed for username: ${username}`)
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect'
      })
    }
    
    // Generate session token
    // BYPASS MODE: Use simple test token if no secret configured
    const sessionToken = process.env.STAFF_SESSION_SECRET
      ? crypto
          .createHash('sha256')
          .update(`${username}:${password}:${Date.now()}:${process.env.STAFF_SESSION_SECRET}`)
          .digest('hex')
      : 'TESTTOKEN'
    
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
    
    // Set session cookie
    // BYPASS MODE: HttpOnly=false for testing, Secure=false for local dev
    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = isProduction
      ? 'Path=/; HttpOnly; Secure; SameSite=Strict'
      : 'Path=/; SameSite=Lax' // Allow client-side access in dev/test
    
    res.setHeader('Set-Cookie', [
      `staff-session=${sessionToken}; ${cookieOptions}; Max-Age=${7 * 24 * 60 * 60}`,
      `staff_user=${encodeURIComponent(JSON.stringify(user))}; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
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
