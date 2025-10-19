const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'backend/functions/selector-discovery/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('directories').select('name, submission_url').limit(10);
  data.forEach(d => console.log(d.name + ': ' + d.submission_url));
}
check();
