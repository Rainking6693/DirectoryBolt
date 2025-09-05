// pages/_app.js
import Script from 'next/script';

const GA = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID; // e.g. G-806DLVV41T

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* GA4: loads only if the env var is set */}
      {GA && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA}', { page_path: window.location.pathname });
            `}
          </Script>
        </>
      )}

      <Component {...pageProps} />
    </>
  );
}
