import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerConfig } from './supabaseEnv'

import type { DirectoryBoltDatabase, DirectoryBoltSupabaseClient } from '../../types/supabase'

let cachedClient: DirectoryBoltSupabaseClient | null = null

export function createSupabaseAdminClient(): DirectoryBoltSupabaseClient {
  const { url: supabaseUrl, serviceRoleKey: serviceKey } = getSupabaseServerConfig()

  return createClient<DirectoryBoltDatabase, 'public'>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
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
