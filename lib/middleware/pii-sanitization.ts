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
      }
      return '***.***.***.***.***';
    },
    userAgent: (ua: string) => {
      // Keep browser and OS info, mask specific version details
      return ua.replace(/\d+\.\d+\.\d+/g, 'X.X.X');
    },
    default: (value: string) => {
      if (value.length <= 4) return '***';
      return `${value.substring(0, 2)}***${value.slice(-2)}`;
    }
  }
};

// PII sanitization class
class PIISanitizer {
  private userRole: string;
  private userType: 'customer' | 'staff' | 'admin';
  private requestingUserId?: string;
  
  constructor(userRole: string = 'customer', userType: 'customer' | 'staff' | 'admin' = 'customer', requestingUserId?: string) {
    this.userRole = userRole;
    this.userType = userType;
    this.requestingUserId = requestingUserId;
  }
  
  // Main sanitization method
  sanitizeData(data: any, targetUserId?: string): any {
    if (data === null || data === undefined) {
      return data;
    }
    
    // Check if user is accessing their own data
    const isOwnData = targetUserId && this.requestingUserId === targetUserId;
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item, targetUserId));
    }
    
    if (typeof data === 'object') {
      return this.sanitizeObject(data, isOwnData);
    }
    
    return data;
  }
  
  // Sanitize object properties
  private sanitizeObject(obj: Record<string, any>, isOwnData: boolean = false): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if field should be completely removed
      if (this.shouldRemoveField(key, isOwnData)) {
        continue; // Skip this field entirely
      }
      
      // Check if field should be masked
      if (this.shouldMaskField(key, isOwnData)) {
        sanitized[key] = this.maskValue(key, value);
        continue;
      }
      
      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value, isOwnData ? this.requestingUserId : undefined);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  // Check if field should be completely removed
  private shouldRemoveField(fieldName: string, isOwnData: boolean): boolean {
    const lowerField = fieldName.toLowerCase();
    
    // Always remove highly sensitive fields
    const alwaysRemove = [
      'password', 'password_hash', 'passwordhash',
      'secret', 'privatekey', 'private_key',
      'token', 'refreshtoken', 'refresh_token',
      'salt', 'verification_token', 'verificationtoken'
    ];
    
    if (alwaysRemove.some(field => lowerField.includes(field))) {
      return true;
    }
    
    // Role-based field removal
    const restrictedForRole = PII_CONFIG.restrictedFields[this.userRole as keyof typeof PII_CONFIG.restrictedFields] || PII_CONFIG.restrictedFields.customer;
    
    if (restrictedForRole.some(field => lowerField.includes(field.toLowerCase()))) {
      return !isOwnData; // Allow own data access
    }
    
    // Admin and manager can see more fields
    if (this.userRole === 'admin') {
      return false; // Admin can see everything
    }
    
    return false;
  }
  
  // Check if field should be masked
  private shouldMaskField(fieldName: string, isOwnData: boolean): boolean {
    const lowerField = fieldName.toLowerCase();
    
    // Don't mask own data for certain fields
    if (isOwnData && ['email', 'phone', 'address'].some(field => lowerField.includes(field))) {
      return false;
    }
    
    // Check if field is in maskable list
    return PII_CONFIG.maskableFields.some(field => 
      lowerField.includes(field.toLowerCase())
    );
  }
  
  // Mask field value
  private maskValue(fieldName: string, value: any): any {
    if (typeof value !== 'string') {
      return value;
    }
    
    const lowerField = fieldName.toLowerCase();
    
    // Apply specific masking pattern
    if (lowerField.includes('email')) {
      return PII_CONFIG.maskingPatterns.email(value);
    }
    
    if (lowerField.includes('phone')) {
      return PII_CONFIG.maskingPatterns.phone(value);
    }
    
    if (lowerField.includes('address')) {
      return PII_CONFIG.maskingPatterns.address(value);
    }
    
    if (lowerField.includes('ip')) {
      return PII_CONFIG.maskingPatterns.ipAddress(value);
    }
    
    if (lowerField.includes('useragent') || lowerField.includes('user_agent')) {
      return PII_CONFIG.maskingPatterns.userAgent(value);
    }
    
    // Default masking
    return PII_CONFIG.maskingPatterns.default(value);
  }
  
  // Sanitize API response
  sanitizeResponse(data: any, targetUserId?: string): any {
    const sanitized = this.sanitizeData(data, targetUserId);
    
    // Add sanitization metadata
    if (typeof sanitized === 'object' && sanitized !== null && !Array.isArray(sanitized)) {
      sanitized._sanitized = {
        timestamp: new Date().toISOString(),
        userRole: this.userRole,
        userType: this.userType,
        fieldsRemoved: this.countRemovedFields(data, sanitized),
        fieldsMasked: this.countMaskedFields(data, sanitized)
      };
    }
    
    return sanitized;
  }
  
  // Count removed fields for audit
  private countRemovedFields(original: any, sanitized: any): number {
    if (typeof original !== 'object' || typeof sanitized !== 'object') {
      return 0;
    }
    
    const originalKeys = Object.keys(original || {});
    const sanitizedKeys = Object.keys(sanitized || {});
    
    return originalKeys.length - sanitizedKeys.length;
  }
  
  // Count masked fields for audit
  private countMaskedFields(original: any, sanitized: any): number {
    if (typeof original !== 'object' || typeof sanitized !== 'object') {
      return 0;
    }
    
    let maskedCount = 0;
    
    for (const key of Object.keys(original || {})) {
      if (sanitized[key] && typeof original[key] === 'string' && typeof sanitized[key] === 'string') {
        if (original[key] !== sanitized[key] && sanitized[key].includes('***')) {
          maskedCount++;
        }
      }
    }
    
    return maskedCount;
  }
}

