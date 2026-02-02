import { signOut as nextAuthSignOut } from 'next-auth/react'

export async function signOut() {
  await nextAuthSignOut({ callbackUrl: '/login' })
}

export async function getCurrentUser() {
  const response = await fetch('/api/auth/session')
  const session = await response.json()
  return session?.user || null
}

export async function getCurrentProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const response = await fetch(`/api/profile/${user.id}`)
  if (!response.ok) return null

  return response.json()
}
