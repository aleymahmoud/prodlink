import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const provider = process.env.DATABASE_PROVIDER || 'supabase'

  if (provider !== 'mysql') {
    return NextResponse.json({
      error: 'This endpoint is only for MySQL setup. Current provider: ' + provider
    }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { email, password, fullName, secret } = body

    // Basic security check
    if (secret !== 'setup-admin-now' && secret !== process.env.MIGRATION_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    if (!email || !password || !fullName) {
      return NextResponse.json({
        error: 'Missing required fields: email, password, fullName'
      }, { status: 400 })
    }

    const { createUserAsAdmin } = await import('@/shared/lib/database/mysql/auth')
    const { query } = await import('@/shared/lib/database/mysql/client')

    // Check if any users exist
    const existingUsers = await query<{ count: number }>('SELECT COUNT(*) as count FROM users')
    if (existingUsers[0]?.count > 0) {
      return NextResponse.json({
        error: 'Users already exist. This endpoint is only for initial setup.'
      }, { status: 400 })
    }

    // Create admin user
    const result = await createUserAsAdmin(email, password, fullName, 'admin')

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully!',
      userId: result.userId
    })

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      error: 'Setup failed',
      details: (error as Error).message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'MySQL Admin Setup Endpoint',
    usage: {
      method: 'POST',
      body: {
        email: 'admin@example.com',
        password: 'your-password',
        fullName: 'Admin Name',
        secret: 'setup-admin-now'
      }
    }
  })
}
