// 🔒 SUBSCRIPTION STATUS API - Check user's current subscription and usage
// GET /api/subscription-status - Retrieve subscription details and usage limits

import Stripe from 'stripe';
import { NextApiRequest, NextApiResponse } from 'next';
import { handleApiError, Errors } from '../../lib/utils/errors';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
});

// Subscription plan limits and features
const SUBSCRIPTION_FEATURES = {
  free: {
    name: 'Free',
    directory_limit: 5,
    monthly_submissions: 5,
    features: ['Basic directory access', 'Manual submissions only'],
    price: 0,
    support_level: 'community'
  },
  starter: {
    name: 'Starter',
    directory_limit: 25,
    monthly_submissions: 25,
    features: ['25 directory submissions', 'Basic analytics', 'Email support'],
    price: 4900,
    support_level: 'email'
  },
  growth: {
    name: 'Growth',
    directory_limit: 50,
    monthly_submissions: 50,
    features: ['50 directory submissions', 'Advanced analytics', 'Priority support', 'Bulk tools'],
    price: 7900,
    support_level: 'priority_email'
  },
  professional: {
    name: 'Professional',
    directory_limit: 100,
    monthly_submissions: 100,
    features: ['100+ submissions', 'Premium analytics', 'Phone & email support', 'API access'],
    price: 12900,
    support_level: 'phone_email'
  },
  enterprise: {
    name: 'Enterprise',
    directory_limit: 500,
    monthly_submissions: 500,
    features: ['500+ submissions', 'Enterprise analytics', 'Dedicated manager', 'White-label'],
    price: 29900,
    support_level: 'dedicated'
  }
};

