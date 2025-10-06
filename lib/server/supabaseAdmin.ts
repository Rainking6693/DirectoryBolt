import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerConfig } from './supabaseEnv'

import type { DirectoryBoltDatabase, DirectoryBoltSupabaseClient } from '../../types/supabase'

let cachedClient: DirectoryBoltSupabaseClient | null = null

export function createSupabaseAdminClient(): DirectoryBoltSupabaseClient {
  console.log('[supabaseAdmin] createSupabaseAdminClient')
  const { url: supabaseUrl, serviceRoleKey: serviceKey } = getSupabaseServerConfig()
  if (!supabaseUrl || !serviceKey) {
    console.error('[supabaseAdmin] missing config', { hasUrl: !!supabaseUrl, hasKey: !!serviceKey })
  } else {
    console.log('[supabaseAdmin] config ok', { urlHost: tryParseHost(supabaseUrl) })
  }

  return createClient<DirectoryBoltDatabase, 'public'>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

function tryParseHost(u?: string) {
  try { const { host } = new URL(u || ''); return host } catch { return undefined }
}

export function getSupabaseAdminClient(): DirectoryBoltSupabaseClient | null {
  if (cachedClient) {
    return cachedClient
  }

  try {
    cachedClient = createSupabaseAdminClient()
    return cachedClient
  } catch (error) {
    console.warn('Supabase admin client unavailable:', error)
    return null
  }
}
