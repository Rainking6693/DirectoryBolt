/** @type {import('next').NextConfig} */

// === Derive Supabase origins for CSP from env (fallback to wildcard) ===
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
let SUPABASE_ORIGIN = 'https://*.supabase.co';
let SUPABASE_WS = 'wss://*.supabase.co';
try {
  if (SUPABASE_URL) {
    const u = new URL(SUPABASE_URL);
    SUPABASE_ORIGIN = u.origin;        // e.g., https://abcd.supabase.co
    SUPABASE_WS = `wss://${u.host}`;   // e.g., wss://abcd.supabase.co
  }
} catch { /* ignore malformed env */ }

const isProd = process.env.NODE_ENV === 'production';
console.log('🔍 Next.js Config - isProd:', isProd, 'NODE_ENV:', process.env.NODE_ENV);

// === Content Security Policy (CSP) ===
const csp = [
  "default-src 'self'",
  // Allow GA/GTM/Stripe/Sentry. Keep 'unsafe-eval' only in dev.
  `script-src 'self' ${isProd ? '' : "'unsafe-eval'"} 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://browser.sentry-cdn.com https://js.sentry-cdn.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  // Connect targets: Stripe, GA4 (incl. regional), GTM, Airtable, Supabase, Sentry, dev websockets
  `connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://api.airtable.com ${SUPABASE_ORIGIN} ${SUPABASE_WS} https://*.sentry.io wss: ws://localhost:3000 ws://localhost:*`,
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  // ✅ Allow Trusted Types policies used by Next.js and Google
  "trusted-types nextjs nextjs#bundler goog#html"
].join('; ');
