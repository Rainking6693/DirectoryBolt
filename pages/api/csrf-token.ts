// 🔒 CSRF TOKEN ENDPOINT
// Provides CSRF tokens for frontend requests

import { NextApiRequest, NextApiResponse } from 'next'
import { handleCSRFTokenRequest } from '../../lib/security/csrf-protection'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleCSRFTokenRequest(req, res)
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1kb',
    },
  },
}