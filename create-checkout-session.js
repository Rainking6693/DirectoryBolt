// At the top of your create-checkout-session.js file, add:
export default async function handler(req, res) {
  // Add this debug code temporarily
  if (req.method === 'GET') {
    return res.json({
      method: 'GET_DEBUG',
      hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
      hasStripePublic: !!process.env.STRIPE_PUBLISHABLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      stripeKeys: Object.keys(process.env).filter(k => k.includes('STRIPE'))
    });
  }
  
  // Rest of your existing POST logic...
}