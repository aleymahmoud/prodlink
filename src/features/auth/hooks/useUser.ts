'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'
import type { Profile } from '@/shared/lib/db/schema'

interface UseUserReturn {
  user: { id: string; email: string; name: string; role: string } | null
  profile: Profile | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)

  const fetchProfile = useCallback(async (userId: string) => {
    setIsLoadingProfile(true)
    try {
      const response = await fetch(`/api/profile/${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data)
    } catch (e) {
      console.error('Profile fetch error:', e)
      setError(e as Error)
    } finally {
      setIsLoadingProfile(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id)
    }
  }, [session?.user?.id, fetchProfile])

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile(session.user.id)
    } else {
      setProfile(null)
    }
  }, [session?.user?.id, fetchProfile])

  const isLoading = status === 'loading' || isLoadingProfile

  return {
    user: session?.user ? {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || '',
      role: session.user.role || 'engineer',
    } : null,
    profile,
    isLoading,
    error,
    refetch,
  }
}
