import { createClient } from '@supabase/supabase-js'

import type { DirectoryBoltDatabase, DirectoryBoltSupabaseClient } from '../../types/supabase'

export function createSupabaseAdminClient(): DirectoryBoltSupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase admin configuration: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }

  return createClient<DirectoryBoltDatabase, 'public'>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
