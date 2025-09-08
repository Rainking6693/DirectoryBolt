import { GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import AIEnhancedDirectoryBoltCheckout from '../components/checkout/AIEnhancedDirectoryBoltCheckout'
import { StandardDirectoryBoltCheckout } from '../components/checkout/AIEnhancedDirectoryBoltCheckout'

interface TestCheckoutPageProps {
  domain: string
  version?: 'ai' | 'standard'
}

export default function TestCheckoutPage({ domain, version = 'ai' }: TestCheckoutPageProps) {
  return (
    <>
      <Head>
        <title>Test AI-Enhanced Checkout - DirectoryBolt</title>
        <meta name="description" content="Test the AI-enhanced checkout experience" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main>
        <div className="fixed top-4 left-4 z-50">
          <div className="bg-secondary-800 border border-secondary-600 rounded-lg p-3">
            <div className="text-sm font-medium text-white mb-2">Test Mode</div>
            <div className="flex gap-2">
              <Link
                href="/test-ai-checkout?version=ai"
                className={`px-3 py-1 text-xs rounded ${
                  version === 'ai' 
                    ? 'bg-volt-500 text-secondary-900' 
                    : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                }`}
              >
                AI-Enhanced
              </Link>
              <Link
                href="/test-ai-checkout?version=standard"
                className={`px-3 py-1 text-xs rounded ${
                  version === 'standard' 
                    ? 'bg-volt-500 text-secondary-900' 
                    : 'bg-secondary-700 text-secondary-300 hover:bg-secondary-600'
                }`}
              >
                Standard
              </Link>
            </div>
          </div>
        </div>
        
        {version === 'ai' ? (
          <AIEnhancedDirectoryBoltCheckout />
        ) : (
          <StandardDirectoryBoltCheckout />
        )}
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
      version: query.version === 'standard' ? 'standard' : 'ai'
    }
  }
}