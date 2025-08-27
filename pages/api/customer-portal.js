// 🔒 STRIPE CUSTOMER PORTAL - Manage subscriptions securely
// POST /api/customer-portal - Create Stripe customer portal sessions for subscription management

import Stripe from 'stripe';
import { NextApiRequest, NextApiResponse } from 'next';
import { handleApiError, Errors } from '../../lib/utils/errors';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default async function handler(req, res) {
  const requestId = `portal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json(handleApiError(
        new Error('Method not allowed'),
        requestId
      ));
    }

    await handleCreatePortalSession(req, res, requestId);

  } catch (error) {
    console.error('Customer portal creation error:', error);
    const errorResponse = handleApiError(error, requestId);
    return res.status(errorResponse.error.statusCode || 500).json(errorResponse);
  }
}

async function handleCreatePortalSession(req, res, requestId) {
  const { user_id, customer_id, return_url } = req.body;

  // Validate required fields
  if (!user_id) {
    throw new Error('User ID is required');
  }

  let stripeCustomerId = customer_id;

  // If customer_id not provided, look it up by user_id
  if (!stripeCustomerId) {
    // TODO: Get customer_id from database using user_id
    const user = await getUserById(user_id);
    if (!user || !user.stripe_customer_id) {
      throw new Error('No Stripe customer found for this user. Please contact support.');
    }
    stripeCustomerId = user.stripe_customer_id;
  }

  // Validate that customer exists in Stripe
  let customer;
  try {
    customer = await stripe.customers.retrieve(stripeCustomerId);
    if (customer.deleted) {
      throw new Error('Customer has been deleted from Stripe');
    }
  } catch (stripeError) {
    console.error('Error retrieving Stripe customer:', stripeError);
    throw new Error('Unable to verify customer account. Please contact support.');
  }

  try {
    // Create customer portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: return_url || `${process.env.NEXTAUTH_URL}/dashboard`,
      configuration: {
        business_profile: {
          headline: 'Manage your DirectoryBolt subscription',
          privacy_policy_url: `${process.env.NEXTAUTH_URL}/privacy`,
          terms_of_service_url: `${process.env.NEXTAUTH_URL}/terms`
        },
        features: {
          customer_update: {
            allowed_updates: ['email', 'name', 'phone', 'address'],
            enabled: true,
          },
          invoice_history: {
            enabled: true,
          },
          payment_method_update: {
            enabled: true,
          },
          subscription_cancel: {
            enabled: true,
            mode: 'at_period_end',
            proration_behavior: 'none',
            cancellation_reason: {
              enabled: true,
              options: [
                'too_expensive',
                'missing_features',
                'switched_service',
                'unused',
                'customer_service',
                'too_complex',
                'low_quality',
                'other'
              ]
            }
          },
          subscription_pause: {
            enabled: false, // Disable pausing subscriptions for now
          },
          subscription_update: {
            enabled: true,
            default_allowed_updates: ['price'],
            proration_behavior: 'create_prorations'
          }
        }
      }
    });

    // Log successful portal session creation
    console.log(`✅ Customer portal session created:`, {
      session_id: portalSession.id,
      customer_id: stripeCustomerId,
      user_id: user_id,
      return_url: portalSession.return_url,
      created: new Date(portalSession.created * 1000),
      request_id: requestId
    });

    // Update user's last portal access timestamp
    await updateUserLastPortalAccess(user_id);

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        portal_session: {
          id: portalSession.id,
          url: portalSession.url,
          return_url: portalSession.return_url,
          created: new Date(portalSession.created * 1000).toISOString()
        },
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name
        }
      },
      requestId
    });

  } catch (stripeError) {
    console.error('Stripe customer portal error:', stripeError);
    
    // Log portal creation failure
    console.error(`❌ Customer portal creation failed:`, {
      customer_id: stripeCustomerId,
      user_id: user_id,
      error: stripeError.message,
      request_id: requestId,
      stripe_error_code: stripeError.code,
      stripe_error_type: stripeError.type
    });

    // Handle specific Stripe errors
    switch (stripeError.code) {
      case 'resource_missing':
        throw new Error('Customer not found. Please contact support to resolve this issue.');
      case 'customer_portal_configuration_invalid':
        throw new Error('Portal configuration error. Please try again later.');
      default:
        throw new Error(`Unable to access customer portal: ${stripeError.message}`);
    }
  }
}

// Database helper functions (TODO: Implement with actual database)

async function getUserById(userId) {
  // TODO: Implement actual database query
  console.log(`🔍 Looking up user: ${userId}`);
  
  // Mock implementation - replace with actual database query
  // return await db.users.findFirst({
  //   where: { id: userId },
  //   select: {
  //     id: true,
  //     email: true,
  //     stripe_customer_id: true,
  //     subscription_id: true,
  //     subscription_tier: true
  //   }
  // });
  
  // For development/testing - return mock user
  return {
    id: userId,
    email: 'test@directorybolt.com',
    stripe_customer_id: 'cus_test_123',
    subscription_id: 'sub_test_123',
    subscription_tier: 'professional'
  };
}

async function updateUserLastPortalAccess(userId) {
  // TODO: Update user's last portal access timestamp
  console.log(`💾 Updating last portal access for user: ${userId}`);
  
  // Example database update:
  // await db.users.update({
  //   where: { id: userId },
  //   data: {
  //     last_portal_access_at: new Date(),
  //     updated_at: new Date()
  //   }
  // });
}

// Utility function to check if user can access customer portal
export async function canAccessCustomerPortal(userId) {
  try {
    const user = await getUserById(userId);
    return !!(user && user.stripe_customer_id);
  } catch (error) {
    console.error('Error checking portal access:', error);
    return false;
  }
}

// Utility function to get customer portal configuration
export function getPortalConfiguration() {
  return {
    business_profile: {
      headline: 'Manage your DirectoryBolt subscription',
      privacy_policy_url: `${process.env.NEXTAUTH_URL}/privacy`,
      terms_of_service_url: `${process.env.NEXTAUTH_URL}/terms`
    },
    features: {
      customer_update: {
        allowed_updates: ['email', 'name', 'phone', 'address'],
        enabled: true,
      },
      invoice_history: {
        enabled: true,
      },
      payment_method_update: {
        enabled: true,
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        proration_behavior: 'none'
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        proration_behavior: 'create_prorations'
      }
    }
  };
}