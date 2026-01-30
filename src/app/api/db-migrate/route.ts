import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  // Check for secret key to prevent unauthorized access
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.MIGRATION_SECRET && secret !== 'run-migration-now') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const provider = process.env.DATABASE_PROVIDER || 'supabase'

  if (provider !== 'mysql') {
    return NextResponse.json({
      error: 'Migration only needed for MySQL. Current provider: ' + provider
    }, { status: 400 })
  }

  try {
    const mysql = await import('mysql2/promise')

    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: parseInt(process.env.MYSQL_PORT || '3306', 10),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      multipleStatements: true,
    })

    console.log('Connected to MySQL database')

    // Read schema file
    const schemaPath = path.join(process.cwd(), 'src/shared/lib/database/mysql/schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Execute schema
    await connection.query(schema)

    await connection.end()

    return NextResponse.json({
      success: true,
      message: 'MySQL schema migration completed successfully!'
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: (error as Error).message
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST request to run migration',
    usage: 'POST /api/db-migrate?secret=run-migration-now'
  })
}
