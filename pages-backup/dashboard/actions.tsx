import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '../../components/layout/Layout'
import VerificationActionCenter from '../../components/dashboard/VerificationActionCenter'
import { LoadingState } from '../../components/ui/LoadingState'

// Mock authentication hook (replace with real auth in production)
const useAuth = () => {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate auth check
    const checkAuth = async () => {
      try {
        // In a real app, this would check authentication status
        await new Promise(resolve => setTimeout(resolve, 500))
        
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

export default function ActionsPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding?redirect=/dashboard/actions')
    }
  }, [user, loading, router])

  const handleActionUpdate = (actionId: string, status: string) => {
    console.log('Action updated:', actionId, status)
    // In a real app, this might sync data with a backend API
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Verification Actions - DirectoryBolt</title>
          <meta name="description" content="Loading your verification actions..." />
          <meta name="robots" content="noindex" />
        </Head>
        <Layout title="Loading Verification Actions - DirectoryBolt">
          <div className="min-h-screen flex items-center justify-center">
            <LoadingState 
              message="Loading verification actions..."
              submessage="Please wait while we gather your pending verification tasks"
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
        <title>Verification Actions - DirectoryBolt</title>
        <meta 
          name="description" 
          content="Complete verification actions required for your directory submissions." 
        />
        <meta name="robots" content="noindex" />
        <link rel="canonical" href={`${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/actions`} />
      </Head>

      <Layout 
        title="Verification Actions - DirectoryBolt"
        description="Complete verification actions required for your directory submissions"
        showBackButton={true}
        backButtonUrl="/dashboard"
        backButtonText="Back to Dashboard"
      >
        <VerificationActionCenter
          userId={user.id}
          onActionUpdate={handleActionUpdate}
          className="min-h-screen"
        />
      </Layout>
    </>
  )
}

// Export getServerSideProps for better SEO and performance
export async function getServerSideProps(context: any) {
  // In a real app, you might fetch user-specific verification actions here
  // or redirect based on authentication status
  
  return {
    props: {
      // Any server-side props you want to pass to the component
    }
  }
}