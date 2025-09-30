// @ts-nocheck
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseService } from '../../../lib/services/supabase';

// Legacy endpoint - now redirects to Supabase
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('⚠️ Legacy Google Sheets health check called - redirecting to Supabase');
    
    const supabaseService = createSupabaseService();
    const healthCheck = await supabaseService.healthCheck();
    
    if (!healthCheck) {
      throw new Error('Supabase health check failed');
    }
    
    return res.status(200).json({ 
      ok: true, 
      database: 'supabase',
      legacy: true,
      message: 'This endpoint now uses Supabase instead of Google Sheets'
    });
  } catch (err: any) {
    return res.status(500).json({ 
      ok: false, 
      reason: err?.message || 'unknown',
      legacy: true,
      message: 'This endpoint now uses Supabase instead of Google Sheets'
    });
  }
}