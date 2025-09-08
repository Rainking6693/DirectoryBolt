import Head from 'next/head'
import { useState } from 'react'
import { AICustomerPortal } from '../components/ai-portal'

interface AIPortalPageProps {
  userId?: string
  businessUrl?: string
}

export default function AIPortalPage({ 
  userId = 'demo-user', 
  businessUrl = 'https://acme-corp.com' 
}: AIPortalPageProps) {
  const [insightActions, setInsightActions] = useState<any[]>([])

  const handleInsightAction = (insight: any, action: string) => {
    console.log('Insight action taken:', { insight: insight.id, action })
    
    // Track actions for analytics
    setInsightActions(prev => [...prev, {
      insightId: insight.id,
      action,
      timestamp: new Date().toISOString()
    }])
    
    // In a real app, this would integrate with:
    // - Analytics tracking
    // - Customer success systems
    // - Action workflow automation
    // - Performance monitoring
  }

  return (
    <>
      <Head>
        <title>AI Customer Portal - DirectoryBolt</title>
        <meta name="description" content="AI-powered customer portal with real-time business intelligence, competitive analysis, and actionable insights" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <AICustomerPortal
        userId={userId}
        businessUrl={businessUrl}
        onInsightAction={handleInsightAction}
        className=""
      />
    </>
  )
}

// Enable server-side rendering with user authentication
export async function getServerSideProps(context: any) {
  // In a real app, you would:
  // 1. Authenticate the user from session/token
  // 2. Fetch user's business information
  // 3. Load recent AI analysis results
  // 4. Check subscription/access permissions
  // 5. Preload critical insights

  const { req } = context
  
  // Mock user data for demonstration
  const userData = {
    userId: 'demo-user-123',
    businessUrl: 'https://acme-corp.com',
    subscription: 'premium',
    lastAnalysis: new Date().toISOString()
  }

  return {
    props: {
      userId: userData.userId,
      businessUrl: userData.businessUrl
    }
  }
}

// Export type for integration with other components
export type { AIPortalPageProps }