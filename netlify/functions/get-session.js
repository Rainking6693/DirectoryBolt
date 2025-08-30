const Stripe = require('stripe');

// Initialize Stripe with secret key from environment variables
// This key must be set in your Netlify dashboard: Site Settings > Environment variables
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Netlify function to retrieve Stripe checkout session details
 * @param {Object} event - Netlify function event
 * @param {Object} context - Netlify function context
 * @returns {Object} HTTP response with session data
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
        
        const { session_id } = body;
        
        // Validate session ID
        if (!session_id) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'session_id is required'
                })
            };
        }
        
        // Basic session ID format validation (Stripe session IDs start with 'cs_')
        if (!session_id.startsWith('cs_')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    error: 'Invalid session ID format'
                })
            };
        }
        
        // Retrieve checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['customer', 'line_items', 'line_items.data.price.product']
        });
        
        // Validate session exists and is in correct state
        if (!session) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({
                    error: 'Session not found'
                })
            };
        }
        
        // Extract plan name from metadata or line items
        let planName = 'Unknown Plan';
        if (session.metadata && session.metadata.plan_name) {
            planName = session.metadata.plan_name;
        } else if (session.line_items && session.line_items.data.length > 0) {
            const productName = session.line_items.data[0].price.product.name;
            planName = productName || 'Unknown Plan';
        }
        
        // Prepare sanitized response data (no sensitive information)
        const responseData = {
            id: session.id,
            status: session.status,
            payment_status: session.payment_status,
            customer_email: session.customer_details ? session.customer_details.email : null,
            amount_total: session.amount_total,
            currency: session.currency,
            planName: planName,
            created: session.created,
            metadata: session.metadata
        };
        
        // Add line item details if available
        if (session.line_items && session.line_items.data.length > 0) {
            responseData.line_items = session.line_items.data.map(item => ({
                description: item.description,
                amount_total: item.amount_total,
                currency: item.currency,
                quantity: item.quantity,
                price: {
                    unit_amount: item.price.unit_amount,
                    product: {
                        name: item.price.product ? item.price.product.name : null,
                        description: item.price.product ? item.price.product.description : null
                    }
                }
            }));
        }
        
        // Log successful retrieval (without sensitive data)
        console.log(`Session retrieved successfully: ${session.id}, status: ${session.status}`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(responseData)
        };
        
    } catch (error) {
        console.error('Stripe error:', error);
        
        // Handle specific Stripe errors
        let errorMessage = 'An error occurred while retrieving session details';
        let statusCode = 500;
        
        if (error.type === 'StripeInvalidRequestError') {
            if (error.message.includes('No such checkout session')) {
                errorMessage = 'Session not found or has expired';
                statusCode = 404;
            } else {
                errorMessage = 'Invalid request to Stripe API';
                statusCode = 400;
            }
        } else if (error.type === 'StripeAPIError') {
            errorMessage = 'An error occurred internally with Stripe API';
            statusCode = 500;
        } else if (error.type === 'StripeConnectionError') {
            errorMessage = 'Network error occurred during Stripe API call';
            statusCode = 500;
        } else if (error.type === 'StripeAuthenticationError') {
            errorMessage = 'Stripe authentication failed';
            statusCode = 401;
        } else if (error.type === 'StripeRateLimitError') {
            errorMessage = 'Too many requests to Stripe API';
            statusCode = 429;
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