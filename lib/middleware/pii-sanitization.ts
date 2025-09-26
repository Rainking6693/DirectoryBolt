// 🔒 PII SANITIZATION MIDDLEWARE - DATA-001
// Comprehensive Personal Identifiable Information protection
// Implements data masking, field filtering, and access control for customer data

import type { NextApiRequest, NextApiResponse } from 'next';

// PII Configuration
const PII_CONFIG = {
  // Sensitive fields that should be masked or removed
  sensitiveFields: [
    // Personal information
    'password', 'password_hash', 'passwordHash',
    'ssn', 'socialSecurityNumber', 'social_security_number',
    'creditCard', 'credit_card', 'cardNumber', 'card_number',
    'bankAccount', 'bank_account', 'accountNumber', 'account_number',
    'driverLicense', 'driver_license', 'passport', 'passportNumber',
    
    // Authentication data
    'token', 'refreshToken', 'refresh_token', 'apiKey', 'api_key',
    'secret', 'privateKey', 'private_key', 'salt',
    'verification_token', 'verificationToken', 'resetToken', 'reset_token',
    
    // Internal system data
    'internalId', 'internal_id', 'systemId', 'system_id',
    'debugInfo', 'debug_info', 'stackTrace', 'stack_trace',
    'errorDetails', 'error_details', 'logs', 'auditLog', 'audit_log'
  ],
  
  // Fields that should be masked (partially hidden)
  maskableFields: [
    'email', 'phone', 'phoneNumber', 'phone_number',
    'address', 'streetAddress', 'street_address',
    'ipAddress', 'ip_address', 'userAgent', 'user_agent'
  ],
  
  // Fields that require role-based access
  restrictedFields: {
    admin: [], // Admin can see everything
    manager: ['password_hash', 'token', 'secret', 'privateKey'],
    support: ['password_hash', 'token', 'secret', 'privateKey', 'ssn', 'creditCard'],
    customer: ['password_hash', 'token', 'secret', 'privateKey', 'ssn', 'creditCard', 'internalId', 'systemId']
  },
  
  // Masking patterns
  maskingPatterns: {
    email: (email: string) => {
      const [local, domain] = email.split('@');
      if (local.length <= 2) return `${local[0]}***@${domain}`;
      return `${local.substring(0, 2)}***@${domain}`;
    },
    phone: (phone: string) => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length >= 10) {
        return `***-***-${cleaned.slice(-4)}`;
      }
      return '***-***-****';
    },
    address: (address: string) => {
      const words = address.split(' ');
      if (words.length <= 2) return '*** ***';
      return `${words[0]} *** ${words[words.length - 1]}`;
    },
    ipAddress: (ip: string) => {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.***.***.***`;
      }\n      return '***.***.***.***.***';\n    },\n    userAgent: (ua: string) => {\n      // Keep browser and OS info, mask specific version details\n      return ua.replace(/\\d+\\.\\d+\\.\\d+/g, 'X.X.X');\n    },\n    default: (value: string) => {\n      if (value.length <= 4) return '***';\n      return `${value.substring(0, 2)}***${value.slice(-2)}`;\n    }\n  }\n};\n\n// PII sanitization class\nclass PIISanitizer {\n  private userRole: string;\n  private userType: 'customer' | 'staff' | 'admin';\n  private requestingUserId?: string;\n  \n  constructor(userRole: string = 'customer', userType: 'customer' | 'staff' | 'admin' = 'customer', requestingUserId?: string) {\n    this.userRole = userRole;\n    this.userType = userType;\n    this.requestingUserId = requestingUserId;\n  }\n  \n  // Main sanitization method\n  sanitizeData(data: any, targetUserId?: string): any {\n    if (data === null || data === undefined) {\n      return data;\n    }\n    \n    // Check if user is accessing their own data\n    const isOwnData = targetUserId && this.requestingUserId === targetUserId;\n    \n    if (Array.isArray(data)) {\n      return data.map(item => this.sanitizeData(item, targetUserId));\n    }\n    \n    if (typeof data === 'object') {\n      return this.sanitizeObject(data, isOwnData);\n    }\n    \n    return data;\n  }\n  \n  // Sanitize object properties\n  private sanitizeObject(obj: Record<string, any>, isOwnData: boolean = false): Record<string, any> {\n    const sanitized: Record<string, any> = {};\n    \n    for (const [key, value] of Object.entries(obj)) {\n      const lowerKey = key.toLowerCase();\n      \n      // Check if field should be completely removed\n      if (this.shouldRemoveField(key, isOwnData)) {\n        continue; // Skip this field entirely\n      }\n      \n      // Check if field should be masked\n      if (this.shouldMaskField(key, isOwnData)) {\n        sanitized[key] = this.maskValue(key, value);\n        continue;\n      }\n      \n      // Recursively sanitize nested objects\n      if (typeof value === 'object' && value !== null) {\n        sanitized[key] = this.sanitizeData(value, isOwnData ? this.requestingUserId : undefined);\n      } else {\n        sanitized[key] = value;\n      }\n    }\n    \n    return sanitized;\n  }\n  \n  // Check if field should be completely removed\n  private shouldRemoveField(fieldName: string, isOwnData: boolean): boolean {\n    const lowerField = fieldName.toLowerCase();\n    \n    // Always remove highly sensitive fields\n    const alwaysRemove = [\n      'password', 'password_hash', 'passwordhash',\n      'secret', 'privatekey', 'private_key',\n      'token', 'refreshtoken', 'refresh_token',\n      'salt', 'verification_token', 'verificationtoken'\n    ];\n    \n    if (alwaysRemove.some(field => lowerField.includes(field))) {\n      return true;\n    }\n    \n    // Role-based field removal\n    const restrictedForRole = PII_CONFIG.restrictedFields[this.userRole as keyof typeof PII_CONFIG.restrictedFields] || PII_CONFIG.restrictedFields.customer;\n    \n    if (restrictedForRole.some(field => lowerField.includes(field.toLowerCase()))) {\n      return !isOwnData; // Allow own data access\n    }\n    \n    // Admin and manager can see more fields\n    if (this.userRole === 'admin') {\n      return false; // Admin can see everything\n    }\n    \n    return false;\n  }\n  \n  // Check if field should be masked\n  private shouldMaskField(fieldName: string, isOwnData: boolean): boolean {\n    const lowerField = fieldName.toLowerCase();\n    \n    // Don't mask own data for certain fields\n    if (isOwnData && ['email', 'phone', 'address'].some(field => lowerField.includes(field))) {\n      return false;\n    }\n    \n    // Check if field is in maskable list\n    return PII_CONFIG.maskableFields.some(field => \n      lowerField.includes(field.toLowerCase())\n    );\n  }\n  \n  // Mask field value\n  private maskValue(fieldName: string, value: any): any {\n    if (typeof value !== 'string') {\n      return value;\n    }\n    \n    const lowerField = fieldName.toLowerCase();\n    \n    // Apply specific masking pattern\n    if (lowerField.includes('email')) {\n      return PII_CONFIG.maskingPatterns.email(value);\n    }\n    \n    if (lowerField.includes('phone')) {\n      return PII_CONFIG.maskingPatterns.phone(value);\n    }\n    \n    if (lowerField.includes('address')) {\n      return PII_CONFIG.maskingPatterns.address(value);\n    }\n    \n    if (lowerField.includes('ip')) {\n      return PII_CONFIG.maskingPatterns.ipAddress(value);\n    }\n    \n    if (lowerField.includes('useragent') || lowerField.includes('user_agent')) {\n      return PII_CONFIG.maskingPatterns.userAgent(value);\n    }\n    \n    // Default masking\n    return PII_CONFIG.maskingPatterns.default(value);\n  }\n  \n  // Sanitize API response\n  sanitizeResponse(data: any, targetUserId?: string): any {\n    const sanitized = this.sanitizeData(data, targetUserId);\n    \n    // Add sanitization metadata\n    if (typeof sanitized === 'object' && sanitized !== null && !Array.isArray(sanitized)) {\n      sanitized._sanitized = {\n        timestamp: new Date().toISOString(),\n        userRole: this.userRole,\n        userType: this.userType,\n        fieldsRemoved: this.countRemovedFields(data, sanitized),\n        fieldsMasked: this.countMaskedFields(data, sanitized)\n      };\n    }\n    \n    return sanitized;\n  }\n  \n  // Count removed fields for audit\n  private countRemovedFields(original: any, sanitized: any): number {\n    if (typeof original !== 'object' || typeof sanitized !== 'object') {\n      return 0;\n    }\n    \n    const originalKeys = Object.keys(original || {});\n    const sanitizedKeys = Object.keys(sanitized || {});\n    \n    return originalKeys.length - sanitizedKeys.length;\n  }\n  \n  // Count masked fields for audit\n  private countMaskedFields(original: any, sanitized: any): number {\n    if (typeof original !== 'object' || typeof sanitized !== 'object') {\n      return 0;\n    }\n    \n    let maskedCount = 0;\n    \n    for (const key of Object.keys(original || {})) {\n      if (sanitized[key] && typeof original[key] === 'string' && typeof sanitized[key] === 'string') {\n        if (original[key] !== sanitized[key] && sanitized[key].includes('***')) {\n          maskedCount++;\n        }\n      }\n    }\n    \n    return maskedCount;\n  }\n}\n\n// Middleware function for automatic PII sanitization\nexport function withPIISanitization(\n  options: {\n    enabled?: boolean;\n    logSanitization?: boolean;\n  } = {}\n) {\n  const { enabled = true, logSanitization = true } = options;\n  \n  return function middleware(\n    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void\n  ) {\n    return async function wrappedHandler(\n      req: NextApiRequest,\n      res: NextApiResponse\n    ) {\n      if (!enabled) {\n        return handler(req, res);\n      }\n      \n      // Get user context from request (set by auth middleware)\n      const user = (req as any).user;\n      const userRole = user?.role || 'customer';\n      const userType = user?.userType || 'customer';\n      const requestingUserId = user?.sub;\n      \n      // Create sanitizer instance\n      const sanitizer = new PIISanitizer(userRole, userType, requestingUserId);\n      \n      // Override res.json to sanitize responses\n      const originalJson = res.json;\n      res.json = function(data: any) {\n        try {\n          // Extract target user ID from request (if applicable)\n          const targetUserId = req.query.userId as string || req.body?.userId;\n          \n          // Sanitize response data\n          const sanitizedData = sanitizer.sanitizeResponse(data, targetUserId);\n          \n          // Log sanitization if enabled\n          if (logSanitization && sanitizedData._sanitized) {\n            console.log('🔒 PII sanitization applied', {\n              endpoint: req.url,\n              userRole,\n              userType,\n              fieldsRemoved: sanitizedData._sanitized.fieldsRemoved,\n              fieldsMasked: sanitizedData._sanitized.fieldsMasked,\n              requestingUserId,\n              targetUserId\n            });\n          }\n          \n          return originalJson.call(this, sanitizedData);\n        } catch (error) {\n          console.error('❌ PII sanitization error:', error);\n          // Return original data if sanitization fails\n          return originalJson.call(this, data);\n        }\n      };\n      \n      // Continue to the actual handler\n      return handler(req, res);\n    };\n  };\n}\n\n// Utility function for manual sanitization\nexport function sanitizePII(\n  data: any,\n  userRole: string = 'customer',\n  userType: 'customer' | 'staff' | 'admin' = 'customer',\n  requestingUserId?: string,\n  targetUserId?: string\n): any {\n  const sanitizer = new PIISanitizer(userRole, userType, requestingUserId);\n  return sanitizer.sanitizeData(data, targetUserId);\n}\n\n// Export configuration for external use\nexport { PII_CONFIG, PIISanitizer };"