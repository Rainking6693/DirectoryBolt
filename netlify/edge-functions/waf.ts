// 🛡️ DIRECTORYBOT WAF - Web Application Firewall
// INFRA-001: Advanced security protection using Netlify Edge Functions
// Protects against common attacks, implements rate limiting, and blocks malicious traffic

interface NetlifyEdgeContext {
  ip: string
  next(): Promise<Response>
}

// WAF Configuration
const WAF_CONFIG = {
  // Rate limiting configuration
  rateLimiting: {
    enabled: true,
    windowMs: 60 * 1000, // 1 minute window
    maxRequests: {
      api: 200,        // API endpoints
      auth: 30,        // Authentication endpoints
      payment: 50,     // Payment endpoints
      general: 500     // General pages (more generous for front page)
    }
  },
  
  // IP blocking configuration
  ipBlocking: {
    enabled: true,
    blockedIPs: [
      // Add known malicious IPs here
    ],
    blockedCountries: [
      // Add blocked country codes if needed
    ]
  },
  
  // Attack pattern detection
  attackPatterns: {
    enabled: true,
    patterns: [
      // SQL Injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
      /(\b(or|and)\s+\d+\s*=\s*\d+)/i,
      /(\'|\"|;|--|\*|\|)/,
      
      // XSS patterns
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      
      // Path traversal patterns
      /\.\.\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
      
      // Command injection patterns
      /(\||;|&|`|\$\(|\${)/,
      /(nc|netcat|wget|curl|ping|nslookup|dig)\s/i,
      
      // File inclusion patterns
      /(file|http|https|ftp):\/\//i,
      /\.(php|asp|jsp|cgi|pl|py|rb|sh|bat|cmd)(\?|$)/i
    ]
  },
  
  // User agent filtering
  userAgentFiltering: {
    enabled: true,
    blockedAgents: [
      // Only block obvious malicious agents
      /scanner/i,
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /burp/i
    ],
    allowedBots: [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i,
      /chrome/i,
      /firefox/i,
      /safari/i,
      /edge/i,
      /opera/i,
      /mozilla/i
    ]
  }
};

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Blocked IPs storage
const blockedIPs = new Set<string>();

export default async function waf(request: Request, context: NetlifyEdgeContext) {
  const url = new URL(request.url);
  const clientIP = context.ip;
  const userAgent = request.headers.get('user-agent') || '';
  const method = request.method;
  const pathname = url.pathname;
  
  try {
    // 🔍 1. IP Blocking Check
    if (WAF_CONFIG.ipBlocking.enabled) {
      if (isIPBlocked(clientIP)) {
        return blockRequest('IP_BLOCKED', clientIP, pathname);
      }
    }
    
    // 🔍 2. User Agent Filtering
    if (WAF_CONFIG.userAgentFiltering.enabled) {
      const agentCheck = checkUserAgent(userAgent);
      if (agentCheck.blocked) {
        return blockRequest('USER_AGENT_BLOCKED', clientIP, pathname, { userAgent });
      }
    }
    
    // 🔍 3. Rate Limiting
    if (WAF_CONFIG.rateLimiting.enabled) {
      const rateLimitCheck = checkRateLimit(clientIP, pathname, method);
      if (rateLimitCheck.blocked) {
        const resetTime = rateLimitCheck.resetTime ?? Date.now() + 1000;
        return rateLimitResponse(clientIP, pathname, resetTime);
      }
    }
    
    // 🔍 4. Attack Pattern Detection (skip for front page and static assets)
    if (WAF_CONFIG.attackPatterns.enabled && !isStaticOrFrontPage(pathname)) {
      const attackCheck = detectAttackPatterns(request, url);
      if (attackCheck.detected) {
        // Block IP temporarily for attack attempts
        blockIPTemporarily(clientIP, 15 * 60 * 1000); // 15 minutes
        return blockRequest('ATTACK_PATTERN_DETECTED', clientIP, pathname, { 
          pattern: attackCheck.pattern,
          location: attackCheck.location 
        });
      }
    }
    
    // 🔍 5. Request Size Limits
    const sizeCheck = checkRequestSize(request);
    if (sizeCheck.blocked) {
      return blockRequest('REQUEST_TOO_LARGE', clientIP, pathname, { 
        size: sizeCheck.size,
        limit: sizeCheck.limit 
      });
    }
    
    // ✅ Request passed all WAF checks - allow through
    logAllowedRequest(clientIP, pathname, method, userAgent);
    
    // Continue to the origin
    return context.next();
    
  } catch (error) {
    // WAF error - log and allow request to prevent blocking legitimate traffic
    console.error('WAF Error:', error);
    logWAFError(error, clientIP, pathname);
    return context.next();
  }
}

// 🚫 IP Blocking Functions
function isIPBlocked(ip: string): boolean {
  return blockedIPs.has(ip) || (WAF_CONFIG.ipBlocking.blockedIPs as string[]).includes(ip);
}

function blockIPTemporarily(ip: string, durationMs: number): void {
  blockedIPs.add(ip);
  setTimeout(() => {
    blockedIPs.delete(ip);
  }, durationMs);
}

// 🤖 User Agent Filtering
function checkUserAgent(userAgent: string): { blocked: boolean; reason?: string } {
  if (!userAgent || userAgent.trim() === '') {
    return { blocked: false }; // Allow empty user agents to prevent blocking legitimate traffic
  }
  
  // Check if it's an allowed bot or browser
  for (const allowedBot of WAF_CONFIG.userAgentFiltering.allowedBots) {
    if (allowedBot.test(userAgent)) {
      return { blocked: false };
    }
  }
  
  // Check if it's a blocked agent
  for (const blockedAgent of WAF_CONFIG.userAgentFiltering.blockedAgents) {
    if (blockedAgent.test(userAgent)) {
      return { blocked: true, reason: 'Blocked user agent pattern' };
    }
  }
  
  return { blocked: false };
}

// Helper function to check if path is static or front page
function isStaticOrFrontPage(pathname: string): boolean {
  return pathname === '/' || 
         pathname.startsWith('/_next/') ||
         pathname.startsWith('/images/') ||
         pathname.startsWith('/static/') ||
         pathname.includes('.') && !pathname.startsWith('/api/');
}

// ⏱️ Rate Limiting Functions
function checkRateLimit(ip: string, pathname: string, method: string): { 
  blocked: boolean; 
  resetTime?: number;
  count?: number;
  limit?: number;
} {
  const now = Date.now();
  const windowMs = WAF_CONFIG.rateLimiting.windowMs;
  const key = `${ip}:${getEndpointCategory(pathname)}`;
  
  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 0,
      resetTime: now + windowMs
    };
  }
  
  // Increment request count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  // Check if limit exceeded
  const limit = getRateLimitForEndpoint(pathname);
  if (entry.count > limit) {
    return {
      blocked: true,
      resetTime: entry.resetTime,
      count: entry.count,
      limit
    };
  }
  
  return { blocked: false };
}

function getEndpointCategory(pathname: string): string {
  if (pathname.startsWith('/api/auth/')) return 'auth';
  if (pathname.startsWith('/api/payments/') || pathname.startsWith('/api/stripe/')) return 'payment';
  if (pathname.startsWith('/api/')) return 'api';
  return 'general';
}

function getRateLimitForEndpoint(pathname: string): number {
  const category = getEndpointCategory(pathname);
  return WAF_CONFIG.rateLimiting.maxRequests[category as keyof typeof WAF_CONFIG.rateLimiting.maxRequests] || 
         WAF_CONFIG.rateLimiting.maxRequests.general;
}

// 🎯 Attack Pattern Detection
function detectAttackPatterns(request: Request, url: URL): {
  detected: boolean;
  pattern?: string;
  location?: string;
} {
  const searchParams = url.searchParams;
  const pathname = url.pathname;
  
  // Check URL path
  for (const pattern of WAF_CONFIG.attackPatterns.patterns) {
    if (pattern.test(pathname)) {
      return {
        detected: true,
        pattern: pattern.toString(),
        location: 'pathname'
      };
    }
  }
  
  // Check query parameters
  for (const [key, value] of searchParams.entries()) {
    for (const pattern of WAF_CONFIG.attackPatterns.patterns) {
      if (pattern.test(key) || pattern.test(value)) {
        return {
          detected: true,
          pattern: pattern.toString(),
          location: `query_param:${key}`
        };
      }
    }
  }
  
  // Check headers for injection attempts
  const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'referer', 'user-agent'];
  for (const headerName of suspiciousHeaders) {
    const headerValue = request.headers.get(headerName);
    if (headerValue) {
      for (const pattern of WAF_CONFIG.attackPatterns.patterns) {
        if (pattern.test(headerValue)) {
          return {
            detected: true,
            pattern: pattern.toString(),
            location: `header:${headerName}`
          };
        }
      }
    }
  }
  
  return { detected: false };
}

// 📏 Request Size Checking
function checkRequestSize(request: Request): {
  blocked: boolean;
  size?: number;
  limit?: number;
} {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    const limit = 10 * 1024 * 1024; // 10MB limit
    
    if (size > limit) {
      return {
        blocked: true,
        size,
        limit
      };
    }
  }
  
  return { blocked: false };
}

// 🚫 Response Generation Functions
function blockRequest(reason: string, ip: string, pathname: string, details?: any): Response {
  logBlockedRequest(reason, ip, pathname, details);
  
  return new Response(
    JSON.stringify({
      error: 'Request Blocked',
      message: 'Your request has been blocked by our security system.',
      timestamp: new Date().toISOString(),
      requestId: generateRequestId()
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-WAF-Block-Reason': reason,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Cache-Control': 'no-store'
      }
    }
  );
}

function rateLimitResponse(ip: string, pathname: string, resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  logBlockedRequest('RATE_LIMIT_EXCEEDED', ip, pathname, { resetTime, retryAfter });
  
  return new Response(
    JSON.stringify({
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter,
      timestamp: new Date().toISOString()
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': getRateLimitForEndpoint(pathname).toString(),
        'X-RateLimit-Reset': resetTime.toString(),
        'Cache-Control': 'no-store'
      }
    }
  );
}

// 📝 Logging Functions
function logBlockedRequest(reason: string, ip: string, pathname: string, details?: any): void {
  console.log(`🚫 WAF BLOCK: ${reason}`, {
    timestamp: new Date().toISOString(),
    ip,
    pathname,
    reason,
    details
  });
}

function logAllowedRequest(ip: string, pathname: string, method: string, userAgent: string): void {
  // Log front page requests and API requests for debugging
  if (pathname === '/' || pathname.startsWith('/api/')) {
    console.log(`✅ WAF ALLOW: ${method} ${pathname}`, {
      timestamp: new Date().toISOString(),
      ip,
      userAgent: userAgent.substring(0, 100) // Truncate long user agents
    });
  }
}

function logWAFError(error: any, ip: string, pathname: string): void {
  console.error(`❌ WAF ERROR:`, {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    ip,
    pathname
  });
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// WAF configuration for Netlify
// NOTE: DISABLED to prevent conflicts with performance-optimizer
// To enable: uncomment and remove performance-optimizer.js
// export const config = {
//   path: "/*",
//   excludedPath: [
//     "/_next/*",
//     "/images/*",
//     "/favicon.ico",
//     "/robots.txt",
//     "/sitemap.xml"
//   ]
// };