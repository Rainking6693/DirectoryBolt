import type { NextApiRequest, NextApiResponse } from 'next';

interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'supervisor' | 'admin';
  permissions: string[];
  active: boolean;
}

function authenticateStaff(req: NextApiRequest): { authenticated: boolean; user?: StaffUser } {
  const authHeader = req.headers.authorization;
  const staffKey = process.env.STAFF_API_KEY;
  const adminKey = process.env.ADMIN_API_KEY;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false };
  }
  
  const token = authHeader.substring(7);
  
  // Check if it's admin key (admin has all staff permissions)
  if (adminKey && token === adminKey) {
    return {
      authenticated: true,
      user: {
        id: 'admin',
        name: 'System Administrator',
        email: 'admin@directorybolt.com',
        role: 'admin',
        permissions: ['all'],
        active: true
      }
    };
  }
  
  // Check if it's staff key
  if (staffKey && token === staffKey) {
    return {
      authenticated: true,
      user: {
        id: 'staff',
        name: 'Staff User',
        email: 'staff@directorybolt.com',
        role: 'staff',
        permissions: ['view_customers', 'process_queue', 'view_analytics'],
        active: true
      }
    };
  }
  
  return { authenticated: false };
}

function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ 
      ok: false, 
      code: 'METHOD_NOT_ALLOWED',
      message: 'Only GET and POST requests are allowed'
    });
  }

  try {
    const authResult = authenticateStaff(req);
    
    if (!authResult.authenticated) {
      return res.status(401).json({
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Staff authentication required',
        authenticated: false
      });
    }

    // For GET requests, return authentication status and user info
    if (req.method === 'GET') {
      return res.status(200).json({
        ok: true,
        authenticated: true,
        user: authResult.user,
        timestamp: new Date().toISOString()
      });
    }

    // For POST requests, validate specific permissions
    if (req.method === 'POST') {
      const { permission } = req.body;
      
      if (!permission) {
        return res.status(400).json({
          ok: false,
          code: 'MISSING_PERMISSION',
          message: 'Permission parameter is required'
        });
      }

      const user = authResult.user!;
      const hasPermission = user.permissions.includes('all') || user.permissions.includes(permission);

      return res.status(200).json({
        ok: true,
        authenticated: true,
        hasPermission,
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        },
        requestedPermission: permission,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    console.error('[staff.auth-check] error', { name: err?.name, message: err?.message });
    
    return res.status(500).json({
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Authentication check failed'
    });
  }
}