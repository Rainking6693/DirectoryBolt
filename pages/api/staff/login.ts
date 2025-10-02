import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';
import {
  STAFF_FALLBACK_PASSWORD,
  STAFF_FALLBACK_USERNAME,
  STAFF_SESSION_COOKIE,
  STAFF_SESSION_VALUE,
} from '../../../lib/auth/constants';

interface StaffLoginResponse {
  success: boolean;
  sessionToken?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    permissions: Record<string, boolean>;
  };
  error?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<StaffLoginResponse>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { username, password } = (req.body || {}) as {
      username?: string;
      password?: string;
    };

    const validUsername = process.env.STAFF_USERNAME || STAFF_FALLBACK_USERNAME;
    const validPassword = process.env.STAFF_PASSWORD || STAFF_FALLBACK_PASSWORD;

    if (!username || !password || username !== validUsername || password !== validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Username or password is incorrect',
      });
    }

    const user = {
      id: 'staff-user',
      username: validUsername,
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
    };

    const cookie = serialize(STAFF_SESSION_COOKIE, STAFF_SESSION_VALUE, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    res.setHeader('Set-Cookie', cookie);

    return res.status(200).json({
      success: true,
      sessionToken: STAFF_SESSION_VALUE,
      user,
    });
  } catch (error) {
    console.error('[staff.login] unexpected error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Authentication service temporarily unavailable',
    });
  }
}
