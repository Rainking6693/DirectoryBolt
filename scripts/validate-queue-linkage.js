require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

(async () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  console.log('--- Latest 10 jobs with customers ---');
  const { data: jobs, error: jobErr } = await supabase
    .from('jobs')
    .select('id, status, customer_id, customer_uuid, customer_name, customer_email, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  if (jobErr) return console.error(jobErr);
  console.table(jobs);

  console.log('\n--- Latest 20 submissions joined with customers and jobs ---');
  const { data: subs, error: subErr } = await supabase
    .from('directory_submissions')
    .select(`
      id,
      status,
      customer_id,
      submission_queue_id,
      directory_url,
      listing_data,
      jobs:submission_queue_id (id, customer_id, customer_uuid, customer_name, customer_email),
      customers:customer_id (id, email, company_name)
    `)
    .order('created_at', { ascending: false })
    .limit(20);
  if (subErr) return console.error(subErr);

  const report = subs.map(s => ({
    submission_id: s.id,
    status: s.status,
    directory_url: s.directory_url,
    sub_customer_uuid: s.customer_id,
    job_id: s.jobs?.id,
    job_customer_uuid: s.jobs?.customer_uuid,
    job_customer_id_legacy: s.jobs?.customer_id,
    cust_email: s.customers?.email,
    cust_company: s.customers?.company_name,
    has_listing_data: !!s.listing_data
  }));
  console.table(report);

  const anomalies = report.filter(r => !r.sub_customer_uuid || !r.job_id || !r.has_listing_data);
  if (anomalies.length) {
    console.log('\n⚠️ Anomalies detected:');
    console.table(anomalies);
  } else {
    console.log('\n✅ No anomalies detected. Linkage looks good.');
  }
})();
