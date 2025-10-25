require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestJob() {
  console.log('Creating test job...');
  
  // Get an existing customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('customer_id, business_name, email')
    .limit(1)
    .single();
  
  if (customerError) {
    console.error('Error fetching customer:', customerError.message);
    return;
  }
  
  console.log('Using customer:', customer.customer_id);
  
  // Sample business data
  const businessData = {
    business_name: customer.business_name || 'Test Business',
    email: customer.email || 'test@example.com',
    phone: '555-123-4567',
    website: 'https://example.com',
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
    description: 'A test business for DirectoryBolt',
    category: 'Technology'
  };
  
  // Check if there's already a pending job for this customer
  const { data: existingJob, error: existingJobError } = await supabase
    .from('jobs')
    .select('id, status')
    .eq('customer_id', customer.customer_id)
    .limit(1)
    .single();
  
  let jobId;
  
  if (existingJob && existingJobError === null) {
    // If there's an existing job, reset its status to pending and update business data
    jobId = existingJob.id;
    console.log('Found existing job:', jobId);
    
    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'pending',
        error_message: null,
        started_at: null,
        completed_at: null,
        business_name: businessData.business_name,
        email: businessData.email,
        phone: businessData.phone,
        website: businessData.website,
        address: businessData.address,
        city: businessData.city,
        state: businessData.state,
        zip: businessData.zip,
        description: businessData.description,
        category: businessData.category,
        business_data: businessData,
        customer_name: businessData.business_name,
        customer_email: businessData.email,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    if (updateError) {
      console.error('Error updating existing job:', updateError.message);
      return;
    }
    
    // Reset all submissions for this job to pending
    const { error: resetSubmissionsError } = await supabase
      .from('directory_submissions')
      .update({
        status: 'pending',
        result_message: null,
        listing_data: null,
        updated_at: new Date().toISOString()
      })
      .eq('submission_queue_id', jobId);
    
    if (resetSubmissionsError) {
      console.error('Error resetting submissions:', resetSubmissionsError.message);
      return;
    }
    
    console.log('Reset existing job and submissions to pending with business data');
  } else {
    // Create a new job for this customer
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        customer_id: customer.customer_id,
        package_size: 50,
        priority_level: 3,
        status: 'pending',
        business_name: businessData.business_name,
        email: businessData.email,
        phone: businessData.phone,
        website: businessData.website,
        address: businessData.address,
        city: businessData.city,
        state: businessData.state,
        zip: businessData.zip,
        description: businessData.description,
        category: businessData.category,
        business_data: businessData,
        customer_name: businessData.business_name,
        customer_email: businessData.email,
        metadata: {
          businessName: businessData.business_name,
          email: businessData.email,
          phone: businessData.phone,
          website: businessData.website,
          address: businessData.address,
          city: businessData.city,
          state: businessData.state,
          zip: businessData.zip,
          package_size: 50
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (jobError) {
      console.error('Error creating job:', jobError.message);
      return;
    }
    
    jobId = job.id;
    console.log('Created new job:', jobId);
    
    // Create some test directory submissions for this job
    const testDirectories = [
      { url: 'https://yelp.com', name: 'Yelp' },
      { url: 'https://google.com', name: 'Google' },
      { url: 'https://facebook.com', name: 'Facebook' }
    ];
    
    for (const dir of testDirectories) {
      const { data: submission, error: submissionError } = await supabase
        .from('directory_submissions')
        .insert({
          submission_queue_id: jobId,
          customer_id: customer.customer_id,
          directory_url: dir.url,
          directory_name: dir.name,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (submissionError) {
        console.error(`Error creating submission for ${dir.name}:`, submissionError.message);
      } else {
        console.log(`Created submission for ${dir.name}:`, submission.id);
      }
    }
  }
  
  console.log('Test job is ready and set to pending status!');
  console.log('Job ID:', jobId);
  console.log('Business data:', JSON.stringify(businessData, null, 2));
}

createTestJob().catch(console.error);