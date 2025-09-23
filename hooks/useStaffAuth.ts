import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

interface StaffUser {
  username: string
  id: string
  role: string
}

interface UseStaffAuthReturn {
  user: StaffUser | null
  loading: boolean
  isAuthenticated: boolean
  logout: () => void
}

export function useStaffAuth(): UseStaffAuthReturn {
  const router = useRouter()
  const [user, setUser] = useState<StaffUser | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = () => {
    // Clear authentication data
    localStorage.removeItem('staffAuth')
    document.cookie = 'staff-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    setUser(null)
    router.push('/staff-login')
  }

  useEffect(() => {
    const checkStaffAuth = async () => {
      try {
        // Check for staff session cookie first
        const staffSession = document.cookie
          .split('; ')
          .find(row => row.startsWith('staff-session='))
          ?.split('=')[1]

        // Check for stored auth from localStorage
        const storedAuth = localStorage.getItem('staffAuth')
        
        // If no authentication found, redirect to login
        if (!staffSession && !storedAuth) {
          console.log('No staff authentication found')
          setLoading(false)
          return
        }

        // Try to authenticate with available credentials
        const headers: HeadersInit = {
          'Content-Type': 'application/json'
        }
        if (storedAuth) {
          headers['Authorization'] = `Bearer ${storedAuth}`
        }
        if (staffSession) {
          headers['Cookie'] = `staff-session=${staffSession}`
        }

        const response = await fetch('/api/staff/auth-check', {
          method: 'GET',
          headers,
          credentials: 'include'
        })

        if (response.ok) {
          const authData = await response.json()
          console.log('✅ Staff authenticated:', authData.user?.username)
          setUser(authData.user)
        } else {
          console.warn('❌ Staff authentication failed')
          // Clear invalid auth
          localStorage.removeItem('staffAuth')
          document.cookie = 'staff-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        }
      } catch (error) {
        console.error('❌ Staff auth check failed:', error)
        localStorage.removeItem('staffAuth')
        document.cookie = 'staff-session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      } finally {
        setLoading(false)
      }
    }

    checkStaffAuth()
  }, [])

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout
  }
}

export function useRequireStaffAuth() {
  const router = useRouter()
  const auth = useStaffAuth()

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      router.push('/staff-login')
    }
  }, [auth.loading, auth.isAuthenticated, router])

  return auth
}