// Netlify Function: Stripe Webhook Handler for DirectoryBolt
// POST /netlify/functions/stripe-webhook
// Handles Stripe payment events and automatically creates jobs + submissions

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Package tier configurations
const PACKAGE_TIERS = {
  starter: { name: 'Starter', directoryLimit: 50, packageSize: 50 },
  growth: { name: 'Growth', directoryLimit: 100, packageSize: 100 },
  professional: { name: 'Professional', directoryLimit: 300, packageSize: 300 },
  enterprise: { name: 'Enterprise', directoryLimit: 500, packageSize: 500 }
};

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get the Stripe signature from headers
  const signature = event.headers['stripe-signature'];
  
  if (!signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing Stripe signature' })
    };
  }

  let stripeEvent;
  
  try {
    // Verify the webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid signature' })
    };
  }

  // Handle different event types
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    
    try {
      // Process the successful payment
      await handleSuccessfulPayment(session);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
      };
    } catch (error) {
      console.error('Error processing payment:', error.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to process payment' })
      };
    }
  }

  // Return success for other event types
  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
};

async function handleSuccessfulPayment(session) {
  console.log('Processing successful payment for session:', session.id);
  
  // Extract customer information from session metadata
  const customerInfo = {
    business_name: session.metadata?.business_name || 'Unknown Business',
    email: session.customer_details?.email || session.metadata?.email,
    phone: session.customer_details?.phone || session.metadata?.phone || '',
    website: session.metadata?.website || '',
    address: session.customer_details?.address?.line1 || '',
    city: session.customer_details?.address?.city || '',
    state: session.customer_details?.address?.state || '',
    zip: session.customer_details?.address?.postal_code || '',
    package_type: session.metadata?.package_type || 'starter'
  };

  // Validate package type
  if (!PACKAGE_TIERS[customerInfo.package_type]) {
    throw new Error(`Invalid package type: ${customerInfo.package_type}`);
  }

  const packageConfig = PACKAGE_TIERS[customerInfo.package_type];
  
  // Generate a unique customer ID
  const customerId = `DB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 1. Create customer record in Supabase
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert([
      {
        customer_id: customerId, // This is the text customer_id field
        business_name: customerInfo.business_name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        website: customerInfo.website,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zip
      }
    ])
    .select()
    .single();

  if (customerError) {
    throw new Error(`Failed to create customer: ${customerError.message}`);
  }

  console.log('Created customer:', customer.customer_id);

  // 2. Create job record
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert([
      {
        customer_id: customer.id, // This should be the UUID from the customers table
        package_size: packageConfig.packageSize,
        package_type: customerInfo.package_type,
        directory_limit: packageConfig.directoryLimit,
        status: 'pending',
        business_name: customerInfo.business_name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        website: customerInfo.website,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zip
      }
    ])
    .select()
    .single();

  if (jobError) {
    throw new Error(`Failed to create job: ${jobError.message}`);
  }

  console.log('Created job:', job.id);

  // 3. Create directory submissions
  await createDirectorySubmissions(job.id, customer.id, packageConfig.directoryLimit);

  console.log(`Successfully created ${packageConfig.directoryLimit} directory submissions for job ${job.id}`);
}

async function createDirectorySubmissions(jobId, customerId, count) {
  console.log(`Creating ${count} directory submissions for job ${jobId}`);
  
  // Get the specified number of directories from the directories table
  const { data: directories, error: directoryError } = await supabase
    .from('directories')
    .select('id, name, website')
    .eq('is_active', true)
    .limit(count);

  if (directoryError) {
    throw new Error(`Failed to fetch directories: ${directoryError.message}`);
  }

  if (!directories || directories.length === 0) {
    throw new Error('No active directories found');
  }

  // Create submission records for each directory
  const submissions = directories.map(directory => ({
    submission_queue_id: jobId,
    customer_id: customerId,
    directory_name: directory.name,
    directory_url: directory.website,
    status: 'pending'
  }));

  const { error: submissionError } = await supabase
    .from('directory_submissions')
    .insert(submissions);

  if (submissionError) {
    throw new Error(`Failed to create directory submissions: ${submissionError.message}`);
  }

  console.log(`Successfully created ${submissions.length} directory submissions`);
}

// Export functions for testing
exports.handleSuccessfulPayment = handleSuccessfulPayment;
exports.createDirectorySubmissions = createDirectorySubmissions;