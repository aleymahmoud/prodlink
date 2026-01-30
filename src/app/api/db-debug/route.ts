import { NextResponse } from 'next/server'

export async function GET() {
  const provider = process.env.DATABASE_PROVIDER || 'supabase'

  // Mask password for security
  const password = process.env.MYSQL_PASSWORD
  const maskedPassword = password
    ? `${password.substring(0, 3)}...${password.substring(password.length - 3)} (${password.length} chars)`
    : 'NOT SET'

  const config = {
    DATABASE_PROVIDER: provider,
    MYSQL_HOST: process.env.MYSQL_HOST || 'NOT SET',
    MYSQL_PORT: process.env.MYSQL_PORT || 'NOT SET (default: 3306)',
    MYSQL_USER: process.env.MYSQL_USER || 'NOT SET',
    MYSQL_PASSWORD: maskedPassword,
    MYSQL_DATABASE: process.env.MYSQL_DATABASE || 'NOT SET',
  }

  // Try to connect if MySQL provider
  let connectionTest = null
  if (provider === 'mysql') {
    try {
      const mysql = await import('mysql2/promise')

      const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST,
        port: parseInt(process.env.MYSQL_PORT || '3306', 10),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        connectTimeout: 10000,
      })

      // Try a simple query
      const [rows] = await connection.query('SELECT 1 as test')
      await connection.end()

      connectionTest = {
        status: 'SUCCESS',
        message: 'Connected to MySQL successfully!',
        testQuery: rows
      }
    } catch (error) {
      const err = error as Error & { code?: string; errno?: number; sqlState?: string }
      connectionTest = {
        status: 'FAILED',
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        suggestion: getSuggestion(err.code)
      }
    }
  }

  return NextResponse.json({
    config,
    connectionTest,
    timestamp: new Date().toISOString()
  }, { status: 200 })
}

function getSuggestion(code?: string): string {
  switch (code) {
    case 'ER_ACCESS_DENIED_ERROR':
      return 'Check if the MySQL user has permission to connect from this IP. In Cranl, you may need to check the MySQL service settings or use a different user.'
    case 'ECONNREFUSED':
      return 'MySQL server is not accepting connections. Check if the host and port are correct.'
    case 'ENOTFOUND':
      return 'MySQL host not found. Verify MYSQL_HOST is correct.'
    case 'ETIMEDOUT':
      return 'Connection timed out. Check network/firewall settings.'
    default:
      return 'Check Cranl documentation for MySQL connection requirements.'
  }
}
