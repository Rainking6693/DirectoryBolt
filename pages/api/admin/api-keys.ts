import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  type: 'admin' | 'staff' | 'readonly';
  created: string;
  lastUsed?: string;
  active: boolean;
}

// In a real implementation, this would be stored in a database
// For now, we'll use environment variables and generate temporary keys
const STORED_KEYS: ApiKey[] = [];

function generateApiKey(): string {
  return 'db_' + crypto.randomBytes(32).toString('hex');
}

function authenticateAdmin(req: NextApiRequest): boolean {
  const authHeader = req.headers.authorization;
  const adminKey = process.env.ADMIN_API_KEY;
  
  if (!adminKey) {
    return false;
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === adminKey;
}

function applyCors(res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Check admin authentication
  if (!authenticateAdmin(req)) {
    return res.status(401).json({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Admin authentication required'
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        return handleGetKeys(req, res);
      case 'POST':
        return handleCreateKey(req, res);
      case 'PUT':
        return handleUpdateKey(req, res);
      case 'DELETE':
        return handleDeleteKey(req, res);
      default:
        res.setHeader('Allow', 'GET, POST, PUT, DELETE, OPTIONS');
        return res.status(405).json({
          ok: false,
          code: 'METHOD_NOT_ALLOWED',
          message: 'Method not allowed'
        });
    }
  } catch (error: unknown) {
    const err = error as { name?: string; message?: string };
    console.error('[admin.api-keys] error', { name: err?.name, message: err?.message });
    
    return res.status(500).json({
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Failed to manage API keys'
    });
  }
}

async function handleGetKeys(req: NextApiRequest, res: NextApiResponse) {
  // Get current environment keys
  const envKeys: ApiKey[] = [];
  
  if (process.env.ADMIN_API_KEY) {
    envKeys.push({
      id: 'env_admin',
      name: 'Environment Admin Key',
      key: process.env.ADMIN_API_KEY.substring(0, 8) + '...',
      type: 'admin',
      created: 'Environment Variable',
      active: true
    });
  }
  
  if (process.env.STAFF_API_KEY) {
    envKeys.push({
      id: 'env_staff',
      name: 'Environment Staff Key',
      key: process.env.STAFF_API_KEY.substring(0, 8) + '...',
      type: 'staff',
      created: 'Environment Variable',
      active: true
    });
  }

  return res.status(200).json({
    ok: true,
    keys: [...envKeys, ...STORED_KEYS.map(key => ({
      ...key,
      key: key.key.substring(0, 8) + '...' // Hide full key
    }))],
    total: envKeys.length + STORED_KEYS.length
  });
}

async function handleCreateKey(req: NextApiRequest, res: NextApiResponse) {
  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      ok: false,
      code: 'MISSING_FIELDS',
      message: 'Name and type are required'
    });
  }

  if (!['admin', 'staff', 'readonly'].includes(type)) {
    return res.status(400).json({
      ok: false,
      code: 'INVALID_TYPE',
      message: 'Type must be admin, staff, or readonly'
    });
  }

  const newKey: ApiKey = {
    id: crypto.randomUUID(),
    name,
    key: generateApiKey(),
    type,
    created: new Date().toISOString(),
    active: true
  };

  STORED_KEYS.push(newKey);

  return res.status(201).json({
    ok: true,
    message: 'API key created successfully',
    key: newKey // Return full key only on creation
  });
}

async function handleUpdateKey(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { name, active } = req.body;

  if (!id) {
    return res.status(400).json({
      ok: false,
      code: 'MISSING_ID',
      message: 'Key ID is required'
    });
  }

  const keyIndex = STORED_KEYS.findIndex(key => key.id === id);
  if (keyIndex === -1) {
    return res.status(404).json({
      ok: false,
      code: 'KEY_NOT_FOUND',
      message: 'API key not found'
    });
  }

  if (name !== undefined) {
    STORED_KEYS[keyIndex].name = name;
  }
  if (active !== undefined) {
    STORED_KEYS[keyIndex].active = active;
  }

  return res.status(200).json({
    ok: true,
    message: 'API key updated successfully',
    key: {
      ...STORED_KEYS[keyIndex],
      key: STORED_KEYS[keyIndex].key.substring(0, 8) + '...'
    }
  });
}

async function handleDeleteKey(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      ok: false,
      code: 'MISSING_ID',
      message: 'Key ID is required'
    });
  }

  const keyIndex = STORED_KEYS.findIndex(key => key.id === id);
  if (keyIndex === -1) {
    return res.status(404).json({
      ok: false,
      code: 'KEY_NOT_FOUND',
      message: 'API key not found'
    });
  }

  STORED_KEYS.splice(keyIndex, 1);

  return res.status(200).json({
    ok: true,
    message: 'API key deleted successfully'
  });
}