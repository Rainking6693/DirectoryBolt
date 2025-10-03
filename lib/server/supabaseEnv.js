const REQUIRED_SERVER_MESSAGE = 'Missing Supabase server configuration: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required';
const REQUIRED_PUBLIC_MESSAGE = 'Missing Supabase public configuration: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required';

function getSupabaseServerConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(REQUIRED_SERVER_MESSAGE);
  }

  return {
    url,
    serviceRoleKey,
  };
}

function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(REQUIRED_PUBLIC_MESSAGE);
  }

  return {
    url,
    anonKey,
  };
}

module.exports = {
  getSupabaseServerConfig,
  getSupabasePublicConfig,
};
