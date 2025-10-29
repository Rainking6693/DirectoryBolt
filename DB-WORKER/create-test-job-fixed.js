require('dotenv').config({ path: '.env.local' || '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createTestJob() {
  console.log('Creating test job with fixed schema assumptions, unique email, valid package_size, and customer_job_id...');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    return;
  }

  try {
    // Insert test customer - assuming customer_id is the primary key, no 'id' column, unique email
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        customer_id: 'TEST-CUSTOMER-004',
        business_name: 'Test Business LLC 4',
        email: 'test4@example.com',
        package_type: 'starter',
        directory_limit: 50,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (customerError) throw customerError;

    console.log('Test customer created:', customer.customer_id);

    // Insert test job - let id be auto-generated uuid, use valid package_size = 50
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        customer_id: customer.customer_id,
        package_size: 50, // Valid value per constraint
        status: 'pending',
        priority_level: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        business_name: 'Test Business LLC 4',
        email: 'test4@example.com',
        description: 'Test business description',
        category: 'Test Category',
        directory_limit: 50,
        package_type: 'starter',
        business_data: {
          business_name: 'Test Business LLC 4',
          email: 'test4@example.com',
          phone: '555-1234',
          website: 'https://test.com',
          address: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          description: 'Test description',
          category: 'Test'
        }
      })
      .select()
      .single();

    if (jobError) throw jobError;

    console.log('Test job created:', job.id);

    // Insert test submissions for the job (only 5 for testing, even though package_size=50)
    const testDirectories = [
      { name: 'test-directory-1.com', url: 'https://example.com/submit1' },
      { name: 'test-directory-2.com', url: 'https://example.com/submit2' },
      { name: 'test-directory-3.com', url: 'https://example.com/submit3' },
      { name: 'test-directory-4.com', url: 'https://example.com/submit4' },
      { name: 'test-directory-5.com', url: 'https://example.com/submit5' }
    ];

    const submissions = testDirectories.map(dir => ({
      customer_job_id: job.customer_id, // Add this to satisfy potential constraints
      directory_url: dir.url,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      submission_queue_id: job.id,
      customer_id: customer.customer_id,
      listing_data: {
        business_name: 'Test Business LLC 4',
        email: 'test4@example.com'
      }
    }));

    const { data: subs, error: subError } = await supabase
      .from('directory_submissions')
      .insert(submissions);

    if (subError) throw subError;

    console.log(`Created ${submissions.length} test submissions for job ${job.id}`);

    // Verify submissions were inserted correctly
    const { data: verifySubs } = await supabase
      .from('directory_submissions')
      .select('id, status, submission_queue_id, customer_job_id')
      .eq('submission_queue_id', job.id)
      .limit(5);

    console.log('Verified submissions:', verifySubs);

    console.log('\nTest setup complete. The poller should now detect and process the job.');
    console.log('Monitor the poller logs for activity.');

  } catch (error) {
    console.error('Error creating test job:', error.message);
    console.error('Full error:', error);
  }
}

createTestJob();