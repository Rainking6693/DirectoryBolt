/**
 * Netlify Function: Create Customer
 * POST /netlify/functions/admin/create-customer
 * Creates a new customer and associated job
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Package tier configurations
interface PackageConfig {
  name: string;
  directoryLimit: number;
  packageSize: number;
}

const PACKAGE_TIERS: Record<string, PackageConfig> = {
  starter: { name: 'Starter', directoryLimit: 50, packageSize: 50 },
  growth: { name: 'Growth', directoryLimit: 100, packageSize: 100 },
  professional: { name: 'Professional', directoryLimit: 300, packageSize: 300 },
  enterprise: { name: 'Enterprise', directoryLimit: 500, packageSize: 500 },
};

interface CreateCustomerRequest {
  business_name: string;
  email: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  package_type?: string;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (basic)
 */
function isValidPhone(phone: string): boolean {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  if (!url) return true; // URL is optional
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Main handler
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const body: CreateCustomerRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.business_name || !body.email) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required fields',
          details: 'business_name and email are required',
        }),
      };
    }

    // Validate email format
    if (!isValidEmail(body.email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid email format',
        }),
      };
    }

    // Validate phone format
    if (body.phone && !isValidPhone(body.phone)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid phone format',
        }),
      };
    }

    // Validate website URL
    if (body.website && !isValidUrl(body.website)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid website URL',
        }),
      };
    }

    // Validate package type
    const packageType = body.package_type || 'starter';
    if (!PACKAGE_TIERS[packageType]) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Invalid package type',
          details: `Package type must be one of: ${Object.keys(PACKAGE_TIERS).join(', ')}`,
        }),
      };
    }

    const packageConfig = PACKAGE_TIERS[packageType];

    // Check if customer with this email already exists
    const { data: existingCustomer, error: checkError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('email', body.email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected
      throw checkError;
    }

    if (existingCustomer) {
      return {
        statusCode: 409,
        body: JSON.stringify({
          error: 'Customer already exists',
          details: 'A customer with this email already exists',
        }),
      };
    }

    // Generate a unique customer ID
    const customerId = `DB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Create customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([
        {
          customer_id: customerId,
          business_name: body.business_name,
          email: body.email,
          phone: body.phone || '',
          website: body.website || '',
          address: body.address || '',
          city: body.city || '',
          state: body.state || '',
          zip: body.zip || '',
          status: 'active',
        },
      ])
      .select()
      .single();

    if (customerError) {
      console.error('Error creating customer:', customerError);
      throw new Error(`Failed to create customer: ${customerError.message}`);
    }

    console.log('Created customer:', customer.customer_id);

    // Create job record
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert([
        {
          customer_id: customer.id,
          package_size: packageConfig.packageSize,
          package_type: packageType,
          directory_limit: packageConfig.directoryLimit,
          status: 'pending',
          business_name: body.business_name,
          email: body.email,
          phone: body.phone || '',
          website: body.website || '',
          address: body.address || '',
          city: body.city || '',
          state: body.state || '',
          zip: body.zip || '',
        },
      ])
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      // Rollback customer creation
      await supabase.from('customers').delete().eq('id', customer.id);
      throw new Error(`Failed to create job: ${jobError.message}`);
    }

    console.log('Created job:', job.id);

    // Create directory submissions
    await createDirectorySubmissions(job.id, customer.id, packageConfig.directoryLimit);

    // Return success response
    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        customer: {
          id: customer.id,
          customer_id: customer.customer_id,
          business_name: customer.business_name,
          email: customer.email,
        },
        job: {
          id: job.id,
          package_type: packageType,
          directory_limit: packageConfig.directoryLimit,
          status: job.status,
        },
      }),
    };
  } catch (error) {
    console.error('Error in create-customer function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

/**
 * Create directory submissions for a job
 */
async function createDirectorySubmissions(
  jobId: string,
  customerId: string,
  count: number
): Promise<void> {
  console.log(`Creating ${count} directory submissions for job ${jobId}`);

  // Get the specified number of directories from the directories table
  const { data: directories, error: directoryError } = await supabase
    .from('directories')
    .select('id, name, correct_submission_url')
    .limit(count);

  if (directoryError) {
    throw new Error(`Failed to fetch directories: ${directoryError.message}`);
  }

  if (!directories || directories.length === 0) {
    throw new Error('No directories found');
  }

  // Create submission records for each directory
  const submissions = directories.map((directory) => ({
    job_id: jobId,
    customer_id: customerId,
    directory_name: directory.name,
    directory_url: directory.correct_submission_url,
    status: 'pending',
  }));

  const { error: submissionError } = await supabase
    .from('directory_submissions')
    .insert(submissions);

  if (submissionError) {
    throw new Error(`Failed to create directory submissions: ${submissionError.message}`);
  }

  console.log(`Successfully created ${submissions.length} directory submissions`);
}
