// /pages/api/debug-env.js
export default function handler(req, res) {
  res.json({
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasStripePublic: !!process.env.STRIPE_PUBLISHABLE_KEY,
    nodeEnv: process.env.NODE_ENV,
    envKeys: Object.keys(process.env).filter(k => k.includes('STRIPE')),
    timestamp: new Date().toISOString()
  });
}