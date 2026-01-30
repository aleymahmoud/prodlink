import { NextResponse } from 'next/server'

export async function GET() {
  const provider = process.env.DATABASE_PROVIDER || 'supabase'

  try {
    if (provider === 'mysql') {
      // Check MySQL connection
      const { getMySQLPool } = await import('@/shared/lib/database/mysql/client')
      const pool = getMySQLPool()
      await pool.query('SELECT 1')
      return NextResponse.json({ provider, connected: true })
    } else {
      // Check Supabase connection
      const { createClient } = await import('@/shared/lib/supabase/server')
      const supabase = await createClient()
      const { error } = await supabase.from('system_settings').select('id').limit(1)
      return NextResponse.json({ provider, connected: !error })
    }
  } catch (error) {
    console.error('Database status check error:', error)
    return NextResponse.json({ provider, connected: false, error: (error as Error).message })
  }
}
