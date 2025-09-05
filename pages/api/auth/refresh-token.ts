// 🔒 JORDAN'S TOKEN REFRESH API - Secure JWT token refresh endpoint
// POST /api/auth/refresh-token - Refresh expired access tokens with refresh tokens

import type { NextApiRequest, NextApiResponse } from 'next'
import { jwtManager } from '../../../lib/auth/jwt'
import { sessionManager } from '../../../lib/auth/session-manager'
import { handleApiError, AuthenticationError } from '../../../lib/utils/errors'
import { logger } from '../../../lib/utils/logger'
import { authMiddleware } from '../../../lib/auth/middleware'

interface RefreshTokenRequest {
  refreshToken: string
}

interface RefreshTokenResponse {
  success: true
  data: {
    accessToken: string
    refreshToken?: string
    expiresIn: number
    user: {
      id: string
      email: string
      role: string
    }
  }
  requestId: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RefreshTokenResponse | any>
) {
  const requestId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json(handleApiError(
        new Error('Method not allowed'),
        requestId
      ))
    }

    // Set security headers
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    await handleRefreshToken(req, res, requestId)

  } catch (error) {
    const errorResponse = handleApiError(error as Error, requestId)
    return res.status(errorResponse.error.statusCode).json(errorResponse)
  }
}

async function handleRefreshToken(
  req: NextApiRequest,
  res: NextApiResponse,
  requestId: string
) {
  const clientIp = req.headers['x-forwarded-for'] as string || 
                   req.headers['x-real-ip'] as string || 
                   req.socket.remoteAddress || 'unknown'
  const userAgent = req.headers['user-agent'] || 'unknown'

  // Extract refresh token from request
  let refreshToken: string | undefined

  // Try body first
  if (req.body && req.body.refreshToken) {
    refreshToken = req.body.refreshToken
  }

  // Try cookies as fallback
  if (!refreshToken && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)
    
    refreshToken = cookies.refresh_token
  }

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token is required', 'REFRESH_TOKEN_MISSING')
  }

  // Refresh the access token
  const result = await jwtManager.refreshAccessToken(
    refreshToken,
    clientIp,
    userAgent
  )

  // Update session activity if session exists
  if (result.user.id) {
    try {
      // Find and update any active sessions for this user
      const userSessions = await sessionManager.getUserSessions(result.user.id)
      for (const session of userSessions) {
        await sessionManager.updateActivity(
          session.id,
          clientIp,
          'token_refresh',
          '/api/auth/refresh-token',
          userAgent
        )
      }
    } catch (sessionError) {
      // Log but don't fail the refresh
      logger.warn('Failed to update session activity during token refresh', {
        requestId,
        error: sessionError instanceof Error ? sessionError.message : 'Unknown error'
      })
    }
  }

  const response: RefreshTokenResponse = {
    success: true,
    data: {
      accessToken: result.accessToken,
      refreshToken: result.newRefreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.subscription_tier
      }
    },
    requestId
  }

  // Set secure cookies for tokens
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/'
  }

  const accessCookie = `access_token=${result.accessToken}; ${Object.entries({
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 minutes
  }).map(([k, v]) => `${k}=${v}`).join('; ')}`

  const cookies = [accessCookie]

  if (result.newRefreshToken) {
    const refreshCookie = `refresh_token=${result.newRefreshToken}; ${Object.entries({
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }).map(([k, v]) => `${k}=${v}`).join('; ')}`
    
    cookies.push(refreshCookie)
  }

  res.setHeader('Set-Cookie', cookies)

  logger.info('Token refreshed successfully', {
    requestId,
    metadata: {
      userId: result.user.id,
      email: result.user.email,
      clientIp,
      newRefreshToken: !!result.newRefreshToken
    }
  })

  res.status(200).json(response)
}