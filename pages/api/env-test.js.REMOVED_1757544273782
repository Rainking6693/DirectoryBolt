export default function handler(req, res) {
  res.json({
    timestamp: new Date().toISOString(),
    method: req.method,
    hasStripeSecret: !!process.env.STRIPE_SECRET_KEY,
    hasStripePublic: !!process.env.STRIPE_PUBLISHABLE_KEY,
    nodeEnv: process.env.NODE_ENV,
    allStripeKeys: Object.keys(process.env).filter(k => k.includes('STRIPE')),
    totalEnvVars: Object.keys(process.env).length
  });
}