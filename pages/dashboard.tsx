import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '../components/layout/Layout'
import CustomerDashboard from '../components/dashboard/CustomerDashboard'
import { LoadingState } from '../components/ui/LoadingState'

// Mock authentication hook (replace with real auth in production)
const useAuth = () => {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate auth check
    const checkAuth = async () => {
      try {
        // In a real app, this would check authentication status
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock authenticated user
        setUser({
          id: 'user_123',
          name: 'John Doe',
          email: 'john@acme-corp.com'
        })
      } catch (error) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  return { user, loading }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding?redirect=/dashboard')
    }
  }, [user, loading, router])

  const handleDataUpdate = (data: any) => {
    console.log('Dashboard data updated:', data)
    // In a real app, this might sync data with a backend API
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Dashboard - DirectoryBolt</title>
          <meta name="description" content="Loading your dashboard..." />
          <meta name="robots" content="noindex" />
        </Head>
        <Layout title="Loading Dashboard - DirectoryBolt">
          <div className="min-h-screen flex items-center justify-center">
            <LoadingState 
              message="Loading your dashboard..."
              submessage="Please wait while we gather your latest directory submission data"
              variant="spinner"
              size="lg"
            />
          </div>
        </Layout>
      </>
    )
  }

  if (!user) {
    return null // Will redirect to onboarding
  }

  return (
    <>
      <Head>
        <title>Customer Dashboard - DirectoryBolt</title>
        <meta 
          name="description" 
          content="Monitor your directory submissions, track progress, and manage your business listings." 
        />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`} />
      </Head>

      <Layout 
        title="Customer Dashboard - DirectoryBolt"
        description="Monitor your directory submissions, track progress, and manage your business listings"
        showBackButton={false}
      >
        <CustomerDashboard
          userId={user.id}
          onDataUpdate={handleDataUpdate}
          className="min-h-screen"
        />
      </Layout>
    </>
  )
}

// Export getServerSideProps for better SEO and performance
export async function getServerSideProps(context: any) {
  // In a real app, you might fetch user-specific data here
  // or redirect based on authentication status
  
  return {
    props: {
      // Any server-side props you want to pass to the component
    }
  }
}