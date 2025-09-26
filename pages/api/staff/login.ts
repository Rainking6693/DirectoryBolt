// Staff Dashboard Login API
// Handles secure staff authentication and session management

import { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'
import { withIPWhitelist } from '../../../lib/middleware/ip-whitelist'
import { SessionManager, createSessionCookie } from '../../../lib/middleware/session-management'

// 🔒 SECURITY: Secure CORS configuration for staff endpoints
function getStaffCorsHeaders(req: NextApiRequest) {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://directorybolt.netlify.app', 'https://directorybolt.com']
    : ['http://localhost:3000', 'http://localhost:3001'];
    
  const origin = req.headers.origin;
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
    'Access-Control-Allow-Credentials': 'true', // Important for staff cookies
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  
  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }
  
  return corsHeaders;
}

// 🔒 SECURITY: Apply CORS headers to response
function applyCorsHeaders(res: NextApiResponse, corsHeaders: Record<string, string>) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 🔒 SECURITY FIX: Apply secure CORS headers (CORS-012)
  const corsHeaders = getStaffCorsHeaders(req);
  applyCorsHeaders(res, corsHeaders);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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

    // 🔒 SECURITY: Create secure session with session management (AUTH-002)
    const sessionManager = SessionManager.getInstance();
    const clientIP = req.headers['x-forwarded-for'] as string || 
                     req.headers['x-real-ip'] as string || 
                     req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Create session for staff user
    const sessionData = sessionManager.createSession(
      'staff-user',
      'staff',
      'ben.stone@directorybolt.com',
      clientIP,
      userAgent,
      'manager',
      ['queue', 'processing', 'analytics', 'support']
    );
    
    // Set secure session cookie
    const sessionCookie = createSessionCookie(sessionData);
    res.setHeader('Set-Cookie', sessionCookie);

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

// 🔒 SECURITY: Apply IP whitelist for staff access (INFRA-004)
export default withIPWhitelist('staff')(handler);