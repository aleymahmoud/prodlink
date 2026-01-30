import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

// Parse MySQL connection URL if provided
function getConnectionConfig(): mysql.PoolOptions {
  // Check for connection URL (Cranl or other PaaS might set this)
  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL || process.env.MYSQL_DATABASE_URL

  if (connectionUrl && connectionUrl.startsWith('mysql://')) {
    // Parse URL: mysql://user:password@host:port/database
    const url = new URL(connectionUrl)
    return {
      host: url.hostname,
      port: parseInt(url.port || '3306', 10),
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1), // Remove leading /
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    }
  }

  // Fallback to individual environment variables
  return {
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  }
}

export function getMySQLPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(getConnectionConfig())
  }
  return pool
}

export function getMySQLConfig(): mysql.PoolOptions {
  return getConnectionConfig()
}

export async function query<T>(sql: string, params?: unknown[]): Promise<T[]> {
  const pool = getMySQLPool()
  const [rows] = await pool.execute(sql, params)
  return rows as T[]
}

export async function queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
  const results = await query<T>(sql, params)
  return results[0] || null
}

export async function execute(sql: string, params?: unknown[]): Promise<mysql.ResultSetHeader> {
  const pool = getMySQLPool()
  const [result] = await pool.execute(sql, params)
  return result as mysql.ResultSetHeader
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}
