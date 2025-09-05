# 🔒 DirectoryBolt Authentication System Documentation

## Overview

This document describes the comprehensive authentication system implemented for DirectoryBolt Phase 1.3. The system provides enterprise-grade security with JWT tokens, role-based access control, session management, and API key generation for the AutoBolt extension.

## Architecture

The authentication system consists of several interconnected components:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   JWT Manager   │    │  RBAC Manager   │    │ Session Manager │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Auth Middleware │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │  API Endpoints  │    │ Password Reset  │
                    └─────────────────┘    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │ API Key Manager │
                    └─────────────────┘
```

## Core Components

### 1. JWT Token Management (`lib/auth/jwt.ts`)

**Features:**
- Secure JWT generation and validation
- Token refresh mechanism with rotation
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Multiple token types (access, refresh, password reset, email verification)

**Security Features:**
- Cryptographically secure token generation
- Token expiration handling
- Automatic token rotation on refresh
- User validation on each token use

**Usage:**
```typescript
import { jwtManager } from '../lib/auth/jwt'

// Generate access token
const accessToken = jwtManager.generateAccessToken(user, sessionId)

// Validate token
const payload = await jwtManager.validateAccessToken(token)

// Refresh expired token
const result = await jwtManager.refreshAccessToken(refreshToken, ip, userAgent)
```

### 2. Role-Based Access Control (`lib/auth/rbac.ts`)

**Roles:**
- **Customer**: Basic directory submission and profile management
- **VA (Virtual Assistant)**: Enhanced access for managing multiple clients
- **Admin**: Full system access and management

**Permissions:**
- Directory management (read, write, admin)
- Submission management (create, read, update, delete, admin)
- User management (read, write, admin)
- Billing access (read, write, admin)
- Analytics access (read, admin)
- API key management (create, read, delete, admin)
- System administration (admin, monitor, configure)

**Subscription Tier Limits:**
```typescript
const tierLimits = {
  free: { maxApiKeys: 1, maxSubmissionsPerDay: 10 },
  starter: { maxApiKeys: 2, maxSubmissionsPerDay: 50 },
  growth: { maxApiKeys: 5, maxSubmissionsPerDay: 200 },
  professional: { maxApiKeys: 10, maxSubmissionsPerDay: 500 },
  enterprise: { maxApiKeys: 50, maxSubmissionsPerDay: 2000 }
}
```

**Usage:**
```typescript
import { rbacManager, enforcePermission } from '../lib/auth/rbac'

// Check permission
const hasAccess = rbacManager.hasPermission(context, 'submissions:create')

// Enforce permission (throws on failure)
enforcePermission(user, 'directories:write', ipAddress)

// Check resource access
const canAccess = rbacManager.canAccessResource(context, 'submission', 'update', ownerId)
```

### 3. Session Management (`lib/auth/session-manager.ts`)

**Features:**
- Multi-device session tracking
- Session timeout handling (30 minutes default, 8 hours with "remember me")
- Device fingerprinting and security monitoring
- IP address change detection
- Session activity logging

**Session Data:**
- Device information (browser, OS, mobile detection)
- Security metadata (IP, user agent, login method)
- Activity timestamps and timeout management
- 2FA verification status

**Usage:**
```typescript
import { sessionManager } from '../lib/auth/session-manager'

// Create session
const session = await sessionManager.createSession(user, deviceInfo, options)

// Validate session
const { isValid, session } = await sessionManager.validateSession(sessionId, ip, userAgent)

// Update activity
await sessionManager.updateActivity(sessionId, ip, 'api_call', endpoint, userAgent)

// Get user sessions
const sessions = await sessionManager.getUserSessions(userId)
```

### 4. Authentication Middleware (`lib/auth/middleware.ts`)

**Features:**
- JWT token validation
- Session management
- Rate limiting by IP and user tier
- CSRF protection
- Security headers
- Role and permission enforcement

**Middleware Options:**
```typescript
interface AuthMiddlewareConfig {
  requireAuth?: boolean
  requiredPermission?: Permission
  allowRefresh?: boolean
  rateLimitTier?: 'strict' | 'normal' | 'lenient'
  requireVerified?: boolean
  allowedRoles?: UserRole[]
}
```

**Usage:**
```typescript
import { authMiddleware, requireAuth, requireAdmin } from '../lib/auth/middleware'

// Basic authentication
export default authMiddleware({ requireAuth: true })

// Admin-only endpoint
export default requireAdmin

// Custom configuration
export default authMiddleware({
  requireAuth: true,
  requiredPermission: 'submissions:create',
  rateLimitTier: 'strict'
})
```

### 5. Password Reset System (`lib/auth/password-reset.ts`)

**Features:**
- Secure password reset token generation
- Rate limiting (5 attempts per 24 hours per email/IP)
- Token expiration (1 hour)
- Email verification requirement
- Security logging and monitoring

**Flow:**
1. User requests password reset via email
2. System generates secure token and sends email
3. User clicks link with token
4. System validates token and allows password change
5. All user sessions are invalidated for security

**Usage:**
```typescript
import { passwordResetManager } from '../lib/auth/password-reset'

