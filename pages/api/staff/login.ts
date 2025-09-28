// Staff Dashboard Login API
// Handles secure staff authentication and session management

import type { NextApiRequest, NextApiResponse } from 'next'
import { withIPWhitelist } from '../../../lib/middleware/ip-whitelist'
import { SessionManager, createSessionCookie } from '../../../lib/middleware/session-management'

interface StaffLoginSuccess {
  success: true
  message: string
  user: {
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
  }
  redirectTo: string
}

interface StaffLoginError {
  success?: false
  error: string
  message: string
}

function getStaffCorsHeaders(req: NextApiRequest): Record<string, string> {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://directorybolt.netlify.app', 'https://directorybolt.com']
    : ['http://localhost:3000', 'http://localhost:3001']

  const origin = req.headers.origin
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  }

  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin
  }

  return corsHeaders
}

function applyCorsHeaders(res: NextApiResponse, corsHeaders: Record<string, string>): void {
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value)
  }
}

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StaffLoginSuccess | StaffLoginError>
): Promise<void> {
  const corsHeaders = getStaffCorsHeaders(req)
  applyCorsHeaders(res, corsHeaders)

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed', message: 'Only POST is supported' })
    return
  }

  try {
    console.log('?? Staff login attempt')

    const { username, password } = (req.body ?? {}) as { username?: string; password?: string }

    if (!username || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required'
      })
      return
    }

    const validUsername = process.env.STAFF_USERNAME
    const validPassword = process.env.STAFF_PASSWORD

    if (!validUsername || !validPassword) {
      console.error('? Staff credentials not configured in environment')
      res.status(500).json({
        error: 'Server Configuration Error',
        message: 'Authentication system not properly configured'
      })
      return
    }

    if (username !== validUsername || password !== validPassword) {
      console.log('? Invalid staff credentials provided')
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid username or password'
      })
      return
    }

    console.log('? Staff login successful')

    const sessionManager = SessionManager.getInstance()
    const clientIP = (req.headers['x-forwarded-for'] as string)
      || (req.headers['x-real-ip'] as string)
      || req.socket.remoteAddress
      || 'unknown'
    const userAgent = req.headers['user-agent'] ?? 'unknown'

    const sessionData = sessionManager.createSession(
      'staff-user',
      'staff',
      'ben.stone@directorybolt.com',
      clientIP,
      userAgent,
      'manager',
      ['queue', 'processing', 'analytics', 'support']
    )

    const sessionCookie = createSessionCookie(sessionData)
    res.setHeader('Set-Cookie', sessionCookie)

    res.status(200).json({
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
    console.error('? Staff login error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Login failed'
    })
  }
}

export default withIPWhitelist('staff')(handler)
