// 🔒 STRIPE WEBHOOK HANDLER - Process subscription events securely
// POST /api/webhooks/stripe - Handle Stripe webhook events for subscriptions

import { log } from '../../../lib/utils/logger';

// Initialize Stripe client and config dynamically to handle configuration errors gracefully
let stripe = null;
let config = null;

function getStripeClientSafe() {
  try {
    const { getStripeClient } = require('../../../lib/utils/stripe-client');
    return getStripeClient();
  } catch (error) {
    return null;
  }
}

function getStripeConfigSafe() {
  try {
    const { getStripeConfig } = require('../../../lib/utils/stripe-environment-validator');
    return getStripeConfig();
  } catch (error) {
    return null;
  }
}

// Disable body parsing for webhook endpoint
export const apiConfig = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const requestId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set JSON content type header
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed', request_id: requestId });
  }

  // Initialize Stripe configuration at request time
  stripe = getStripeClientSafe();
  config = getStripeConfigSafe();
  
  if (!stripe || !config) {
    console.log('Stripe configuration invalid - returning mock webhook response:', {
      request_id: requestId,
      has_stripe_client: !!stripe,
      has_config: !!config
    });
    
    // Return mock response for development when Stripe is not configured
    return res.status(200).json({
      received: true,
      event_type: 'mock_event',
      request_id: requestId,
      development_mode: true,
      note: 'Stripe not configured - mock response returned'
    });
  }

  // Get raw body as buffer for webhook signature verification
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const buf = Buffer.concat(chunks);
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify webhook signature using our enhanced validation
    const { verifyWebhookSignature } = require('../../../lib/utils/stripe-client');
    event = verifyWebhookSignature(buf, sig);
    
    log('info', 'Webhook signature verified', {
      event_type: event.type,
      event_id: event.id,
      request_id: requestId
    });
    
    console.log(`✅ Webhook signature verified: ${event.type}`, { request_id: requestId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log('error', 'Webhook signature verification failed', {
      error: errorMessage,
      request_id: requestId,
      has_signature: !!sig,
      has_webhook_secret: !!config.webhookSecret
    });
    
    console.error(`❌ Webhook signature verification failed:`, errorMessage);
    return res.status(400).json({ 
      error: 'Webhook signature verification failed',
      request_id: requestId 
    });
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, requestId);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, requestId);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, requestId);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, requestId);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, requestId);
        break;
        
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object, requestId);
        break;
        
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, requestId);
        break;
        
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Log successful webhook processing
    console.log(`✅ Webhook processed successfully:`, {
      event_type: event.type,
      event_id: event.id,
      request_id: requestId
    });

    res.status(200).json({ 
      received: true, 
      event_type: event.type,
      request_id: requestId 
    });

  } catch (error) {
    console.error(`❌ Webhook processing error:`, {
      event_type: event.type,
      event_id: event.id,
      error: error.message,
      request_id: requestId
    });

    res.status(500).json({ 
      error: 'Webhook processing failed',
      request_id: requestId 
    });
  }
}

// Handle new subscription creation
async function handleSubscriptionCreated(subscription, requestId) {
  const userId = subscription.metadata.user_id;
  const planTier = subscription.metadata.plan_tier;
  const directoryLimit = parseInt(subscription.metadata.directory_limit);

  console.log(`🎉 New subscription created:`, {
    subscription_id: subscription.id,
    customer_id: subscription.customer,
    user_id: userId,
    plan_tier: planTier,
    directory_limit: directoryLimit,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    request_id: requestId
  });

  // TODO: Update user record in database
  await updateUserSubscription({
    user_id: userId,
    subscription_id: subscription.id,
    customer_id: subscription.customer,
    plan_tier: planTier,
    subscription_status: subscription.status,
    directory_limit: directoryLimit,
    trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000)
  });

  // Reset user's directory submission count for new billing period
  await resetUserDirectoryCount(userId);

  // Send welcome email for new subscription
  await sendSubscriptionWelcomeEmail(userId, planTier);
}

// Handle subscription updates (plan changes, renewals, etc.)
async function handleSubscriptionUpdated(subscription, requestId) {
  const userId = subscription.metadata.user_id;
  const planTier = subscription.metadata.plan_tier;
  const directoryLimit = parseInt(subscription.metadata.directory_limit);

  console.log(`🔄 Subscription updated:`, {
    subscription_id: subscription.id,
    user_id: userId,
    plan_tier: planTier,
    status: subscription.status,
    cancel_at_period_end: subscription.cancel_at_period_end,
    request_id: requestId
  });

  // Update user subscription details
  await updateUserSubscription({
    user_id: userId,
    subscription_id: subscription.id,
    customer_id: subscription.customer,
    plan_tier: planTier,
    subscription_status: subscription.status,
    directory_limit: directoryLimit,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    cancel_at_period_end: subscription.cancel_at_period_end
  });

  // If subscription is being cancelled, send cancellation email
  if (subscription.cancel_at_period_end) {
    await sendSubscriptionCancellationEmail(userId, new Date(subscription.current_period_end * 1000));
  }
}

// Handle subscription deletion/cancellation
async function handleSubscriptionDeleted(subscription, requestId) {
  const userId = subscription.metadata.user_id;

  console.log(`❌ Subscription deleted:`, {
    subscription_id: subscription.id,
    user_id: userId,
    ended_at: new Date(subscription.ended_at * 1000),
    request_id: requestId
  });

  // Downgrade user to free tier
  await updateUserSubscription({
    user_id: userId,
    subscription_id: null,
    customer_id: subscription.customer,
    plan_tier: 'free',
    subscription_status: 'cancelled',
    directory_limit: 5, // Free tier limit
    trial_ends_at: null,
    current_period_start: null,
    current_period_end: null
  });

  // Send subscription ended email
  await sendSubscriptionEndedEmail(userId);
}

