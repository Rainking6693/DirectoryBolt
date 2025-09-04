// 🔒 JORDAN'S STRIPE WEBHOOK - Secure payment processing with idempotency
// POST /api/payments/webhook - Handle Stripe webhook events for payment processing

import type { NextApiRequest, NextApiResponse } from 'next'
import { handleApiError, ExternalServiceError } from '../../../lib/utils/errors'
import { verifyWebhookSignature, handleStripeError } from '../../../lib/utils/stripe-client'
import { getStripeConfig } from '../../../lib/utils/stripe-environment-validator'
import { log } from '../../../lib/utils/logger'
import type { Payment, User } from '../../../lib/database/schema'

// Get validated configuration
const config = getStripeConfig()

// Webhook event tracking for idempotency (use Redis in production)
const processedEvents = new Map<string, { timestamp: number; status: 'processed' | 'failed' }>()
const IDEMPOTENCY_WINDOW = 24 * 60 * 60 * 1000 // 24 hours

interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: any
  }
  created: number
}

interface WebhookResponse {
  success: true
  message: string
  event_id: string
  processed: boolean
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WebhookResponse | any>
) {
  const requestId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json(handleApiError(
        new Error('Method not allowed'),
        requestId
      ))
    }
    
    await handleWebhook(req, res, requestId)
    
  } catch (error) {
    const errorResponse = handleApiError(error as Error, requestId)
    console.error('Webhook processing failed:', errorResponse)
    return res.status(errorResponse.error.statusCode).json(errorResponse)
  }
}

async function handleWebhook(
  req: NextApiRequest,
  res: NextApiResponse,
  _requestId: string
) {
  const signature = req.headers['stripe-signature'] as string
  
  if (!signature) {
    throw new ExternalServiceError('Stripe', 'Missing Stripe signature')
  }
  
  // Verify webhook signature
  const event = verifyWebhookSignatureInternal(req.body, signature)
  
  // Check idempotency - prevent duplicate processing
  const existingEvent = processedEvents.get(event.id)
  if (existingEvent && (Date.now() - existingEvent.timestamp) < IDEMPOTENCY_WINDOW) {
    console.log(`⚡ Webhook event ${event.id} already processed, skipping`)
    return res.status(200).json({
      success: true,
      message: 'Event already processed',
      event_id: event.id,
      processed: true
    })
  }
  
  console.log(`⚡ Processing Stripe webhook: ${event.type} (${event.id})`)
  
  try {
    // Process the event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event)
        break
        
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event)
        break
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event)
        break
        
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(event)
        break
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event)
        break
        
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event)
        break
        
      default:
        console.log(`⚠️ Unhandled webhook event type: ${event.type}`)
        break
    }
    
    // Mark event as processed
    processedEvents.set(event.id, { timestamp: Date.now(), status: 'processed' })
    
    const response: WebhookResponse = {
      success: true,
      message: `Event ${event.type} processed successfully`,
      event_id: event.id,
      processed: true
    }
    
    res.status(200).json(response)
    
  } catch (error) {
    console.error(`❌ Failed to process webhook event ${event.id}:`, error)
    
    // Mark event as failed
    processedEvents.set(event.id, { timestamp: Date.now(), status: 'failed' })
    
    // Log webhook processing failure
    await logWebhookFailure(event.id, event.type, error instanceof Error ? error.message : 'Unknown error')
    
    throw error
  }
}

// Webhook signature verification using our enhanced system
function verifyWebhookSignatureInternal(body: any, signature: string): StripeWebhookEvent {
  try {
    // Use our centralized webhook verification
    return verifyWebhookSignature(body, signature) as StripeWebhookEvent
  } catch (error) {
    log.error('Webhook signature verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      hasSignature: !!signature,
      hasWebhookSecret: !!config.webhookSecret
    } as any)
    
    throw new ExternalServiceError('Stripe', 'Webhook signature verification failed')
  }
}

