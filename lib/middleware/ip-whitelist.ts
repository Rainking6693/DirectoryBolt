// 🔒 IP WHITELISTING MIDDLEWARE - INFRA-004
// Restricts admin and staff access to authorized IP addresses
// Provides secure access control for administrative functions

import type { NextApiRequest, NextApiResponse } from 'next';

// IP Whitelist Configuration
const IP_WHITELIST_CONFIG = {
  // Enable/disable IP whitelisting
  enabled: process.env.NODE_ENV === 'production',
  
  // Allowed IP addresses for admin access
  allowedIPs: [
    // Add your office/home IP addresses here
    // Example: '192.168.1.100',
    // Example: '203.0.113.0/24', // CIDR notation supported
  ],
  
  // Allowed IP ranges for staff access
  staffAllowedIPs: [
    // Add staff IP addresses here
    // Can be more permissive than admin IPs
  ],
  
  // Emergency bypass (use with caution)
  emergencyBypass: {
    enabled: false,
    token: process.env.EMERGENCY_BYPASS_TOKEN,
    validUntil: process.env.EMERGENCY_BYPASS_EXPIRES
  },
  
  // Development mode settings
  development: {
    allowLocalhost: true,
    allowPrivateNetworks: true,
    logAllRequests: true
  }
};

// IP address utilities
class IPWhitelist {
  private static instance: IPWhitelist;
  private allowedIPs: Set<string>;
  private allowedRanges: Array<{ network: string; mask: number }>;
  
  constructor() {
    this.allowedIPs = new Set();
    this.allowedRanges = [];
    this.initializeWhitelist();
  }
  
  static getInstance(): IPWhitelist {
    if (!IPWhitelist.instance) {
      IPWhitelist.instance = new IPWhitelist();
    }
    return IPWhitelist.instance;
  }
  
  private initializeWhitelist(): void {
    const allIPs = [
      ...IP_WHITELIST_CONFIG.allowedIPs,
      ...IP_WHITELIST_CONFIG.staffAllowedIPs
    ];
    
    for (const ip of allIPs) {
      if (ip.includes('/')) {
        // CIDR notation
        const [network, maskBits] = ip.split('/');
        this.allowedRanges.push({
          network,
          mask: parseInt(maskBits, 10)
        });
      } else {
        // Single IP
        this.allowedIPs.add(ip);
      }
    }
    
    // Add development IPs if in development mode
    if (process.env.NODE_ENV !== 'production' && IP_WHITELIST_CONFIG.development.allowLocalhost) {
      this.allowedIPs.add('127.0.0.1');
      this.allowedIPs.add('::1');
      this.allowedIPs.add('localhost');
    }
  }
  
  isIPAllowed(ip: string): boolean {
    // Skip check if disabled
    if (!IP_WHITELIST_CONFIG.enabled) {
      return true;
    }
    
    // Check emergency bypass
    if (this.checkEmergencyBypass()) {
      return true;
    }
    
    // Normalize IP address
    const normalizedIP = this.normalizeIP(ip);
    
    // Check direct IP match
    if (this.allowedIPs.has(normalizedIP)) {
      return true;
    }
    
    // Check IP ranges (CIDR)
    for (const range of this.allowedRanges) {
      if (this.isIPInRange(normalizedIP, range.network, range.mask)) {
        return true;
      }
    }
    
    // Check development mode allowances
    if (process.env.NODE_ENV !== 'production') {
      if (IP_WHITELIST_CONFIG.development.allowPrivateNetworks && this.isPrivateNetwork(normalizedIP)) {
        return true;
      }
    }
    
    return false;
  }
  
  private normalizeIP(ip: string): string {
    // Remove IPv6 prefix if present
    if (ip.startsWith('::ffff:')) {
      return ip.substring(7);
    }
    return ip;
  }
  