// Handle successful payment
async function handlePaymentSucceeded(invoice, requestId) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) return; // Not a subscription payment
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.user_id;

  console.log(`💰 Payment succeeded:`, {
    invoice_id: invoice.id,
    subscription_id: subscriptionId,
    user_id: userId,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    period_start: new Date(invoice.period_start * 1000),
    period_end: new Date(invoice.period_end * 1000),
    request_id: requestId
  });

  // Reset directory submission count for new billing period
  await resetUserDirectoryCount(userId);

  // Update subscription period
  await updateUserSubscriptionPeriod({
    user_id: userId,
    current_period_start: new Date(invoice.period_start * 1000),
    current_period_end: new Date(invoice.period_end * 1000)
  });

  // Send payment confirmation email
  await sendPaymentConfirmationEmail(userId, invoice.amount_paid, invoice.currency);
}

// Handle failed payment
async function handlePaymentFailed(invoice, requestId) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) return; // Not a subscription payment
  
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.user_id;

  console.log(`💸 Payment failed:`, {
    invoice_id: invoice.id,
    subscription_id: subscriptionId,
    user_id: userId,
    amount_due: invoice.amount_due,
    attempt_count: invoice.attempt_count,
    next_payment_attempt: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : null,
    request_id: requestId
  });

  // Update subscription status to past_due
  await updateUserSubscription({
    user_id: userId,
    subscription_status: 'past_due'
  });

  // Send payment failed notification
  await sendPaymentFailedEmail(userId, invoice.amount_due, invoice.currency, invoice.attempt_count);
}

// Handle trial ending soon
async function handleTrialWillEnd(subscription, requestId) {
  const userId = subscription.metadata.user_id;
  const planTier = subscription.metadata.plan_tier;

  console.log(`⏰ Trial ending soon:`, {
    subscription_id: subscription.id,
    user_id: userId,
    plan_tier: planTier,
    trial_end: new Date(subscription.trial_end * 1000),
    request_id: requestId
  });

  // Send trial ending notification
  await sendTrialEndingEmail(userId, new Date(subscription.trial_end * 1000), planTier);
}

// Handle checkout session completion
async function handleCheckoutCompleted(session, requestId) {
  const userId = session.metadata.user_id;
  const planTier = session.metadata.plan_tier;

  console.log(`🎯 Checkout completed:`, {
    session_id: session.id,
    customer_id: session.customer,
    user_id: userId,
    plan_tier: planTier,
    amount_total: session.amount_total,
    mode: session.mode,
    request_id: requestId
  });

  if (session.mode === 'subscription') {
    // Subscription checkout completed
    const subscriptionId = session.subscription;
    
    // Initial subscription setup is handled by subscription.created event
    // This is mainly for tracking and analytics
    
    console.log(`📊 Subscription checkout completed: ${subscriptionId}`);
  }
}

// Database helper functions (TODO: Implement with actual database)

async function updateUserSubscription(data) {
  // TODO: Implement database update
  console.log(`💾 Updating user subscription:`, data);
  
  // Example database update:
  // await db.users.update({
  //   where: { id: data.user_id },
  //   data: {
  //     subscription_id: data.subscription_id,
  //     customer_id: data.customer_id,
  //     subscription_tier: data.plan_tier,
  //     subscription_status: data.subscription_status,
  //     trial_ends_at: data.trial_ends_at,
  //     updated_at: new Date()
  //   }
  // });
}

async function updateUserSubscriptionPeriod(data) {
  // TODO: Implement database update for billing period
  console.log(`💾 Updating subscription period:`, data);
}

async function resetUserDirectoryCount(userId) {
  // TODO: Reset user's directory submission count for new billing period
  console.log(`🔄 Resetting directory count for user: ${userId}`);
  
  // Example:
  // await db.users.update({
  //   where: { id: userId },
  //   data: {
  //     directories_used_this_period: 0,
  //     billing_period_reset_at: new Date()
  //   }
  // });
}

// Email notification functions (TODO: Implement with email service)

async function sendSubscriptionWelcomeEmail(userId, planTier) {
  console.log(`📧 Sending welcome email to user ${userId} for ${planTier} plan`);
  // TODO: Implement email sending
}

async function sendSubscriptionCancellationEmail(userId, endDate) {
  console.log(`📧 Sending cancellation email to user ${userId}, ends ${endDate}`);
  // TODO: Implement email sending
}

async function sendSubscriptionEndedEmail(userId) {
  console.log(`📧 Sending subscription ended email to user ${userId}`);
  // TODO: Implement email sending
}

async function sendPaymentConfirmationEmail(userId, amount, currency) {
  console.log(`📧 Sending payment confirmation to user ${userId}: ${amount} ${currency}`);
  // TODO: Implement email sending
}

async function sendPaymentFailedEmail(userId, amount, currency, attemptCount) {
  console.log(`📧 Sending payment failed email to user ${userId}: ${amount} ${currency}, attempt ${attemptCount}`);
  // TODO: Implement email sending
}

async function sendTrialEndingEmail(userId, trialEndDate, planTier) {
  console.log(`📧 Sending trial ending email to user ${userId}: ${planTier} trial ends ${trialEndDate}`);
  // TODO: Implement email sending
}