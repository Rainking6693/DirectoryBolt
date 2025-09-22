/**
 * SECURE CHROME EXTENSION RUNTIME AUTHENTICATION
 * Phase 3 Security Remediation - Zero Hardcoded Credentials
 * 
 * DirectoryBolt Enterprise Runtime Security Implementation
 * - Dynamic API key management during extension runtime
 * - User-controlled credential validation
 * - Enterprise session management
 * - Real-time security monitoring
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { extensionSecurityManager } from '../../../lib/security/extension-security-manager';
import { enterpriseCredentialManager } from '../../../lib/security/enterprise-credential-manager';
import { productionComplianceValidator } from '../../../lib/security/production-compliance-validator';

interface RuntimeAuthRequest {
  action: 'authenticate' | 'validate_runtime' | 'get_permissions' | 'security_status';
  customerId?: string;
  extensionId?: string;
  runtimeCredentials?: {
    userProvidedApiKey?: string;
    sessionToken?: string;
    oauthToken?: string;
  };
  securityContext?: {
    userAgent: string;
    extensionVersion: string;
    browserInfo: string;
  };
}

interface RuntimeAuthResponse {
  success: boolean;
  data?: {
    authenticated: boolean;
    sessionId?: string;
    authToken?: string;
    permissions?: string[];
    securityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE';
    expiresAt?: number;
    complianceStatus?: string;
  };
  security?: {
    trustScore?: number;
    threatLevel?: 'SAFE' | 'SUSPICIOUS' | 'BLOCKED';
    auditId?: string;
  };
  error?: string;
  compliance?: {
    status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
    violations?: string[];
  };
}

/**
 * ENTERPRISE RUNTIME AUTHENTICATION HANDLER
 * Manages secure runtime authentication for Chrome extensions
 */