// Middleware function for automatic PII sanitization
export function withPIISanitization(
  options: {
    enabled?: boolean;
    logSanitization?: boolean;
  } = {}
) {
  const { enabled = true, logSanitization = true } = options;
  
  return function middleware(
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void
  ) {
    return async function wrappedHandler(
      req: NextApiRequest,
      res: NextApiResponse
    ) {
      if (!enabled) {
        return handler(req, res);
      }
      
      // Get user context from request (set by auth middleware)
      const user = (req as any).user;
      const userRole = user?.role || 'customer';
      const userType = user?.userType || 'customer';
      const requestingUserId = user?.sub;
      
      // Create sanitizer instance
      const sanitizer = new PIISanitizer(userRole, userType, requestingUserId);
      
      // Override res.json to sanitize responses
      const originalJson = res.json;
      res.json = function(data: any) {
        try {
          // Extract target user ID from request (if applicable)
          const targetUserId = req.query.userId as string || req.body?.userId;
          
          // Sanitize response data
          const sanitizedData = sanitizer.sanitizeResponse(data, targetUserId);
          
          // Log sanitization if enabled
          if (logSanitization && sanitizedData._sanitized) {
            console.log('🔒 PII sanitization applied', {
              endpoint: req.url,
              userRole,
              userType,
              fieldsRemoved: sanitizedData._sanitized.fieldsRemoved,
              fieldsMasked: sanitizedData._sanitized.fieldsMasked,
              requestingUserId,
              targetUserId
            });
          }
          
          return originalJson.call(this, sanitizedData);
        } catch (error) {
          console.error('❌ PII sanitization error:', error);
          // Return original data if sanitization fails
          return originalJson.call(this, data);
        }
      };
      
      // Continue to the actual handler
      return handler(req, res);
    };
  };
}

// Utility function for manual sanitization
export function sanitizePII(
  data: any,
  userRole: string = 'customer',
  userType: 'customer' | 'staff' | 'admin' = 'customer',
  requestingUserId?: string,
  targetUserId?: string
): any {
  const sanitizer = new PIISanitizer(userRole, userType, requestingUserId);
  return sanitizer.sanitizeData(data, targetUserId);
}

// Export configuration for external use
export { PII_CONFIG, PIISanitizer };"