// Initiate reset
const result = await passwordResetManager.requestPasswordReset(email, ip, userAgent)

// Validate token
const isValid = await passwordResetManager.validateResetToken(token)

// Complete reset
const result = await passwordResetManager.resetPassword(token, newPassword, ip, userAgent)
```

### 6. API Key Management (`lib/auth/api-keys.ts`)

**Features:**
- Secure API key generation for AutoBolt extension
- Permission-based access control
- Rate limiting per API key
- Usage tracking and analytics
- IP and referrer whitelisting
- Key rotation and expiration

**API Key Format:**
```
db_[64 character hex string]
```

**Usage:**
```typescript
import { apiKeyManager } from '../lib/auth/api-keys'

// Create API key
const result = await apiKeyManager.createApiKey(user, {
  name: 'AutoBolt Key',
  permissions: ['read_directories', 'create_submissions'],
  rateLimit: 100,
  expiresInDays: 365
}, createdFromIp)

// Validate API key
const validation = await apiKeyManager.validateApiKey(key, ip, referrer)

// Track usage
await apiKeyManager.trackUsage(keyId, endpoint, method, ip, status, processingTime, userAgent)
```

## API Endpoints

### Authentication Endpoints

#### `POST /api/auth/login`
Enhanced login with session creation and JWT generation.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "remember_me": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "..." },
    "tokens": {
      "access_token": "...",
      "refresh_token": "...",
      "expires_in": 900
    },
    "session": {
      "created_at": "...",
      "expires_at": "...",
      "ip_address": "..."
    }
  }
}
```

#### `POST /api/auth/refresh-token`
Refresh expired access tokens.

**Request:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

#### `POST /api/auth/logout`
Logout from current device or all devices.

**Request:**
```json
{
  "logoutFromAllDevices": false
}
```

#### `POST /api/auth/reset-password`
Password reset flow with multiple actions.

**Request (Initiate):**
```json
{
  "action": "initiate",
  "email": "user@example.com"
}
```

**Request (Complete):**
```json
{
  "action": "complete",
  "token": "reset_token_here",
  "newPassword": "newsecurepassword"
}
```

### Session Management

#### `GET /api/auth/sessions`
Get user's active sessions across all devices.

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session_id",
        "deviceInfo": "Chrome on Windows",
        "location": "New York, US",
        "lastActivity": "2024-01-15T10:30:00Z",
        "isCurrentSession": true,
        "status": "active"
      }
    ],
    "total": 1
  }
}
```

#### `DELETE /api/auth/sessions`
Revoke specific session or all sessions.

**Request (Revoke Specific):**
```json
{
  "sessionId": "session_id_to_revoke"
}
```

**Request (Revoke All):**
```json
{
  "revokeAll": true
}
```

### API Key Management

#### `GET /api/auth/api-keys`
List user's API keys.

#### `POST /api/auth/api-keys`
Create new API key.

**Request:**
```json
{
  "name": "AutoBolt Extension",
  "description": "API key for automated directory submissions",
  "permissions": ["read_directories", "create_submissions"],
  "rateLimit": 100,
  "expiresInDays": 365,
  "ipWhitelist": ["192.168.1.100"],
  "referrerWhitelist": ["chrome-extension://extension-id"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": {
      "id": "ak_...",
      "name": "AutoBolt Extension",
      "key": "db_[64_hex_characters]",
      "permissions": ["read_directories", "create_submissions"],
      "rateLimit": 100,
      "expiresAt": "2025-01-15T00:00:00Z"
    },
    "plainKey": "db_[64_hex_characters]",
    "warning": "Store this API key securely. It will not be shown again."
  }
}
```

#### `DELETE /api/auth/api-keys`
Revoke API key.

**Request:**
```json
{
  "keyId": "ak_key_id_to_revoke"
}
```

## Integration Examples

### Frontend Authentication Hook

```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const login = async (email: string, password: string, rememberMe = false) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, remember_me: rememberMe })
    })
    
    const data = await response.json()
    if (data.success) {
      setUser(data.data.user)
      return { success: true }
    }
    throw new Error(data.error.message)
  }
  
  const logout = async (allDevices = false) => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ logoutFromAllDevices: allDevices })
    })
    setUser(null)
  }
  
  return { user, loading, login, logout }
}
```

### Protected API Route

```typescript
// pages/api/protected-route.ts
import { authMiddleware } from '../../lib/auth/middleware'

