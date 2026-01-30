import type { DatabaseAdapter, DatabaseProvider } from './types'

export type { DatabaseAdapter, DatabaseProvider, QueryBuilder, QueryResult, AuthResult, AuthUser, SessionUser, DatabaseAuth } from './types'

let cachedAdapter: DatabaseAdapter | null = null

export function getDatabaseProvider(): DatabaseProvider {
  const provider = process.env.DATABASE_PROVIDER as DatabaseProvider
  if (provider === 'mysql' || provider === 'supabase') {
    return provider
  }
  return 'supabase' // Default to supabase
}

export function getDatabase(): DatabaseAdapter {
  if (cachedAdapter) {
    return cachedAdapter
  }

  const provider = getDatabaseProvider()

  if (provider === 'mysql') {
    // Dynamic import to avoid loading MySQL client when using Supabase
    const { createMySQLAdapter } = require('./mysql/adapter')
    cachedAdapter = createMySQLAdapter()
  } else {
    const { createSupabaseAdapter } = require('./supabase/adapter')
    cachedAdapter = createSupabaseAdapter()
  }

  return cachedAdapter!
}

// Reset cached adapter (useful for testing or when switching providers)
export function resetDatabaseAdapter(): void {
  cachedAdapter = null
}

// Helper to check if using MySQL
export function isUsingMySQL(): boolean {
  return getDatabaseProvider() === 'mysql'
}

// Helper to check if using Supabase
export function isUsingSupabase(): boolean {
  return getDatabaseProvider() === 'supabase'
}
