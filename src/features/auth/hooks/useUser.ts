'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/shared/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { User as ProfileUser } from '@/shared/types/database'

interface UseUserReturn {
  user: User | null
  profile: ProfileUser | null
  isLoading: boolean
  error: Error | null
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const getUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) throw userError

        setUser(user)

        if (user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (profileError) throw profileError
          setProfile(profileData)
        }
      } catch (e) {
        setError(e as Error)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setProfile(profileData)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, isLoading, error }
}