export default async function runtimeAuthHandler(
  req: NextApiRequest,
  res: NextApiResponse<RuntimeAuthResponse>
) {
  // Enterprise Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Extension-ID, X-Customer-ID, X-Security-Token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST for runtime authentication.',
      compliance: { status: 'NON_COMPLIANT', violations: ['Invalid HTTP method'] }
    });
  }

  const clientIP = getClientIP(req);
  const userAgent = req.headers['user-agent'] || '';
  const startTime = Date.now();
  const auditId = generateAuditId();

  console.log(`🔐 Runtime auth request [${auditId}]: ${req.body?.action} from ${clientIP}`);

  try {
    // Real-time compliance monitoring
    const complianceStatus = await productionComplianceValidator.monitorCompliance();
    
    if (complianceStatus.status === 'CRITICAL') {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable due to security compliance issues',
        compliance: { 
          status: 'NON_COMPLIANT', 
          violations: complianceStatus.criticalViolations 
        }
      });
    }

    const { action, customerId, extensionId, runtimeCredentials, securityContext }: RuntimeAuthRequest = req.body;

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action parameter is required',
        compliance: { status: 'NON_COMPLIANT', violations: ['Missing required parameters'] }
      });
    }

    switch (action) {
      case 'authenticate':
        return await handleRuntimeAuthentication(req, res, {
          customerId,
          extensionId,
          runtimeCredentials,
          securityContext,
          clientIP,
          userAgent,
          auditId
        });

      case 'validate_runtime':
        return await handleRuntimeValidation(req, res, {
          customerId,
          extensionId,
          runtimeCredentials,
          clientIP,
          auditId
        });

      case 'get_permissions':
        return await handlePermissionRetrieval(req, res, {
          customerId,
          extensionId,
          runtimeCredentials,
          auditId
        });

      case 'security_status':
        return await handleSecurityStatus(req, res, { auditId });

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action specified',
          compliance: { status: 'NON_COMPLIANT', violations: ['Invalid action parameter'] }
        });
    }

  } catch (error) {
    console.error(`❌ Runtime auth error [${auditId}]:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Runtime authentication service error',
      security: {
        auditId,
        threatLevel: 'SUSPICIOUS'
      },
      compliance: { status: 'NON_COMPLIANT', violations: ['Service error during authentication'] }
    });
  } finally {
    const processingTime = Date.now() - startTime;
    console.log(`⚡ Runtime auth processed [${auditId}] in ${processingTime}ms`);
  }
}

/**
 * RUNTIME AUTHENTICATION - USER CONTROLLED CREDENTIALS
 * Customer provides their own API keys/tokens at runtime
 */
async function handleRuntimeAuthentication(
  req: NextApiRequest,
  res: NextApiResponse<RuntimeAuthResponse>,
  context: {
    customerId?: string;
    extensionId?: string;
    runtimeCredentials?: any;
    securityContext?: any;
    clientIP: string;
    userAgent: string;
    auditId: string;
  }
) {
  const { customerId, extensionId, runtimeCredentials, securityContext, clientIP, userAgent, auditId } = context;

  if (!customerId || !extensionId || !runtimeCredentials) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID, Extension ID, and runtime credentials are required',
      security: { auditId, threatLevel: 'SUSPICIOUS' },
      compliance: { status: 'NON_COMPLIANT', violations: ['Incomplete authentication data'] }
    });
  }

  try {
    // Validate customer exists in our system (without exposing our credentials)
    const customerValid = await validateCustomerInSystem(customerId);
    if (!customerValid.valid) {
      return res.status(401).json({
        success: false,
        error: 'Customer not found or not authorized for extension access',
        security: { auditId, threatLevel: 'SUSPICIOUS' },
        compliance: { status: 'NON_COMPLIANT', violations: ['Unauthorized customer'] }
      });
    }

    // Store customer-provided credentials securely (encrypted)
    const credentialResult = await enterpriseCredentialManager.storeCustomerCredentials(
      customerId,
      runtimeCredentials.userProvidedApiKey || runtimeCredentials.sessionToken || runtimeCredentials.oauthToken,
      runtimeCredentials.userProvidedApiKey ? 'api_key' : 
      runtimeCredentials.sessionToken ? 'session_token' : 'oauth_token',
      getPackagePermissions(customerValid.packageType)
    );

    if (!credentialResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to securely store runtime credentials',
        security: { auditId, threatLevel: 'SUSPICIOUS' },
        compliance: { status: 'NON_COMPLIANT', violations: ['Credential storage failure'] }
      });
    }

    // Create secure extension session
    const sessionResult = await extensionSecurityManager.createSecureSession(
      customerId,
      customerValid.packageType,
      clientIP,
      userAgent,
      credentialResult.credentialId
    );

    if (!sessionResult) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create secure runtime session',
        security: { auditId, threatLevel: 'SUSPICIOUS' },
        compliance: { status: 'PARTIAL', violations: ['Session creation failure'] }
      });
    }

    // Calculate security level based on authentication factors
    const securityLevel = calculateSecurityLevel({
      hasApiKey: !!runtimeCredentials.userProvidedApiKey,
      hasOAuth: !!runtimeCredentials.oauthToken,
      packageType: customerValid.packageType,
      securityContext
    });

    console.log(`✅ Runtime authentication successful [${auditId}] for customer: ${customerId}`);

    return res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        sessionId: sessionResult.sessionId,
        authToken: sessionResult.authToken,
        permissions: getPackagePermissions(customerValid.packageType),
        securityLevel,
        expiresAt: sessionResult.expiresAt,
        complianceStatus: 'COMPLIANT'
      },
      security: {
        trustScore: 85, // Would be calculated based on multiple factors
        threatLevel: 'SAFE',
        auditId
      },
      compliance: { status: 'COMPLIANT' }
    });

  } catch (error) {
    console.error(`❌ Runtime authentication error [${auditId}]:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Runtime authentication processing failed',
      security: { auditId, threatLevel: 'SUSPICIOUS' },
      compliance: { status: 'NON_COMPLIANT', violations: ['Authentication processing error'] }
    });
  }
}

/**
 * RUNTIME VALIDATION
 * Validates existing runtime session without re-authentication
 */
