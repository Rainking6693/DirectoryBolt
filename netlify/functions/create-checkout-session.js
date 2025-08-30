const Stripe = require('stripe');

// Initialize Stripe with secret key from environment variables
// This key must be set in your Netlify dashboard: Site Settings > Environment variables
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Plan configuration - maps plan names to amounts (in cents)
const PLANS = {
    starter: {
        name: 'Starter Plan',
        amount: 4900, // $49.00
        description: '50 directory submissions'
    },
    growth: {
        name: 'Growth Plan',
        amount: 8900, // $89.00
        description: '100 directory submissions'
    },
    pro: {
        name: 'Pro Plan',
        amount: 15900, // $159.00
        description: '200 directory submissions'
    }
};

/**
 * Netlify function to create Stripe checkout sessions
 * @param {Object} event - Netlify function event
 * @param {Object} context - Netlify function context
 * @returns {Object} HTTP response
 */
exports.handler = async (event, context) => {
    // Set CORS headers - restrict to specific domain for security
    const allowedOrigin = process.env.URL || process.env.DEPLOY_URL || 'https://directorybolt.com';
    const headers = {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };
    
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                error: 'Method not allowed. Use POST.' 
            })
        };
    }
    
    try {
        // Parse request body
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid JSON in request body'
                })
            };
        }
        
        const { planName, priceId } = body;
        
        // Validate required fields
        if (!planName) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'planName is required'
                })
            };
        }
        
        // Get base URL from environment variables (Netlify provides these automatically)
        const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'https://directorybolt.com';
        
        let sessionConfig = {
            payment_method_types: ['card'],
            mode: 'payment',
            success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/pricing`,
            metadata: {
                plan_name: planName
            }
        };
        
        // List of placeholder price IDs that should trigger ad-hoc pricing
        const PLACEHOLDER_PRICE_IDS = [
            'price_REPLACE_WITH_STARTER_PRICE_ID',
            'price_REPLACE_WITH_GROWTH_PRICE_ID',
            'price_REPLACE_WITH_PRO_PRICE_ID'
        ];
        
        // Configure line items based on whether we're using Price IDs or ad-hoc pricing
        if (priceId && !PLACEHOLDER_PRICE_IDS.includes(priceId)) {
            // Validate price ID format (Stripe price IDs start with 'price_')
            if (!priceId.startsWith('price_') || priceId.length < 20) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: 'Invalid price ID format. Price IDs should start with "price_" and be at least 20 characters long.'
                    })
                };
            }
            
            // Use existing Price ID from Stripe Dashboard
            sessionConfig.line_items = [{
                price: priceId,
                quantity: 1
            }];
        } else {
            // Use ad-hoc pricing (create price on-the-fly)
            const plan = PLANS[planName.toLowerCase()];
            
            if (!plan) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({
                        error: `Invalid plan: ${planName}. Valid plans are: ${Object.keys(PLANS).join(', ')}`
                    })
                };
            }
            
            sessionConfig.line_items = [{
                price_data: {
                    currency: 'usd',
                    unit_amount: plan.amount,
                    product_data: {
                        name: plan.name,
                        description: plan.description
                    }
                },
                quantity: 1
            }];
        }
        
        // Create checkout session
        const session = await stripe.checkout.sessions.create(sessionConfig);
        
        // Log successful session creation (without sensitive data)
        console.log(`Checkout session created for ${planName} plan:`, session.id);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                url: session.url,
                session_id: session.id
            })
        };
        
    } catch (error) {
        console.error('Stripe error:', error);
        
        // Handle specific Stripe errors
        let errorMessage = 'An error occurred while creating checkout session';
        let statusCode = 500;
        
        if (error.type === 'StripeCardError') {
            errorMessage = 'Your card was declined.';
            statusCode = 400;
        } else if (error.type === 'StripeRateLimitError') {
            errorMessage = 'Too many requests made to the API too quickly.';
            statusCode = 429;
        } else if (error.type === 'StripeInvalidRequestError') {
            errorMessage = 'Invalid parameters were supplied to Stripe API.';
            statusCode = 400;
        } else if (error.type === 'StripeAPIError') {
            errorMessage = 'An error occurred internally with Stripe API.';
            statusCode = 500;
        } else if (error.type === 'StripeConnectionError') {
            errorMessage = 'Some kind of error occurred during the HTTPS communication.';
            statusCode = 500;
        } else if (error.type === 'StripeAuthenticationError') {
            errorMessage = 'You probably used an incorrect API key.';
            statusCode = 401;
        }
        
        return {
            statusCode,
            headers,
            body: JSON.stringify({
                error: errorMessage,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
};