export default authMiddleware({
  requireAuth: true,
  requiredPermission: 'submissions:create'
})(async (req, res) => {
  // This handler only runs if user is authenticated and has permission
  res.json({
    message: 'Access granted!',
    user: req.user.email,
    role: req.role
  })
})
```

### AutoBolt Extension Integration

```javascript
// AutoBolt Chrome Extension
class DirectoryBoltAPI {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.baseUrl = 'https://directorybolt.com/api'
  }
  
  async submitBusiness(businessData, directories) {
    const response = await fetch(`${this.baseUrl}/autobolt/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'User-Agent': 'AutoBolt Extension v1.0'
      },
      body: JSON.stringify({ businessData, directories })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error.message)
    }
    
    return await response.json()
  }
}
```

## Security Features

### Rate Limiting

**IP-Based Rate Limiting:**
- Strict: 10 requests/minute
- Normal: 60 requests/minute  
- Lenient: 300 requests/minute

**User Tier-Based Rate Limiting:**
- Free: 100 requests/hour
- Starter: 300 requests/hour
- Growth: 600 requests/hour
- Professional: 1200 requests/hour
- Enterprise: 3000 requests/hour

### Security Headers

```typescript
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' // Production only
}
```

### CSRF Protection

All state-changing requests (POST, PUT, DELETE) require CSRF tokens.

### Password Security

- Minimum 8 characters
- Requires uppercase, lowercase, numbers, and special characters
- Bcrypt hashing with 12 salt rounds
- Common password validation
- Password strength scoring

## Database Schema

The authentication system requires these database tables:

```sql
-- Users table (enhanced)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Sessions table
CREATE TABLE user_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_info JSONB NOT NULL,
  security_info JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  timeout_ms INTEGER NOT NULL DEFAULT 1800000,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  permissions TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  rate_limit_per_hour INTEGER DEFAULT 100,
  requests_made_today INTEGER DEFAULT 0,
  last_used_at TIMESTAMP,
  created_from_ip VARCHAR(45) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Password Reset Tokens table
CREATE TABLE password_reset_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  client_ip VARCHAR(45) NOT NULL,
  user_agent TEXT
);

-- API Key Usage table
CREATE TABLE api_key_usage (
  id SERIAL PRIMARY KEY,
  key_id VARCHAR(255) NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT NOW(),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent TEXT,
  response_status INTEGER NOT NULL,
  processing_time_ms INTEGER NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_status ON user_sessions(status);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
CREATE INDEX idx_api_key_usage_key_id_timestamp ON api_key_usage(key_id, timestamp);
```

## Deployment Configuration

### Environment Variables

Copy `env.example` to `.env.local` and configure:

```bash
# Required JWT secrets (64+ characters)
JWT_ACCESS_SECRET="your-64+-character-secret"
JWT_REFRESH_SECRET="your-64+-character-secret"

# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..." # Optional

# Email service
EMAIL_PROVIDER="sendgrid"
EMAIL_API_KEY="your-email-api-key"

# Application URLs
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

### Production Checklist

- [ ] Generate secure JWT secrets (64+ characters)
- [ ] Set up PostgreSQL database with proper indexes
- [ ] Configure Redis for session storage (recommended)
- [ ] Set up email service (SendGrid, AWS SES)
- [ ] Enable all security headers
- [ ] Configure HTTPS and secure cookies
- [ ] Set up rate limiting with Redis
- [ ] Configure error monitoring (Sentry)
- [ ] Set up automated backups
- [ ] Monitor authentication logs
- [ ] Implement proper key rotation schedule

### Performance Considerations

1. **Database Indexing**: All foreign keys and frequently queried fields have indexes
2. **Redis Caching**: Session and rate limiting data cached in Redis
3. **Token Lifecycle**: Short-lived access tokens reduce database load
4. **Batch Operations**: Session cleanup runs periodically, not on every request
5. **Connection Pooling**: Database connections pooled for performance

## Testing

### Unit Tests

```bash
npm run test:auth
```

### Integration Tests

```bash
npm run test:integration
```

### Security Tests

```bash
npm run security-test
```

## Monitoring & Logging

All authentication events are logged with:
- Request ID for tracing
- User information (when available)
- IP address and user agent
- Timestamp and outcome
- Security violations and rate limiting

Example log entry:
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "message": "User login successful",
  "requestId": "req_1642248600_abc123",
  "metadata": {
    "userId": "usr_123",
    "email": "user@example.com",
    "ip": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "loginMethod": "password"
  }
}
```

## Support & Troubleshooting

### Common Issues

1. **JWT Token Expired**: Use refresh token to get new access token
2. **Rate Limited**: Wait for rate limit window to reset
3. **Permission Denied**: Check user role and subscription tier
4. **Session Expired**: Re-authenticate user
5. **API Key Invalid**: Verify key format and expiration

### Debug Mode

Set `DEBUG_AUTH=true` in environment for detailed authentication logging.

## Conclusion

This authentication system provides enterprise-grade security for DirectoryBolt with comprehensive features including JWT tokens, role-based access control, session management, and API key generation. The system is designed to be secure, scalable, and maintainable while providing excellent developer experience.

For questions or issues, please refer to the integration examples or contact the development team.