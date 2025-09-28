// Staff Dashboard Logout API
// Handles secure staff session termination

import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

interface StaffLogoutResponse {
  success: boolean
  message: string
  redirectTo: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StaffLogoutResponse | { error: string; message: string }>
): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed', message: 'Only POST is supported' })
    return
  }

  try {
    console.log('?? Staff logout requested')

    const cookie = serialize('staff-session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    })

    res.setHeader('Set-Cookie', cookie)

    console.log('? Staff logout successful')

    res.status(200).json({
      success: true,
      message: 'Logout successful',
      redirectTo: '/staff-login'
    })
  } catch (error) {
    console.error('? Staff logout error:', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Logout failed'
    })
  }
}
