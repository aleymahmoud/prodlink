import { NextResponse } from 'next/server'
import { createClient } from '@/shared/lib/supabase/server'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN

export async function GET(
  request: Request,
  { params }: { params: Promise<{ deploymentId: string }> }
) {
  const { deploymentId } = await params

  // Check if user is admin
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!VERCEL_TOKEN) {
    return NextResponse.json({ error: 'Vercel token not configured' }, { status: 500 })
  }

  try {
    // Fetch logs for specific deployment
    const response = await fetch(
      `https://api.vercel.com/v2/deployments/${deploymentId}/events`,
      {
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: 'Failed to fetch logs', details: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect to Vercel API' }, { status: 500 })
  }
}