// Event handlers
async function handleCheckoutCompleted(event: StripeWebhookEvent): Promise<void> {
  const session = event.data.object
  const userId = session.metadata?.user_id
  const credits = parseInt(session.metadata?.credits || '0')
  
  if (!userId || !credits) {
    throw new Error('Missing required metadata in checkout session')
  }
  
  console.log(`💰 Checkout completed for user ${userId}: ${credits} credits`)
  
  // Update payment record
  await updatePaymentStatus(session.payment_intent, 'succeeded')
  
  // Add credits to user account
  await addCreditsToUser(userId, credits)
  
  // Send purchase confirmation email
  await sendPurchaseConfirmationEmail(userId, credits)
  
  // Log successful purchase
  await logPurchaseSuccess(userId, credits, session.payment_intent)
}

async function handlePaymentSucceeded(event: StripeWebhookEvent): Promise<void> {
  const paymentIntent = event.data.object
  
  console.log(`✅ Payment succeeded: ${paymentIntent.id}`)
  
  // Update payment record
  await updatePaymentStatus(paymentIntent.id, 'succeeded')
  
  // Additional processing if needed
  const payment = await getPaymentByStripeId(paymentIntent.id)
  if (payment && payment.credits_purchased) {
    await logPaymentProcessed(payment.user_id, payment.credits_purchased, paymentIntent.id)
  }
}

async function handlePaymentFailed(event: StripeWebhookEvent): Promise<void> {
  const paymentIntent = event.data.object
  
  console.log(`❌ Payment failed: ${paymentIntent.id}`)
  
  // Update payment record
  await updatePaymentStatus(paymentIntent.id, 'failed')
  
  // Get user and send failure notification
  const payment = await getPaymentByStripeId(paymentIntent.id)
  if (payment) {
    await sendPaymentFailureEmail(payment.user_id, paymentIntent.last_payment_error?.message)
    await logPaymentFailure(payment.user_id, paymentIntent.id, paymentIntent.last_payment_error?.message)
  }
}

async function handleSubscriptionPayment(event: StripeWebhookEvent): Promise<void> {
  const invoice = event.data.object
  const customerId = invoice.customer
  
  console.log(`💳 Subscription payment succeeded for customer: ${customerId}`)
  
  // Update subscription status
  const user = await getUserByStripeCustomerId(customerId)
  if (user) {
    await updateSubscriptionStatus(user.id, 'active')
    await addSubscriptionCredits(user.id, user.subscription_tier)
    await logSubscriptionPayment(user.id, invoice.amount_paid)
  }
}

async function handleSubscriptionUpdated(event: StripeWebhookEvent): Promise<void> {
  const subscription = event.data.object
  const customerId = subscription.customer
  
  console.log(`🔄 Subscription updated for customer: ${customerId}`)
  
  const user = await getUserByStripeCustomerId(customerId)
  if (user) {
    await updateUserSubscription(user.id, {
      subscription_id: subscription.id,
      subscription_status: subscription.status,
      subscription_tier: getSubscriptionTier(subscription.items?.data[0]?.price?.id)
    })
  }
}

async function handleSubscriptionCancelled(event: StripeWebhookEvent): Promise<void> {
  const subscription = event.data.object
  const customerId = subscription.customer
  
  console.log(`🚫 Subscription cancelled for customer: ${customerId}`)
  
  const user = await getUserByStripeCustomerId(customerId)
  if (user) {
    await updateUserSubscription(user.id, {
      subscription_status: 'cancelled',
      subscription_tier: 'free'
    })
    await sendSubscriptionCancelledEmail(user.id)
  }
}

// Database functions (mock implementations)
async function updatePaymentStatus(paymentIntentId: string, status: 'succeeded' | 'failed'): Promise<void> {
  // TODO: Implement actual database update
  // await db.payments.update({
  //   where: { stripe_payment_intent_id: paymentIntentId },
  //   data: { 
  //     status,
  //     updated_at: new Date()
  //   }
  // })
  
  console.log(`💾 Updated payment ${paymentIntentId} status to: ${status}`)
}

async function addCreditsToUser(userId: string, credits: number): Promise<void> {
  // TODO: Implement actual database update
  // await db.users.update({
  //   where: { id: userId },
  //   data: { 
  //     credits_remaining: { increment: credits },
  //     updated_at: new Date()
  //   }
  // })
  
  console.log(`💎 Added ${credits} credits to user ${userId}`)
}

