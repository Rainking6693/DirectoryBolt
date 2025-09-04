import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        
        {/* Security Meta Tags */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://airtable.com https://api.airtable.com wss:; frame-src https://js.stripe.com https://hooks.stripe.com; object-src 'none'; base-uri 'self'; upgrade-insecure-requests; require-trusted-types-for 'script'; trusted-types 'default' 'nextjs'" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(self)" />
        
        <link rel="icon" href="/favicon.ico" />
        
        {/* Google Fonts - Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Trusted Types initialization script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && window.trustedTypes && window.trustedTypes.createPolicy) {
                try {
                  // Create default policy for trusted types
                  window.trustedTypes.createPolicy('default', {
                    createHTML: function(input) {
                      // Only allow safe HTML patterns
                      return input.replace(/<script[^>]*>.*?<\/script>/gi, '');
                    },
                    createScript: function(input) {
                      // Only allow trusted script sources
                      return input;
                    },
                    createScriptURL: function(input) {
                      // Validate script URLs
                      const allowedDomains = [
                        'js.stripe.com',
                        'www.googletagmanager.com',
                        'www.google-analytics.com',
                        'ssl.google-analytics.com'
                      ];
                      const url = new URL(input, window.location.origin);
                      if (url.origin === window.location.origin || allowedDomains.some(domain => url.hostname === domain)) {
                        return input;
                      }
                      throw new Error('Untrusted script URL: ' + input);
                    }
                  });
                  
                  // Create NextJS specific policy
                  window.trustedTypes.createPolicy('nextjs', {
                    createHTML: function(input) { return input; },
                    createScript: function(input) { return input; },
                    createScriptURL: function(input) { return input; }
                  });
                } catch (e) {
                  console.warn('Trusted Types not fully supported:', e);
                }
              }
            `
          }}
        />
      </Head>
      <body className="font-sans">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
