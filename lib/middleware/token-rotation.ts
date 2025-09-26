// 🔄 TOKEN ROTATION MIDDLEWARE - AUTH-005
// Automatic JWT token refresh and rotation system
// Implements secure token lifecycle management with automatic renewal

import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Token configuration
const TOKEN_CONFIG = {
  // Token lifespans
  accessTokenExpiry: '15m',      // 15 minutes
  refreshTokenExpiry: '7d',      // 7 days
  rotationThreshold: 5 * 60 * 1000, // Rotate if less than 5 minutes remaining
  
  // Security settings
  issuer: 'directorybolt.com',
  audience: 'directorybolt-users',
  algorithm: 'HS256' as const,
  
  // Secrets (from environment)
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  
  // Token storage (use Redis in production)
  refreshTokenStore: new Map<string, RefreshTokenData>(),
  
  // Cleanup interval
  cleanupInterval: 60 * 60 * 1000, // 1 hour
};

// Token interfaces
interface TokenPayload {
  sub: string;           // User ID
  email: string;
  role: string;
  userType: 'customer' | 'staff';
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti: string;           // JWT ID for tracking
}

interface RefreshTokenData {
  userId: string;
  tokenId: string;
  issuedAt: number;
  expiresAt: number;
  lastUsed: number;
  ipAddress: string;
  userAgent: string;
  isActive: boolean;
  rotationCount: number;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

// Token manager class
class TokenManager {
  private static instance: TokenManager;
  private cleanupTimer: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startCleanupTimer();
  }
  
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }
  
  // Generate new token pair
  generateTokenPair(
    userId: string,
    email: string,
    role: string,
    userType: 'customer' | 'staff',
    permissions: string[],
    ipAddress: string,
    userAgent: string
  ): TokenPair {
    const tokenId = this.generateTokenId();
    const now = Math.floor(Date.now() / 1000);
    
    // Create access token payload
    const accessPayload: TokenPayload = {
      sub: userId,
      email,
      role,
      userType,
      permissions,
      iat: now,
      exp: now + this.parseExpiry(TOKEN_CONFIG.accessTokenExpiry),
      iss: TOKEN_CONFIG.issuer,
      aud: TOKEN_CONFIG.audience,
      jti: tokenId
    };
    
    // Generate tokens
    const accessToken = jwt.sign(accessPayload, TOKEN_CONFIG.accessTokenSecret, {
      algorithm: TOKEN_CONFIG.algorithm
    });
    
    const refreshToken = this.generateRefreshToken(tokenId, userId);
    
    // Store refresh token data
    const refreshTokenData: RefreshTokenData = {
      userId,
      tokenId,
      issuedAt: Date.now(),
      expiresAt: Date.now() + this.parseExpiry(TOKEN_CONFIG.refreshTokenExpiry) * 1000,
      lastUsed: Date.now(),
      ipAddress,
      userAgent,
      isActive: true,
      rotationCount: 0
    };
    
    TOKEN_CONFIG.refreshTokenStore.set(tokenId, refreshTokenData);
    
    console.log('✅ Token pair generated', {
      userId,
      tokenId,
      userType,
      expiresAt: new Date(refreshTokenData.expiresAt).toISOString()
    });
    
    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(TOKEN_CONFIG.accessTokenExpiry),
      tokenType: 'Bearer'
    };
  }
  
  // Validate and decode access token
  validateAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, TOKEN_CONFIG.accessTokenSecret, {
        algorithms: [TOKEN_CONFIG.algorithm],
        issuer: TOKEN_CONFIG.issuer,
        audience: TOKEN_CONFIG.audience
      }) as TokenPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log('🔄 Access token expired, rotation needed');
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.warn('⚠️ Invalid access token', { error: error.message });
      }
      return null;
    }
  }
  
  // Check if token needs rotation
  shouldRotateToken(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      if (!decoded || !decoded.exp) return true;
      
      const expiresAt = decoded.exp * 1000;
      const timeUntilExpiry = expiresAt - Date.now();
      
      return timeUntilExpiry < TOKEN_CONFIG.rotationThreshold;
    } catch (error) {
      return true; // Rotate if we can't decode
    }
  }
  
  // Rotate tokens using refresh token
  async rotateTokens(refreshToken: string, ipAddress: string, userAgent: string): Promise<TokenPair | null> {
    try {
      // Decode refresh token to get token ID
      const decoded = jwt.verify(refreshToken, TOKEN_CONFIG.refreshTokenSecret) as { jti: string };
      const tokenId = decoded.jti;
      
      // Get refresh token data
      const refreshData = TOKEN_CONFIG.refreshTokenStore.get(tokenId);
      if (!refreshData || !refreshData.isActive) {
        console.warn('⚠️ Invalid or inactive refresh token', { tokenId });
        return null;
      }
      
      // Check if refresh token is expired
      if (Date.now() > refreshData.expiresAt) {
        console.warn('⚠️ Refresh token expired', { tokenId });
        this.revokeRefreshToken(tokenId);
        return null;
      }
      
      // Security check: IP and user agent validation (optional)
      if (process.env.STRICT_TOKEN_VALIDATION === 'true') {\n        if (refreshData.ipAddress !== ipAddress) {\n          console.warn('⚠️ IP address mismatch during token rotation', {\n            tokenId,\n            originalIP: refreshData.ipAddress,\n            currentIP: ipAddress\n          });\n          // Optionally revoke token for security\n          // this.revokeRefreshToken(tokenId);\n          // return null;\n        }\n      }\n      \n      // Get user data for new tokens\n      const userData = await this.getUserData(refreshData.userId);\n      if (!userData) {\n        console.warn('⚠️ User not found during token rotation', { userId: refreshData.userId });\n        return null;\n      }\n      \n      // Update refresh token usage\n      refreshData.lastUsed = Date.now();\n      refreshData.rotationCount++;\n      TOKEN_CONFIG.refreshTokenStore.set(tokenId, refreshData);\n      \n      // Generate new token pair\n      const newTokenPair = this.generateTokenPair(\n        userData.id,\n        userData.email,\n        userData.role,\n        userData.userType,\n        userData.permissions,\n        ipAddress,\n        userAgent\n      );\n      \n      // Revoke old refresh token\n      this.revokeRefreshToken(tokenId);\n      \n      console.log('🔄 Tokens rotated successfully', {\n        userId: userData.id,\n        oldTokenId: tokenId,\n        rotationCount: refreshData.rotationCount\n      });\n      \n      return newTokenPair;\n      \n    } catch (error) {\n      console.error('❌ Token rotation failed', { error: error instanceof Error ? error.message : 'Unknown error' });\n      return null;\n    }\n  }\n  \n  // Revoke refresh token\n  revokeRefreshToken(tokenId: string): boolean {\n    const refreshData = TOKEN_CONFIG.refreshTokenStore.get(tokenId);\n    if (refreshData) {\n      refreshData.isActive = false;\n      TOKEN_CONFIG.refreshTokenStore.set(tokenId, refreshData);\n      \n      console.log('🗑️ Refresh token revoked', { tokenId });\n      return true;\n    }\n    return false;\n  }\n  \n  // Revoke all user tokens\n  revokeAllUserTokens(userId: string): number {\n    let revokedCount = 0;\n    \n    for (const [tokenId, refreshData] of TOKEN_CONFIG.refreshTokenStore.entries()) {\n      if (refreshData.userId === userId && refreshData.isActive) {\n        refreshData.isActive = false;\n        TOKEN_CONFIG.refreshTokenStore.set(tokenId, refreshData);\n        revokedCount++;\n      }\n    }\n    \n    console.log('🗑️ All user tokens revoked', { userId, revokedCount });\n    return revokedCount;\n  }\n  \n  // Get active tokens for user\n  getUserActiveTokens(userId: string): RefreshTokenData[] {\n    const userTokens: RefreshTokenData[] = [];\n    const now = Date.now();\n    \n    for (const refreshData of TOKEN_CONFIG.refreshTokenStore.values()) {\n      if (refreshData.userId === userId && refreshData.isActive && now < refreshData.expiresAt) {\n        userTokens.push(refreshData);\n      }\n    }\n    \n    return userTokens;\n  }\n  \n  // Generate secure token ID\n  private generateTokenId(): string {\n    return crypto.randomBytes(32).toString('hex');\n  }\n  \n  // Generate refresh token\n  private generateRefreshToken(tokenId: string, userId: string): string {\n    const payload = {\n      jti: tokenId,\n      sub: userId,\n      type: 'refresh',\n      iat: Math.floor(Date.now() / 1000)\n    };\n    \n    return jwt.sign(payload, TOKEN_CONFIG.refreshTokenSecret, {\n      algorithm: TOKEN_CONFIG.algorithm,\n      expiresIn: TOKEN_CONFIG.refreshTokenExpiry\n    });\n  }\n  \n  // Parse expiry string to seconds\n  private parseExpiry(expiry: string): number {\n    const unit = expiry.slice(-1);\n    const value = parseInt(expiry.slice(0, -1), 10);\n    \n    switch (unit) {\n      case 's': return value;\n      case 'm': return value * 60;\n      case 'h': return value * 60 * 60;\n      case 'd': return value * 24 * 60 * 60;\n      default: return 900; // 15 minutes default\n    }\n  }\n  \n  // Get user data (mock implementation)\n  private async getUserData(userId: string): Promise<{\n    id: string;\n    email: string;\n    role: string;\n    userType: 'customer' | 'staff';\n    permissions: string[];\n  } | null> {\n    // TODO: Implement actual user data retrieval\n    // This would typically query the database\n    \n    // Mock user data for development\n    if (userId === 'staff-user') {\n      return {\n        id: userId,\n        email: 'ben.stone@directorybolt.com',\n        role: 'manager',\n        userType: 'staff',\n        permissions: ['queue', 'processing', 'analytics', 'support']\n      };\n    }\n    \n    // Mock customer user\n    return {\n      id: userId,\n      email: 'customer@example.com',\n      role: 'professional',\n      userType: 'customer',\n      permissions: ['premium_features', 'priority_support']\n    };\n  }\n  \n  // Cleanup expired tokens\n  private cleanupExpiredTokens(): void {\n    const now = Date.now();\n    let cleanedCount = 0;\n    \n    for (const [tokenId, refreshData] of TOKEN_CONFIG.refreshTokenStore.entries()) {\n      if (now > refreshData.expiresAt) {\n        TOKEN_CONFIG.refreshTokenStore.delete(tokenId);\n        cleanedCount++;\n      }\n    }\n    \n    if (cleanedCount > 0) {\n      console.log('🧹 Cleaned up expired tokens', {\n        cleanedCount,\n        remainingTokens: TOKEN_CONFIG.refreshTokenStore.size\n      });\n    }\n  }\n  \n  // Start automatic cleanup timer\n  private startCleanupTimer(): void {\n    this.cleanupTimer = setInterval(() => {\n      this.cleanupExpiredTokens();\n    }, TOKEN_CONFIG.cleanupInterval);\n  }\n  \n  // Stop cleanup timer\n  stopCleanupTimer(): void {\n    if (this.cleanupTimer) {\n      clearInterval(this.cleanupTimer);\n      this.cleanupTimer = null;\n    }\n  }\n}\n\n// Middleware for automatic token rotation\nexport function withTokenRotation() {\n  return function middleware(\n    handler: (req: NextApiRequest & { user?: TokenPayload; newTokens?: TokenPair }, res: NextApiResponse) => Promise<void> | void\n  ) {\n    return async function wrappedHandler(\n      req: NextApiRequest & { user?: TokenPayload; newTokens?: TokenPair },\n      res: NextApiResponse\n    ) {\n      const tokenManager = TokenManager.getInstance();\n      const authHeader = req.headers.authorization;\n      \n      if (authHeader && authHeader.startsWith('Bearer ')) {\n        const accessToken = authHeader.substring(7);\n        \n        // Validate current token\n        const tokenPayload = tokenManager.validateAccessToken(accessToken);\n        \n        if (tokenPayload) {\n          // Token is valid, attach user data\n          req.user = tokenPayload;\n          \n          // Check if token needs rotation\n          if (tokenManager.shouldRotateToken(accessToken)) {\n            const refreshToken = req.headers['x-refresh-token'] as string;\n            \n            if (refreshToken) {\n              const clientIP = getClientIP(req);\n              const userAgent = req.headers['user-agent'] || '';\n              \n              const newTokens = await tokenManager.rotateTokens(refreshToken, clientIP, userAgent);\n              \n              if (newTokens) {\n                req.newTokens = newTokens;\n                \n                // Set new tokens in response headers\n                res.setHeader('X-New-Access-Token', newTokens.accessToken);\n                res.setHeader('X-New-Refresh-Token', newTokens.refreshToken);\n                res.setHeader('X-Token-Rotated', 'true');\n                \n                console.log('🔄 Token rotation completed', {\n                  userId: tokenPayload.sub,\n                  newExpiresIn: newTokens.expiresIn\n                });\n              }\n            }\n          }\n        } else {\n          // Token is invalid or expired\n          return res.status(401).json({\n            error: 'Authentication Required',\n            message: 'Access token is invalid or expired. Please refresh your token.',\n            code: 'TOKEN_INVALID'\n          });\n        }\n      }\n      \n      // Continue to the actual handler\n      return handler(req, res);\n    };\n  };\n}\n\n// Token refresh endpoint helper\nexport async function handleTokenRefresh(\n  req: NextApiRequest,\n  res: NextApiResponse\n): Promise<void> {\n  if (req.method !== 'POST') {\n    return res.status(405).json({ error: 'Method not allowed' });\n  }\n  \n  const { refreshToken } = req.body;\n  \n  if (!refreshToken) {\n    return res.status(400).json({\n      error: 'Bad Request',\n      message: 'Refresh token is required'\n    });\n  }\n  \n  const tokenManager = TokenManager.getInstance();\n  const clientIP = getClientIP(req);\n  const userAgent = req.headers['user-agent'] || '';\n  \n  const newTokens = await tokenManager.rotateTokens(refreshToken, clientIP, userAgent);\n  \n  if (newTokens) {\n    res.status(200).json({\n      success: true,\n      data: newTokens\n    });\n  } else {\n    res.status(401).json({\n      error: 'Unauthorized',\n      message: 'Invalid or expired refresh token'\n    });\n  }\n}\n\n// Get client IP address\nfunction getClientIP(req: NextApiRequest): string {\n  const forwarded = req.headers['x-forwarded-for'];\n  const realIP = req.headers['x-real-ip'];\n  const cfConnectingIP = req.headers['cf-connecting-ip'];\n  \n  if (typeof forwarded === 'string') {\n    return forwarded.split(',')[0].trim();\n  }\n  \n  if (typeof realIP === 'string') {\n    return realIP;\n  }\n  \n  if (typeof cfConnectingIP === 'string') {\n    return cfConnectingIP;\n  }\n  \n  return req.socket.remoteAddress || 'unknown';\n}\n\n// Export token manager for direct use\nexport { TokenManager, TOKEN_CONFIG };\nexport type { TokenPayload, RefreshTokenData, TokenPair };"