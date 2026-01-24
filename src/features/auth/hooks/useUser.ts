'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/shared/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { User as ProfileUser } from '@/shared/types/database'

interface UseUserReturn {
  user: User | null
  profile: ProfileUser | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const initialLoadDone = useRef(false)
  const supabaseRef = useRef(createClient())

  const fetchProfile = useCallback(async (userId: string) => {
    const { data: profileData, error: profileError } = await supabaseRef.current
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return null
    }
    return profileData
  }, [])

  const refetch = useCallback(async () => {
    const supabase = supabaseRef.current

    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error('Auth error:', userError)
        setUser(null)
        setProfile(null)
        return
      }

      setUser(currentUser)

      if (currentUser) {
        const profileData = await fetchProfile(currentUser.id)
        setProfile(profileData)
      } else {
        setProfile(null)
      }
    } catch (e) {
      console.error('Refetch error:', e)
      setError(e as Error)
    }
  }, [fetchProfile])

  useEffect(() => {
    const supabase = supabaseRef.current
    let mounted = true

    const initialize = async () => {
      try {
        const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()

        if (!mounted) return

        if (userError) {
          console.error('Initial auth error:', userError)
          setError(userError)
          setIsLoading(false)
          return
        }

        setUser(currentUser)

        if (currentUser) {
          const profileData = await fetchProfile(currentUser.id)
          if (mounted) {
            setProfile(profileData)
          }
        }
      } catch (e) {
        if (mounted) {
          console.error('Initialize error:', e)
          setError(e as Error)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
          initialLoadDone.current = true
        }
      }
    }

    initialize()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Skip if initial load hasn't completed to avoid race conditions
        if (!initialLoadDone.current) return
        if (!mounted) return

        console.log('Auth state change:', event)

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          return
        }

        if (session?.user) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          if (mounted) {
            setProfile(profileData)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile])

  return { user, profile, isLoading, error, refetch }
}
