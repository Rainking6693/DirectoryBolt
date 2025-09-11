import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // SECURITY FIX: Implement proper staff authentication
  console.log('🔐 Staff auth check requested from IP:', req.headers['x-forwarded-for'] || req.socket.remoteAddress)
  
  // Check for staff API key in headers
  const staffKey = req.headers['x-staff-key'] || req.headers['authorization']
  const validStaffKey = process.env.STAFF_API_KEY || 'DirectoryBolt-Staff-2025-SecureKey'
  
  if (staffKey === validStaffKey || staffKey === `Bearer ${validStaffKey}`) {
    console.log('✅ Staff authenticated via API key')
    return res.status(200).json({ 
      authenticated: true, 
      user: { role: 'staff', method: 'api_key' }
    })
  }

  // Check for staff session/cookie
  const staffSession = req.cookies['staff-session']
  const validStaffSession = process.env.STAFF_SESSION_TOKEN || 'DirectoryBolt-Staff-Session-2025'
  
  if (staffSession === validStaffSession) {
    console.log('✅ Staff authenticated via session')
    return res.status(200).json({ 
      authenticated: true, 
      user: { role: 'staff', method: 'session' }
    })
  }

  // Check for basic auth credentials
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Basic ')) {
    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString()
    const [username, password] = credentials.split(':')
    
    const validUsername = process.env.STAFF_USERNAME || 'staff'
    const validPassword = process.env.STAFF_PASSWORD || 'DirectoryBoltStaff2025!'
    
    if (username === validUsername && password === validPassword) {
      console.log('✅ Staff authenticated via basic auth')
      return res.status(200).json({ 
        authenticated: true, 
        user: { role: 'staff', email: 'staff@directorybolt.com', method: 'basic_auth' }
      })
    }
  }

  // SECURITY FIX: Development bypass REMOVED for production security
  // All authentication must go through proper channels

  // No valid staff authentication found
  console.log('❌ Staff authentication failed - no valid credentials')
  return res.status(401).json({ 
    error: 'Unauthorized', 
    message: 'Staff authentication required',
    methods: ['API Key (x-staff-key header)', 'Session Cookie (staff-session)', 'Basic Auth']
  })
}