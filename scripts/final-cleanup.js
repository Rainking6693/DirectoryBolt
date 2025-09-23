// Final cleanup - remove remaining fake customer
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

(async () => {
  console.log('🔍 Removing remaining fake customer...');
  
  // Remove the suspicious customer
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('customer_id', 'DIR-20250922-OKPYR6');
    
  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('✅ Removed remaining fake customer DIR-20250922-OKPYR6');
  }
  
  // Verify final count
  const { data } = await supabase.from('customers').select('id', { count: 'exact' });
  console.log(`📊 Final customer count: ${data?.length || 0}`);
})();