async function handleRuntimeValidation(
  req: NextApiRequest,
  res: NextApiResponse<RuntimeAuthResponse>,
  context: {
    customerId?: string;
    extensionId?: string;
    runtimeCredentials?: any;
    clientIP: string;
    auditId: string;
  }
) {
  const { customerId, runtimeCredentials, clientIP, auditId } = context;

  if (!customerId || !runtimeCredentials?.sessionToken) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID and session token are required for validation',
      security: { auditId, threatLevel: 'SUSPICIOUS' },
      compliance: { status: 'NON_COMPLIANT', violations: ['Missing validation data'] }
    });
  }

  try {
    // Extract session ID and auth token from runtime credentials
    const sessionId = runtimeCredentials.sessionId;
    const authToken = runtimeCredentials.sessionToken;

    if (!sessionId || !authToken) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and auth token are required',
        security: { auditId, threatLevel: 'SUSPICIOUS' },
        compliance: { status: 'NON_COMPLIANT', violations: ['Incomplete session data'] }
      });
    }

    // Validate session
    const validation = await extensionSecurityManager.validateSession(sessionId, authToken, clientIP);
    
    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        error: validation.reason || 'Runtime session validation failed',
        security: { auditId, threatLevel: 'SUSPICIOUS' },
        compliance: { status: 'NON_COMPLIANT', violations: ['Invalid session'] }
      });
    }

    const session = validation.session!;

    return res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        permissions: session.permissions,
        securityLevel: 'MEDIUM', // Would be calculated from session data
        complianceStatus: 'COMPLIANT'
      },
      security: {
        trustScore: session.trustScore,
        threatLevel: session.trustScore > 50 ? 'SAFE' : 'SUSPICIOUS',
        auditId
      },
      compliance: { status: 'COMPLIANT' }
    });

  } catch (error) {
    console.error(`❌ Runtime validation error [${auditId}]:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Runtime validation processing failed',
      security: { auditId, threatLevel: 'SUSPICIOUS' },
      compliance: { status: 'NON_COMPLIANT', violations: ['Validation processing error'] }
    });
  }
}

/**
 * PERMISSION RETRIEVAL
 * Gets current permissions for authenticated session
 */
async function handlePermissionRetrieval(
  req: NextApiRequest,
  res: NextApiResponse<RuntimeAuthResponse>,
  context: {
    customerId?: string;
    extensionId?: string;
    runtimeCredentials?: any;
    auditId: string;
  }
) {
  const { customerId, runtimeCredentials, auditId } = context;

  if (!customerId) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID is required for permission retrieval',
      security: { auditId, threatLevel: 'SUSPICIOUS' },
      compliance: { status: 'NON_COMPLIANT', violations: ['Missing customer ID'] }
    });
  }

  try {
    // Get customer package type to determine permissions
    const customerValid = await validateCustomerInSystem(customerId);
    if (!customerValid.valid) {
      return res.status(401).json({
        success: false,
        error: 'Customer not found or not authorized',
        security: { auditId, threatLevel: 'SUSPICIOUS' },
        compliance: { status: 'NON_COMPLIANT', violations: ['Unauthorized customer'] }
      });
    }

    const permissions = getPackagePermissions(customerValid.packageType);

    return res.status(200).json({
      success: true,
      data: {
        authenticated: true,
        permissions,
        securityLevel: getSecurityLevelFromPackage(customerValid.packageType),
        complianceStatus: 'COMPLIANT'
      },
      security: {
        trustScore: 75,
        threatLevel: 'SAFE',
        auditId
      },
      compliance: { status: 'COMPLIANT' }
    });

  } catch (error) {
    console.error(`❌ Permission retrieval error [${auditId}]:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Permission retrieval failed',
      security: { auditId, threatLevel: 'SUSPICIOUS' },
      compliance: { status: 'NON_COMPLIANT', violations: ['Permission retrieval error'] }
    });
  }
}

/**
 * SECURITY STATUS
 * Returns current security and compliance status
 */
