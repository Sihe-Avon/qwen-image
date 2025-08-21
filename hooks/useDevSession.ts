import { useEffect, useState } from 'react'

interface DevUser {
  id: string
  email: string
  name: string
  image?: string
  creditsBalance: number
  profileCompleted: boolean
}

interface DevSession {
  user: DevUser | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

export function useDevSession(): DevSession {
  const [session, setSession] = useState<DevSession>({
    user: null,
    status: 'loading'
  })

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/dev-session')
        const data = await response.json()
        
        if (data.user) {
          setSession({
            user: data.user,
            status: 'authenticated'
          })
        } else {
          setSession({
            user: null,
            status: 'unauthenticated'
          })
        }
      } catch (error) {
        console.error('Failed to fetch dev session:', error)
        setSession({
          user: null,
          status: 'unauthenticated'
        })
      }
    }

    fetchSession()
  }, [])

  return session
}

export async function devSignOut() {
  try {
    await fetch('/api/dev-session', { method: 'DELETE' })
    window.location.reload()
  } catch (error) {
    console.error('Failed to sign out:', error)
  }
}
