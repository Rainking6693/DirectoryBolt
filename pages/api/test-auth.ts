import { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../lib/middleware/auth-middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // If we get here, the user is authenticated
  return res.status(200).json({
    success: true,
    message: 'Authentication successful',
    user: req.user,
    timestamp: new Date().toISOString()
  });
}

// Export with authentication required
export default withAuth(handler);