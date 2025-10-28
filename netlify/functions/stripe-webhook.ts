/**
 * Netlify Function: Stripe Webhook Handler for DirectoryBolt
 * POST /netlify/functions/stripe-webhook
 * Handles Stripe payment events and automatically creates jobs + submissions
 */

import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  // Use a Stripe API version compatible with installed @types (stripe ^13.x)
  apiVersion: '2023-08-16',
});

// Initialize Resend for email notifications
const resend = new Resend(process.env.RESEND_API_KEY);

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

interface CustomerInfo {
  business_name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  package_type: string;
}

/**
 * Main webhook handler
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

  // Get the Stripe signature from headers
  const signature = event.headers['stripe-signature'];

  if (!signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing Stripe signature' }),
    };
  }

  let stripeEvent: Stripe.Event;

  try {
    // Verify the webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body || '',
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        error: 'Invalid signature',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }

  // Handle different event types
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(stripeEvent.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(stripeEvent.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, type: stripeEvent.type }),
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

/**
 * Handle successful checkout session
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log('Processing checkout session:', session.id);

  // Extract customer information from session metadata
  const customerInfo: CustomerInfo = {
    business_name: session.metadata?.business_name || 'Unknown Business',
    email: session.customer_details?.email || session.metadata?.email || '',
    phone: session.customer_details?.phone || session.metadata?.phone || '',
    website: session.metadata?.website || '',
    address: session.customer_details?.address?.line1 || '',
    city: session.customer_details?.address?.city || '',
    state: session.customer_details?.address?.state || '',
    zip: session.customer_details?.address?.postal_code || '',
    package_type: session.metadata?.package_type || 'starter',
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
        customer_id: customerId,
        business_name: customerInfo.business_name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        website: customerInfo.website,
        address: customerInfo.address,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zip,
        status: 'active',
        stripe_customer_id: session.customer as string,
      },
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
        customer_id: customer.id,
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
        zip: customerInfo.zip,
      },
    ])
    .select()
    .single();

  if (jobError) {
    throw new Error(`Failed to create job: ${jobError.message}`);
  }

  console.log('Created job:', job.id);

  // 3. Create directory submissions
  await createDirectorySubmissions(job.id, customer.id, packageConfig.directoryLimit);

  // 4. Send welcome email
  await sendWelcomeEmail(customerInfo, packageConfig);

  console.log(`Successfully processed checkout for ${customerInfo.business_name}`);
}

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

/**
 * Send welcome email to new customer
 */
async function sendWelcomeEmail(
  customerInfo: CustomerInfo,
  packageConfig: PackageConfig
): Promise<void> {
  try {
    await resend.emails.send({
      from: 'DirectoryBolt <noreply@directorybolt.com>',
      to: customerInfo.email,
      subject: `Welcome to DirectoryBolt - ${packageConfig.name} Package`,
      html: `
        <h1>Welcome to DirectoryBolt!</h1>
        <p>Hi ${customerInfo.business_name},</p>
        <p>Thank you for choosing DirectoryBolt's ${packageConfig.name} package!</p>
        <p>We're now processing your submission to ${packageConfig.directoryLimit} directories.</p>
        <p>You'll receive updates as your submissions are processed.</p>
        <p>Best regards,<br>The DirectoryBolt Team</p>
      `,
    });
    console.log('Welcome email sent to:', customerInfo.email);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    // Don't throw - email failure shouldn't break the webhook
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  console.log('Subscription created:', subscription.id);
  // Update customer record with subscription info
  const { error } = await supabase
    .from('customers')
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
    })
    .eq('stripe_customer_id', subscription.customer as string);

  if (error) {
    console.error('Failed to update customer subscription:', error);
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log('Subscription updated:', subscription.id);
  const { error } = await supabase
    .from('customers')
    .update({
      subscription_status: subscription.status,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription status:', error);
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('Subscription deleted:', subscription.id);
  const { error } = await supabase
    .from('customers')
    .update({
      subscription_status: 'canceled',
      status: 'inactive',
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Failed to update subscription deletion:', error);
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log('Invoice payment succeeded:', invoice.id);
  // Could trigger additional job creation for recurring subscriptions
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('Invoice payment failed:', invoice.id);
  // Could send notification email or update customer status
}
