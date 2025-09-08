import { GetServerSideProps } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import AIEnhancedDirectoryBoltCheckout from '../components/checkout/AIEnhancedDirectoryBoltCheckout'

interface CheckoutPageProps {
  domain: string
  cancelled?: boolean
}

export default function CheckoutPage({ domain, cancelled }: CheckoutPageProps) {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Checkout - DirectoryBolt</title>
        <meta name="description" content="Complete your DirectoryBolt purchase and get your business listed in hundreds of premium directories." />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`${domain}/checkout`} />
      </Head>

      <main>
        {cancelled && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-warning-900/90 border border-warning-500 text-warning-300 px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <span>Payment was cancelled. You can continue with your purchase below.</span>
              </div>
            </div>
          </div>
        )}
        
        <AIEnhancedDirectoryBoltCheckout />
      </main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req, query } = context
  const protocol = req.headers['x-forwarded-proto'] || 'http'
  const host = req.headers.host
  const domain = `${protocol}://${host}`
  
  return {
    props: {
      domain,
      cancelled: query.cancelled === 'true' || false
    }
  }
}