export default async function handler(req, res) {
  const requestId = `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json(handleApiError(
        new Error('Method not allowed'),
        requestId
      ));
    }

    await handleGetSubscriptionStatus(req, res, requestId);

  } catch (error) {
    console.error('Subscription status error:', error);
    const errorResponse = handleApiError(error, requestId);
    return res.status(errorResponse.error.statusCode || 500).json(errorResponse);
  }
}

async function handleGetSubscriptionStatus(req, res, requestId) {
  const { user_id } = req.query;

  // Validate required parameters
  if (!user_id) {
    throw new Error('User ID is required');
  }

  try {
    // Get user data from database
    const user = await getUserWithSubscription(user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Initialize response data with user's current tier
    const currentTier = user.subscription_tier || 'free';
    const planFeatures = SUBSCRIPTION_FEATURES[currentTier];

    let subscriptionData = {
      user_id: user_id,
      subscription_tier: currentTier,
      subscription_status: user.subscription_status || 'inactive',
      is_active: false,
      is_trial: false,
      plan_features: planFeatures,
      usage: {
        directories_used_this_period: user.directories_used_this_period || 0,
        directories_remaining: Math.max(0, planFeatures.directory_limit - (user.directories_used_this_period || 0)),
        usage_percentage: Math.round(((user.directories_used_this_period || 0) / planFeatures.directory_limit) * 100)
      }
    };

    // If user has a Stripe subscription, get detailed info
    if (user.subscription_id && user.stripe_customer_id) {
      try {
        const [subscription, customer] = await Promise.all([
          stripe.subscriptions.retrieve(user.subscription_id, {
            expand: ['latest_invoice', 'default_payment_method']
          }),
          stripe.customers.retrieve(user.stripe_customer_id)
        ]);

        // Check if subscription is active or in trial
        const isActive = ['active', 'trialing'].includes(subscription.status);
        const isTrial = subscription.status === 'trialing';
        const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null;

        subscriptionData = {
          ...subscriptionData,
          subscription_status: subscription.status,
          is_active: isActive,
          is_trial: isTrial,
          stripe_subscription: {
            id: subscription.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000),
            current_period_end: new Date(subscription.current_period_end * 1000),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
            trial_end: trialEnd,
            days_until_trial_end: trialEnd ? Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
          },
          billing: {
            customer_id: customer.id,
            email: customer.email,
            payment_method: subscription.default_payment_method ? {
              id: subscription.default_payment_method.id,
              type: subscription.default_payment_method.type,
              // Add card details if it's a card
              ...(subscription.default_payment_method.card && {
                last4: subscription.default_payment_method.card.last4,
                brand: subscription.default_payment_method.card.brand,
                exp_month: subscription.default_payment_method.card.exp_month,
                exp_year: subscription.default_payment_method.card.exp_year
              })
            } : null,
            latest_invoice: subscription.latest_invoice ? {
              id: subscription.latest_invoice.id,
              status: subscription.latest_invoice.status,
              amount_due: subscription.latest_invoice.amount_due,
              amount_paid: subscription.latest_invoice.amount_paid,
              currency: subscription.latest_invoice.currency,
              created: new Date(subscription.latest_invoice.created * 1000),
              invoice_pdf: subscription.latest_invoice.invoice_pdf
            } : null
          }
        };

        // Update usage limits based on active subscription
        if (isActive) {
          const subscriptionTier = subscription.metadata?.plan_tier || currentTier;
          const tierFeatures = SUBSCRIPTION_FEATURES[subscriptionTier];
          
          subscriptionData.usage = {
            directories_used_this_period: user.directories_used_this_period || 0,
            directories_remaining: Math.max(0, tierFeatures.directory_limit - (user.directories_used_this_period || 0)),
            usage_percentage: Math.round(((user.directories_used_this_period || 0) / tierFeatures.directory_limit) * 100),
            reset_date: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
          };
        }

      } catch (stripeError) {
        console.warn('Error fetching Stripe subscription details:', stripeError.message);
        // Continue with database-only information
        subscriptionData.stripe_error = 'Unable to fetch current billing information';
      }
    }

    // Add upgrade/downgrade options
    subscriptionData.available_plans = getAvailablePlans(currentTier, subscriptionData.is_active);

    // Add notifications/alerts
    subscriptionData.notifications = getSubscriptionNotifications(subscriptionData);

    // Log successful status check
    console.log(`✅ Subscription status retrieved:`, {
      user_id: user_id,
      tier: currentTier,
      status: subscriptionData.subscription_status,
      is_active: subscriptionData.is_active,
      usage_percentage: subscriptionData.usage.usage_percentage,
      request_id: requestId
    });

    // Return success response
    res.status(200).json({
      success: true,
      data: subscriptionData,
      requestId
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw new Error(`Failed to retrieve subscription status: ${error.message}`);
  }
}

// Get available upgrade/downgrade plans
function getAvailablePlans(currentTier, isActive) {
  const plans = Object.entries(SUBSCRIPTION_FEATURES).map(([tier, features]) => ({
    tier,
    ...features,
    is_current: tier === currentTier,
    is_upgrade: getTierLevel(tier) > getTierLevel(currentTier),
    is_downgrade: getTierLevel(tier) < getTierLevel(currentTier)
  }));

  return plans.filter(plan => plan.tier !== 'free'); // Don't show free plan as an option
}

// Get tier level for comparison
function getTierLevel(tier) {
  const levels = { free: 0, starter: 1, growth: 2, professional: 3, enterprise: 4 };
  return levels[tier] || 0;
}

// Generate subscription notifications
function getSubscriptionNotifications(subscriptionData) {
  const notifications = [];

  // Usage warnings
  if (subscriptionData.usage.usage_percentage >= 90) {
    notifications.push({
      type: 'warning',
      title: 'Usage Limit Almost Reached',
      message: `You've used ${subscriptionData.usage.usage_percentage}% of your directory submissions this period.`,
      action: 'upgrade'
    });
  } else if (subscriptionData.usage.usage_percentage >= 75) {
    notifications.push({
      type: 'info',
      title: 'High Usage Alert',
      message: `You've used ${subscriptionData.usage.usage_percentage}% of your directory submissions.`,
      action: 'monitor'
    });
  }

  // Trial ending soon
  if (subscriptionData.is_trial && subscriptionData.stripe_subscription?.days_until_trial_end <= 3) {
    notifications.push({
      type: 'urgent',
      title: 'Trial Ending Soon',
      message: `Your trial ends in ${subscriptionData.stripe_subscription.days_until_trial_end} day(s).`,
      action: 'add_payment_method'
    });
  }

  // Subscription cancelled
  if (subscriptionData.stripe_subscription?.cancel_at_period_end) {
    notifications.push({
      type: 'warning',
      title: 'Subscription Cancelled',
      message: `Your subscription will end on ${subscriptionData.stripe_subscription.current_period_end?.toLocaleDateString()}.`,
      action: 'reactivate'
    });
  }

  // Past due
  if (subscriptionData.subscription_status === 'past_due') {
    notifications.push({
      type: 'error',
      title: 'Payment Failed',
      message: 'Your payment failed. Please update your payment method to continue service.',
      action: 'update_payment'
    });
  }

  return notifications;
}

// Database helper functions (TODO: Implement with actual database)

async function getUserWithSubscription(userId) {
  // TODO: Implement actual database query with subscription details
  console.log(`🔍 Getting user with subscription: ${userId}`);
  
  // Mock implementation - replace with actual database query
  // return await db.users.findFirst({
  //   where: { id: userId },
  //   include: {
  //     subscription: true,
  //     usage_stats: true
  //   }
  // });
  
  // For development/testing - return mock user with subscription
  return {
    id: userId,
    email: 'test@directorybolt.com',
    subscription_tier: 'professional',
    subscription_status: 'active',
    subscription_id: 'sub_test_123',
    stripe_customer_id: 'cus_test_123',
    directories_used_this_period: 15,
    current_period_start: new Date('2024-01-01'),
    current_period_end: new Date('2024-02-01'),
    trial_ends_at: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date()
  };
}

// Export subscription features for use in other parts of the application
export { SUBSCRIPTION_FEATURES };