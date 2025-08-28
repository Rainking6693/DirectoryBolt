import Head from 'next/head'
import Link from 'next/link'
import { ReactNode } from 'react'
import Header from '../Header'

interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
  showBackButton?: boolean
}

export default function Layout({ 
  children, 
  title = 'DirectoryBolt',
  description = 'AI-powered directory submission service',
  showBackButton = false
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900">
        <Header showBackButton={showBackButton} />

        <main>{children}</main>

        <footer className="bg-secondary-900/80 backdrop-blur-sm text-white py-12 border-t border-volt-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-volt-400 to-volt-600 bg-clip-text text-transparent">
                  ⚡ DirectoryBolt
                </h3>
                <p className="text-secondary-300">
                  AI-powered directory submission service helping businesses get found online.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-volt-400">Product</h4>
                <ul className="space-y-2 text-secondary-300">
                  <li>
                    <Link href="/analyze" className="hover:text-volt-400 transition-colors">
                      Free Analysis
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="hover:text-volt-400 transition-colors">
                      Pricing Plans
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="hover:text-volt-400 transition-colors">
                      Directory Database
                    </Link>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4 text-volt-400">Features</h4>
                <ul className="space-y-2 text-secondary-300">
                  <li>AI-Powered Optimization</li>
                  <li>500+ Premium Directories</li>
                  <li>Automated Submissions</li>
                  <li>Real-time Analytics</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4 text-volt-400">Support</h4>
                <ul className="space-y-2 text-secondary-300">
                  <li>24/7 Customer Support</li>
                  <li>30-Day Money Back</li>
                  <li>Free Trial Available</li>
                  <li>Success Guarantee</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-secondary-800 text-center text-secondary-400">
              <p>&copy; 2024 DirectoryBolt. Get listed everywhere that matters.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}