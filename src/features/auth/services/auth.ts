import { createClient } from '@/shared/lib/supabase/client'

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }

  // Redirect to login
  window.location.href = '/login'
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user
}

export async function getCurrentProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    throw error
  }

  return profile
}