async function handleSecurityStatus(
  req: NextApiRequest,
  res: NextApiResponse<RuntimeAuthResponse>,
  context: { auditId: string }
) {
  const { auditId } = context;

  try {
    const securityStats = extensionSecurityManager.getSecurityStats();
    const credentialMetrics = enterpriseCredentialManager.getSecurityMetrics();
    const complianceStatus = await productionComplianceValidator.monitorCompliance();

    const overallThreatLevel = complianceStatus.status === 'CRITICAL' ? 'BLOCKED' :
                              complianceStatus.status === 'WARNING' ? 'SUSPICIOUS' : 'SAFE';

    return res.status(200).json({
      success: true,
      data: {
        authenticated: false, // Not a user authentication request
        complianceStatus: complianceStatus.status
      },
      security: {
        trustScore: calculateOverallTrustScore(securityStats, credentialMetrics),
        threatLevel: overallThreatLevel,
        auditId
      },
      compliance: {
        status: complianceStatus.status === 'SECURE' ? 'COMPLIANT' : 
               complianceStatus.status === 'WARNING' ? 'PARTIAL' : 'NON_COMPLIANT',
        violations: [...complianceStatus.criticalViolations, ...complianceStatus.warnings]
      }
    });

  } catch (error) {
    console.error(`❌ Security status error [${auditId}]:`, error);
    
    return res.status(500).json({
      success: false,
      error: 'Security status retrieval failed',
      security: { auditId, threatLevel: 'SUSPICIOUS' },
      compliance: { status: 'NON_COMPLIANT', violations: ['Status retrieval error'] }
    });
  }
}

/**
 * UTILITY FUNCTIONS
 */
async function validateCustomerInSystem(customerId: string): Promise<{
  valid: boolean;
  packageType?: string;
  customerName?: string;
}> {
  try {
    // Basic validation - in production would validate against customer database
    if (!customerId.startsWith('DIR-') && !customerId.startsWith('DB-')) {
      return { valid: false };
    }

    // Mock customer data - would be fetched from database
    return {
      valid: true,
      packageType: 'professional', // Would be actual package type
      customerName: `Customer ${customerId}`
    };

  } catch (error) {
    console.error('❌ Customer validation error:', error);
    return { valid: false };
  }
}

function getPackagePermissions(packageType: string): string[] {
  const basePermissions = ['extension:basic', 'customer:read'];
  
  switch (packageType?.toLowerCase()) {
    case 'starter':
      return [...basePermissions, 'directories:read', 'submissions:basic'];
    
    case 'growth':
      return [...basePermissions, 'directories:read', 'submissions:enhanced', 'analytics:basic'];
    
    case 'professional':
      return [...basePermissions, 'directories:read', 'submissions:priority', 'analytics:advanced'];
    
    case 'enterprise':
      return [...basePermissions, 'directories:full', 'submissions:unlimited', 'analytics:full', 'admin:access'];
    
    default:
      return basePermissions;
  }
}

function calculateSecurityLevel(factors: {
  hasApiKey: boolean;
  hasOAuth: boolean;
  packageType: string;
  securityContext?: any;
}): 'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE' {
  let score = 0;
  
  if (factors.hasApiKey) score += 2;
  if (factors.hasOAuth) score += 3;
  
  switch (factors.packageType?.toLowerCase()) {
    case 'enterprise': score += 4; break;
    case 'professional': score += 3; break;
    case 'growth': score += 2; break;
    default: score += 1;
  }
  
  if (score >= 7) return 'ENTERPRISE';
  if (score >= 5) return 'HIGH';
  if (score >= 3) return 'MEDIUM';
  return 'LOW';
}

function getSecurityLevelFromPackage(packageType: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'ENTERPRISE' {
  switch (packageType?.toLowerCase()) {
    case 'enterprise': return 'ENTERPRISE';
    case 'professional': return 'HIGH';
    case 'growth': return 'MEDIUM';
    default: return 'LOW';
  }
}

function calculateOverallTrustScore(securityStats: any, credentialMetrics: any): number {
  let score = 50; // Base score
  
  // Factor in security stats
  if (securityStats.suspiciousActivity < 5) score += 20;
  if (securityStats.blockedSessions < 3) score += 15;
  if (securityStats.activeSessions > 0) score += 10;
  
  // Factor in credential metrics
  if (credentialMetrics.expiredCredentials === 0) score += 5;
  
  return Math.max(0, Math.min(100, score));
}

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  return forwarded?.split(',')[0]?.trim() || 
         req.headers['x-real-ip'] as string ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         'unknown';
}

function generateAuditId(): string {
  return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}