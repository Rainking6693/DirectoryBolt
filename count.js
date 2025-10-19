const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/functions/selector-discovery/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function count() {
  const { count } = await supabase.from('directories').select('*', { count: 'exact', head: true });
  console.log('Total directories:', count);
}
count();