  private isIPInRange(ip: string, network: string, maskBits: number): boolean {
    try {
      const ipNum = this.ipToNumber(ip);
      const networkNum = this.ipToNumber(network);
      const mask = (0xffffffff << (32 - maskBits)) >>> 0;
      
      return (ipNum & mask) === (networkNum & mask);
    } catch (error) {
      console.error('Error checking IP range:', error);
      return false;
    }
  }
  
  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
  }
  
  private isPrivateNetwork(ip: string): boolean {
    const privateRanges = [
      { network: '10.0.0.0', mask: 8 },
      { network: '172.16.0.0', mask: 12 },
      { network: '192.168.0.0', mask: 16 },
      { network: '127.0.0.0', mask: 8 }
    ];
    
    return privateRanges.some(range => \n      this.isIPInRange(ip, range.network, range.mask)\n    );\n  }\n  \n  private checkEmergencyBypass(): boolean {\n    if (!IP_WHITELIST_CONFIG.emergencyBypass.enabled) {\n      return false;\n    }\n    \n    const validUntil = IP_WHITELIST_CONFIG.emergencyBypass.validUntil;\n    if (validUntil && new Date() > new Date(validUntil)) {\n      return false;\n    }\n    \n    return true;\n  }\n}\n\n// Middleware function for API routes\nexport function withIPWhitelist(\n  allowedLevel: 'admin' | 'staff' = 'staff'\n) {\n  return function middleware(\n    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void\n  ) {\n    return async function wrappedHandler(\n      req: NextApiRequest,\n      res: NextApiResponse\n    ) {\n      const clientIP = getClientIP(req);\n      const ipWhitelist = IPWhitelist.getInstance();\n      \n      // Check if IP is allowed\n      if (!ipWhitelist.isIPAllowed(clientIP)) {\n        // Log unauthorized access attempt\n        logUnauthorizedAccess(req, clientIP, allowedLevel);\n        \n        // Return 403 Forbidden\n        return res.status(403).json({\n          error: 'Access Denied',\n          message: 'Your IP address is not authorized to access this resource.',\n          code: 'IP_NOT_WHITELISTED',\n          timestamp: new Date().toISOString()\n        });\n      }\n      \n      // Log authorized access\n      logAuthorizedAccess(req, clientIP, allowedLevel);\n      \n      // Continue to the actual handler\n      return handler(req, res);\n    };\n  };\n}\n\n// Get client IP address from request\nfunction getClientIP(req: NextApiRequest): string {\n  // Check various headers for the real IP\n  const forwarded = req.headers['x-forwarded-for'];\n  const realIP = req.headers['x-real-ip'];\n  const cfConnectingIP = req.headers['cf-connecting-ip'];\n  \n  if (typeof forwarded === 'string') {\n    // X-Forwarded-For can contain multiple IPs, take the first one\n    return forwarded.split(',')[0].trim();\n  }\n  \n  if (typeof realIP === 'string') {\n    return realIP;\n  }\n  \n  if (typeof cfConnectingIP === 'string') {\n    return cfConnectingIP;\n  }\n  \n  // Fallback to connection remote address\n  return req.socket.remoteAddress || 'unknown';\n}\n\n// Logging functions\nfunction logUnauthorizedAccess(\n  req: NextApiRequest,\n  clientIP: string,\n  level: string\n): void {\n  console.warn('🚫 UNAUTHORIZED IP ACCESS ATTEMPT', {\n    timestamp: new Date().toISOString(),\n    ip: clientIP,\n    path: req.url,\n    method: req.method,\n    userAgent: req.headers['user-agent'],\n    level,\n    headers: {\n      'x-forwarded-for': req.headers['x-forwarded-for'],\n      'x-real-ip': req.headers['x-real-ip'],\n      'cf-connecting-ip': req.headers['cf-connecting-ip']\n    }\n  });\n}\n\nfunction logAuthorizedAccess(\n  req: NextApiRequest,\n  clientIP: string,\n  level: string\n): void {\n  if (IP_WHITELIST_CONFIG.development.logAllRequests || process.env.NODE_ENV === 'production') {\n    console.log('✅ AUTHORIZED IP ACCESS', {\n      timestamp: new Date().toISOString(),\n      ip: clientIP,\n      path: req.url,\n      method: req.method,\n      level\n    });\n  }\n}\n\n// Utility function to add IP to whitelist (for emergency access)\nexport function addEmergencyIP(ip: string, durationHours: number = 24): void {\n  const ipWhitelist = IPWhitelist.getInstance();\n  (ipWhitelist as any).allowedIPs.add(ip);\n  \n  console.log('🚨 EMERGENCY IP ADDED', {\n    timestamp: new Date().toISOString(),\n    ip,\n    durationHours,\n    expiresAt: new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()\n  });\n  \n  // Remove after duration\n  setTimeout(() => {\n    (ipWhitelist as any).allowedIPs.delete(ip);\n    console.log('⏰ EMERGENCY IP EXPIRED', {\n      timestamp: new Date().toISOString(),\n      ip\n    });\n  }, durationHours * 60 * 60 * 1000);\n}\n\n// Export configuration for external use\nexport { IP_WHITELIST_CONFIG };\n\n// Export the IPWhitelist class for advanced usage\nexport { IPWhitelist };"