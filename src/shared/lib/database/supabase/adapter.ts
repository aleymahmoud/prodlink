import { createClient as createBrowserClient, SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { DatabaseAdapter, QueryBuilder, QueryResult, DatabaseAuth, AuthResult, AuthUser } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

function getSupabaseClient(): AnySupabaseClient | null {
  // Check if we're on server or client
  if (typeof window === 'undefined') {
    // Server-side
    return null // Will be created with cookies
  }
  // Client-side
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function getServerSupabaseClient(): Promise<AnySupabaseClient> {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignore errors in server components
          }
        },
      },
    }
  )
}

// Wrapper that makes Supabase query builder compatible with our interface
class SupabaseQueryBuilderWrapper<T = unknown> implements QueryBuilder<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabaseQuery: any
  private tableName: string
  private getClient: () => Promise<AnySupabaseClient>

  constructor(
    tableName: string,
    getClient: () => Promise<AnySupabaseClient>
  ) {
    this.tableName = tableName
    this.getClient = getClient
    // We'll initialize the query lazily
    this.supabaseQuery = null as unknown as ReturnType<ReturnType<typeof createBrowserClient>['from']>
  }

  private async initQuery() {
    if (!this.supabaseQuery) {
      const client = await this.getClient()
      this.supabaseQuery = client.from(this.tableName)
    }
    return this.supabaseQuery
  }

  select(columns?: string): QueryBuilder<T> {
    // Create a new wrapper that chains the select
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.supabaseQuery = this.supabaseQuery
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'select', args: [columns || '*'] }]
    return wrapper
  }

  private pendingOps: { type: string; args: unknown[] }[] = []

  insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'insert', args: [data] }]
    return wrapper
  }

  update(data: Partial<T>): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'update', args: [data] }]
    return wrapper
  }

  delete(): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'delete', args: [] }]
    return wrapper
  }

  eq(column: string, value: unknown): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'eq', args: [column, value] }]
    return wrapper
  }

  neq(column: string, value: unknown): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'neq', args: [column, value] }]
    return wrapper
  }

  in(column: string, values: unknown[]): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'in', args: [column, values] }]
    return wrapper
  }

  is(column: string, value: unknown): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'is', args: [column, value] }]
    return wrapper
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'order', args: [column, options] }]
    return wrapper
  }

  limit(count: number): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'limit', args: [count] }]
    return wrapper
  }

  single(): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'single', args: [] }]
    return wrapper
  }

  maybeSingle(): QueryBuilder<T> {
    const wrapper = new SupabaseQueryBuilderWrapper<T>(this.tableName, this.getClient)
    wrapper.pendingOps = [...(this.pendingOps || []), { type: 'maybeSingle', args: [] }]
    return wrapper
  }

  async then<TResult>(
    onfulfilled?: (value: QueryResult<T>) => TResult | PromiseLike<TResult>
  ): Promise<TResult> {
    const client = await this.getClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query: any = client.from(this.tableName)

    // Apply all pending operations
    for (const op of this.pendingOps || []) {
      switch (op.type) {
        case 'select':
          query = query.select(op.args[0])
          break
        case 'insert':
          query = query.insert(op.args[0])
          break
        case 'update':
          query = query.update(op.args[0])
          break
        case 'delete':
          query = query.delete()
          break
        case 'eq':
          query = query.eq(op.args[0], op.args[1])
          break
        case 'neq':
          query = query.neq(op.args[0], op.args[1])
          break
        case 'in':
          query = query.in(op.args[0], op.args[1])
          break
        case 'is':
          query = query.is(op.args[0], op.args[1])
          break
        case 'order':
          query = query.order(op.args[0], op.args[1])
          break
        case 'limit':
          query = query.limit(op.args[0])
          break
        case 'single':
          query = query.single()
          break
        case 'maybeSingle':
          query = query.maybeSingle()
          break
      }
    }

    const { data, error } = await query
    const result: QueryResult<T> = {
      data: data as T,
      error: error?.message || null,
    }

    if (onfulfilled) {
      return onfulfilled(result)
    }
    return result as unknown as TResult
  }
}

function createSupabaseAuth(getClient: () => Promise<AnySupabaseClient>): DatabaseAuth {
  return {
    async signIn(email: string, password: string): Promise<AuthResult> {
      const client = await getClient()
      const { data, error } = await client.auth.signInWithPassword({ email, password })
      return {
        user: data.user ? { id: data.user.id, email: data.user.email! } : null,
        error: error?.message || null,
      }
    },

    async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResult> {
      const client = await getClient()
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: { data: metadata },
      })
      return {
        user: data.user ? { id: data.user.id, email: data.user.email! } : null,
        error: error?.message || null,
      }
    },

    async signOut(): Promise<{ error: string | null }> {
      const client = await getClient()
      const { error } = await client.auth.signOut()
      return { error: error?.message || null }
    },

    async getUser(): Promise<{ data: { user: AuthUser | null }; error: string | null }> {
      const client = await getClient()
      const { data, error } = await client.auth.getUser()
      return {
        data: {
          user: data.user ? { id: data.user.id, email: data.user.email! } : null,
        },
        error: error?.message || null,
      }
    },

    async getSession(): Promise<{ data: { session: unknown }; error: string | null }> {
      const client = await getClient()
      const { data, error } = await client.auth.getSession()
      return {
        data: { session: data.session },
        error: error?.message || null,
      }
    },
  }
}

export function createSupabaseAdapter(): DatabaseAdapter {
  const getClient = async (): Promise<AnySupabaseClient> => {
    if (typeof window === 'undefined') {
      return await getServerSupabaseClient()
    }
    return getSupabaseClient()!
  }

  const auth = createSupabaseAuth(getClient)

  return {
    auth,
    from<T = unknown>(table: string): QueryBuilder<T> {
      return new SupabaseQueryBuilderWrapper<T>(table, getClient)
    },
    getProvider() {
      return 'supabase' as const
    },
  }
}
