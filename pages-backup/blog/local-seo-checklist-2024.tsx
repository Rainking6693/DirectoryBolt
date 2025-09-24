import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LocalSEOChecklistRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/blog')
  }, [router])
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      backgroundColor: '#1a2332',
      color: '#fff'
    }}>
      <div>
        <h1>Redirecting to Blog...</h1>
        <p>Local SEO Checklist coming soon!</p>
      </div>
    </div>
  )
}