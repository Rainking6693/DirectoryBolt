import type { NextApiRequest, NextApiResponse } from 'next';
import {
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_VALUE,
  STAFF_FALLBACK_USERNAME,
} from '../../../lib/auth/constants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = req.cookies[STAFF_SESSION_COOKIE];

    if (session === STAFF_SESSION_VALUE) {
      return res.status(200).json({
        authenticated: true,
        user: {
          id: 'staff-user',
          username: process.env.STAFF_USERNAME || STAFF_FALLBACK_USERNAME,
          email: 'ben.stone@directorybolt.com',
          first_name: 'Staff',
          last_name: 'User',
          role: 'staff_manager',
          permissions: {
            queue: true,
            processing: true,
            analytics: true,
            support: true,
            customers: true,
          },
        },
      });
    }

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Staff session not found or expired',
    });
  } catch (error) {
    console.error('[staff.auth-check] unexpected error', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication service temporarily unavailable',
    });
  }
}
