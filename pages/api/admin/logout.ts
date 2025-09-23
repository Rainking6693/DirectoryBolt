// Admin Dashboard Logout API
// Handles secure admin session termination

import { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('🔓 Admin logout requested')

    // Clear the admin session cookie
    const cookie = serialize('admin-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      maxAge: 0, // Expire immediately
      path: '/'
    })

    res.setHeader('Set-Cookie', cookie)

    console.log('✅ Admin logout successful')

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
      redirectTo: '/admin-login'
    })

  } catch (error) {
    console.error('❌ Admin logout error:', error)
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed'
    })
  }
}