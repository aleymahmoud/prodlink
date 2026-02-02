import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const VERCEL_TOKEN = process.env.VERCEL_TOKEN

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  if (!VERCEL_TOKEN) {
    return NextResponse.json({ error: 'Vercel token not configured' }, { status: 500 })
  }

  try {
    // Fetch deployments from Vercel API
    const response = await fetch('https://api.vercel.com/v6/deployments?limit=10', {
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ error: 'Failed to fetch deployments', details: errorText }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to connect to Vercel API' }, { status: 500 })
  }
}