async function getPaymentByStripeId(stripePaymentIntentId: string): Promise<Payment | null> {
  // TODO: Implement actual database query
  // return await db.payments.findFirst({
  //   where: { stripe_payment_intent_id: stripePaymentIntentId }
  // })
  
  // Mock payment data
  return {
    id: 'pay_mock_123',
    user_id: 'usr_test_123',
    stripe_payment_intent_id: stripePaymentIntentId,
    amount: 4999,
    currency: 'usd',
    status: 'processing',
    description: 'Professional Package',
    credits_purchased: 200,
    payment_method_type: 'card',
    created_at: new Date(),
    updated_at: new Date()
  } as Payment
}

async function getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
  // TODO: Implement actual database query
  // return await db.users.findFirst({
  //   where: { stripe_customer_id: stripeCustomerId }
  // })
  
  // Mock user data
  if (stripeCustomerId === 'cus_mock_123') {
    return {
      id: 'usr_test_123',
      email: 'test@directorybolt.com',
      password_hash: 'hashed',
      full_name: 'Test User',
      company_name: 'Test Company',
      subscription_tier: 'professional',
      credits_remaining: 50,
      is_verified: true,
      failed_login_attempts: 0,
      stripe_customer_id: stripeCustomerId,
      created_at: new Date('2024-01-01'),
      updated_at: new Date(),
      directories_used_this_period: 25,
      directory_limit: 100
    } as User
  }
  
  return null
}

async function updateSubscriptionStatus(userId: string, status: string): Promise<void> {
  // TODO: Implement database update
  console.log(`💾 Updated subscription status for user ${userId}: ${status}`)
}

async function addSubscriptionCredits(userId: string, tier: string): Promise<void> {
  const creditsMap = { free: 0, pro: 100, enterprise: 500 }
  const credits = creditsMap[tier as keyof typeof creditsMap] || 0
  
  if (credits > 0) {
    await addCreditsToUser(userId, credits)
  }
}

async function updateUserSubscription(userId: string, updates: Partial<User>): Promise<void> {
  // TODO: Implement database update
  console.log(`💾 Updated subscription for user ${userId}:`, updates)
}

// Utility functions
function getSubscriptionTier(priceId: string): 'free' | 'starter' | 'growth' | 'professional' | 'enterprise' {
  // Map Stripe price IDs to subscription tiers
  const tierMap: Record<string, 'free' | 'starter' | 'growth' | 'professional' | 'enterprise'> = {
    [process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_monthly']: 'starter',
    [process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth_monthly']: 'growth', 
    [process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_monthly']: 'professional',
    [process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly']: 'enterprise'
  }
  
  return tierMap[priceId] || 'free'
}

// Email notifications (mock implementations)
async function sendPurchaseConfirmationEmail(userId: string, credits: number): Promise<void> {
  console.log(`📧 Purchase confirmation email sent to user ${userId} for ${credits} credits`)
}

async function sendPaymentFailureEmail(userId: string, errorMessage?: string): Promise<void> {
  console.log(`📧 Payment failure email sent to user ${userId}. Error: ${errorMessage}`)
}

async function sendSubscriptionCancelledEmail(userId: string): Promise<void> {
  console.log(`📧 Subscription cancellation email sent to user ${userId}`)
}

// Logging functions
async function logPurchaseSuccess(userId: string, credits: number, paymentIntentId: string): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: 'purchase_success',
    user_id: userId,
    credits_purchased: credits,
    payment_intent_id: paymentIntentId
  }
  
  console.log(`📝 Purchase success:`, logEntry)
}

async function logPaymentProcessed(userId: string, credits: number, paymentIntentId: string): Promise<void> {
  console.log(`📝 Payment processed: User ${userId}, Credits: ${credits}, Payment: ${paymentIntentId}`)
}

async function logPaymentFailure(userId: string, paymentIntentId: string, error?: string): Promise<void> {
  console.log(`📝 Payment failed: User ${userId}, Payment: ${paymentIntentId}, Error: ${error}`)
}

async function logSubscriptionPayment(userId: string, amount: number): Promise<void> {
  console.log(`📝 Subscription payment: User ${userId}, Amount: $${(amount / 100).toFixed(2)}`)
}

async function logWebhookFailure(eventId: string, eventType: string, error: string): Promise<void> {
  console.log(`📝 Webhook failure: Event ${eventId} (${eventType}), Error: ${error}`)
}