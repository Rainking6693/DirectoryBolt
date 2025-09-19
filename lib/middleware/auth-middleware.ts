/**
 * Authentication Middleware for DirectoryBolt
 * Provides role-based access control and customer validation
 */

import { NextApiRequest, NextApiResponse } from 'next';
const { createSupabaseService } = require('../services/supabase.js');

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    customerId: string;
    businessName: string;
    email: string;
    packageType: string;
    status: string;
    permissions: string[];
  };
}

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

/**
 * Main authentication middleware
 */
export async function authenticateCustomer(req: AuthenticatedRequest, res: NextApiResponse): Promise<AuthResult> {
  try {
    // Extract authentication data from request (body, query params, or headers)
    const authHeader = req.headers.authorization;
    const { customerId: bodyCustomerId, email: bodyEmail } = req.body || {};
    const { customerId: queryCustomerId, email: queryEmail } = req.query || {};
    
    const customerId = bodyCustomerId || queryCustomerId;
    const email = bodyEmail || queryEmail;
    
    let customerToAuth = null;
    
    // Try different authentication methods
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract customer ID from Bearer token (simplified)
      const token = authHeader.substring(7);
      customerToAuth = extractCustomerIdFromToken(token);
    } else if (customerId) {
      customerToAuth = customerId;
    } else if (email) {
      // For email-based auth, we'll look up the customer ID
      customerToAuth = await getCustomerIdByEmail(email);
    }
    
    if (!customerToAuth) {
      return { success: false, error: 'No authentication credentials provided' };
    }
    
    // Authenticate the customer using Supabase
    const supabaseService = createSupabaseService();
    const result = await supabaseService.getCustomerById(customerToAuth);
    
    if (!result.found || !result.customer) {
      return { success: false, error: 'Customer not found or invalid credentials' };
    }
    
    const customer = result.customer;
    
    // Check if customer account is active
    if (customer.status !== 'active' && customer.status !== 'in-progress') {
      return { success: false, error: `Account status: ${customer.status}. Contact support if this is incorrect.` };
    }
    
    // Get permissions based on package type
    const permissions = getPackagePermissions(customer.packageType);
    
    // Attach user data to request
    req.user = {
      customerId: customer.customerId,
      businessName: customer.businessName || `${customer.firstName} ${customer.lastName}`.trim(),
      email: customer.email,
      packageType: customer.packageType,
      status: customer.status,
      permissions
    };
    
    return {
      success: true,
      user: req.user
    };
    
  } catch (error) {
    console.error('❌ Authentication middleware error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

/**
 * Role-based access control middleware
 */
export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, res: NextApiResponse, next: Function) => {
    // First authenticate the user
    const authResult = await authenticateCustomer(req, res);
    
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error || 'Authentication required' });
    }
    
    // Check if user has required permission
    if (!req.user?.permissions.includes(permission)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions', 
        required: permission,
        userPermissions: req.user?.permissions 
      });
    }
    
    // User is authenticated and has permission
    next();
  };
}

/**
 * Package-based permissions system
 */
export function getPackagePermissions(packageType: string): string[] {
  const basePermissions = ['read:directories', 'validate:customer', 'view:dashboard'];
  
  switch (packageType?.toLowerCase()) {
    case 'starter':
      return [...basePermissions, 'submit:basic'];
      
    case 'growth':
      return [...basePermissions, 'submit:basic', 'submit:enhanced', 'analytics:basic'];
      
    case 'professional':
    case 'pro':
      return [...basePermissions, 'submit:basic', 'submit:enhanced', 'submit:priority', 'analytics:advanced', 'support:priority'];
      
    case 'enterprise':
      return [...basePermissions, 'submit:basic', 'submit:enhanced', 'submit:priority', 'analytics:advanced', 'support:priority', 'admin:access', 'bulk:operations'];
      
    default:
      return basePermissions;
  }
}

/**
 * Extract customer ID from JWT token (simplified implementation)
 */
function extractCustomerIdFromToken(token: string): string | null {
  try {
    // For now, treat token as direct customer ID
    // In production, you'd decode and validate a proper JWT
    if (token.startsWith('DIR-') || token.startsWith('DB-')) {
      return token;
    }
    
    // Try to decode base64 token
    const decoded = Buffer.from(token, 'base64').toString('ascii');
    if (decoded.startsWith('DIR-') || decoded.startsWith('DB-')) {
      return decoded;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get customer ID by email lookup
 */
async function getCustomerIdByEmail(email: string): Promise<string | null> {
  try {
    const supabaseService = createSupabaseService();
    
    if (!supabaseService.client) {
      await supabaseService.initialize();
    }
    
    const { data, error } = await supabaseService.client
      .from('customers')
      .select('customer_id')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.customer_id;
  } catch (error) {
    console.error('Error looking up customer by email:', error);
    return null;
  }
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withAuth(handler: Function, requiredPermission?: string) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      // Authenticate the user
      const authResult = await authenticateCustomer(req, res);
      
      if (!authResult.success) {
        return res.status(401).json({ error: authResult.error || 'Authentication required' });
      }
      
      // Check permission if required
      if (requiredPermission && !req.user?.permissions.includes(requiredPermission)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: requiredPermission,
          userPermissions: req.user?.permissions 
        });
      }
      
      // Call the original handler
      return handler(req, res);
      
    } catch (error) {
      console.error('❌ Auth wrapper error:', error);
      return res.status(500).json({ error: 'Authentication system error' });
    }
  };
}

/**
 * Customer validation for extension API calls
 */
export async function validateCustomerForExtension(customerId: string): Promise<{
  valid: boolean;
  customer?: any;
  error?: string;
}> {
  try {
    const supabaseService = createSupabaseService();
    const result = await supabaseService.getCustomerById(customerId);
    
    if (!result.found || !result.customer) {
      return { valid: false, error: 'Customer not found' };
    }
    
    const customer = result.customer;
    
    // Check if customer can use extension
    if (customer.status !== 'active' && customer.status !== 'in-progress') {
      return { valid: false, error: `Account inactive: ${customer.status}` };
    }
    
    return {
      valid: true,
      customer: {
        customerId: customer.customerId,
        businessName: customer.businessName || `${customer.firstName} ${customer.lastName}`.trim(),
        packageType: customer.packageType,
        permissions: getPackagePermissions(customer.packageType)
      }
    };
    
  } catch (error) {
    console.error('❌ Extension validation error:', error);
    return { valid: false, error: 'Validation failed' };
  }
}

/**
 * Rate limiting by customer tier
 */
export function getRateLimit(packageType: string): { requests: number; window: number } {
  switch (packageType?.toLowerCase()) {
    case 'starter':
      return { requests: 100, window: 3600 }; // 100 requests per hour
      
    case 'growth':
      return { requests: 500, window: 3600 }; // 500 requests per hour
      
    case 'professional':
    case 'pro':
      return { requests: 1000, window: 3600 }; // 1000 requests per hour
      
    case 'enterprise':
      return { requests: 5000, window: 3600 }; // 5000 requests per hour
      
    default:
      return { requests: 50, window: 3600 }; // 50 requests per hour for unknown packages
  }
}