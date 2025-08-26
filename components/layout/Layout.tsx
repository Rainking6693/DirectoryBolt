import Head from 'next/head'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  title?: string
  description?: string
}

export default function Layout({ 
  children, 
  title = 'DirectoryBolt',
  description = 'Enterprise-grade business directory platform'
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-white">
        <header className="bg-white shadow-sm border-b border-secondary-200">
          <div className="container">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gradient">
                  DirectoryBolt
                </h1>
              </div>
              
              <nav className="hidden md:flex space-x-8">
                <a href="#" className="text-secondary-700 hover:text-primary-600 transition-colors">
                  Dashboard
                </a>
                <a href="#" className="text-secondary-700 hover:text-primary-600 transition-colors">
                  Directory
                </a>
                <a href="#" className="text-secondary-700 hover:text-primary-600 transition-colors">
                  Analytics
                </a>
              </nav>
              
              <div className="flex items-center space-x-4">
                <button className="btn-secondary">
                  Sign In
                </button>
                <button className="btn-primary">
                  Get Started
                </button>
              </div>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="bg-secondary-900 text-white py-12">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">DirectoryBolt</h3>
                <p className="text-secondary-300">
                  Enterprise-grade business directory platform built for scale and performance.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Infrastructure</h4>
                <ul className="space-y-2 text-secondary-300">
                  <li>99.9% Uptime SLA</li>
                  <li>Global CDN</li>
                  <li>Auto-scaling</li>
                  <li>Real-time monitoring</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-secondary-300">
                  <li>24/7 Monitoring</li>
                  <li>DevOps Support</li>
                  <li>Performance Reports</li>
                  <li>Health Checks</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-secondary-800 text-center text-secondary-400">
              <p>&copy; 2024 DirectoryBolt. Built with enterprise infrastructure.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}