import type { User } from '@/shared/types/database'

export type DatabaseProvider = 'supabase' | 'mysql'

export interface AuthResult {
  user: AuthUser | null
  error: string | null
}

export interface AuthUser {
  id: string
  email: string
}

export interface SessionUser extends AuthUser {
  profile: User | null
}

export interface QueryResult<T> {
  data: T | null
  error: string | null
}

export interface QueryBuilder<T = unknown> {
  select(columns?: string): QueryBuilder<T>
  insert(data: Partial<T> | Partial<T>[]): QueryBuilder<T>
  update(data: Partial<T>): QueryBuilder<T>
  delete(): QueryBuilder<T>
  eq(column: string, value: unknown): QueryBuilder<T>
  neq(column: string, value: unknown): QueryBuilder<T>
  in(column: string, values: unknown[]): QueryBuilder<T>
  is(column: string, value: unknown): QueryBuilder<T>
  order(column: string, options?: { ascending?: boolean }): QueryBuilder<T>
  limit(count: number): QueryBuilder<T>
  single(): QueryBuilder<T>
  maybeSingle(): QueryBuilder<T>
  then<TResult>(
    onfulfilled?: (value: QueryResult<T>) => TResult | PromiseLike<TResult>
  ): Promise<TResult>
}

export interface DatabaseAuth {
  signIn(email: string, password: string): Promise<AuthResult>
  signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResult>
  signOut(): Promise<{ error: string | null }>
  getUser(): Promise<{ data: { user: AuthUser | null }; error: string | null }>
  getSession(): Promise<{ data: { session: unknown }; error: string | null }>
}

export interface DatabaseAdapter {
  auth: DatabaseAuth
  from<T = unknown>(table: string): QueryBuilder<T>
  getProvider(): DatabaseProvider
}
