import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { query, queryOne, execute, generateUUID } from './client'
import type { AuthResult, AuthUser, DatabaseAuth } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'
const JWT_EXPIRY = '7d'
const COOKIE_NAME = 'mysql_auth_token'

interface DBUser {
  id: string
  email: string
  password_hash: string
}

interface JWTPayload {
  userId: string
  email: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email } as JWTPayload, JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

export function createMySQLAuth(): DatabaseAuth {
  return {
    async signIn(email: string, password: string): Promise<AuthResult> {
      try {
        const user = await queryOne<DBUser>(
          'SELECT id, email, password_hash FROM users WHERE email = ?',
          [email]
        )

        if (!user) {
          return { user: null, error: 'Invalid email or password' }
        }

        const isValid = await verifyPassword(password, user.password_hash)
        if (!isValid) {
          return { user: null, error: 'Invalid email or password' }
        }

        const token = generateToken(user.id, user.email)
        await setAuthCookie(token)

        return {
          user: { id: user.id, email: user.email },
          error: null,
        }
      } catch (error) {
        console.error('MySQL signIn error:', error)
        return { user: null, error: 'Authentication failed' }
      }
    },

    async signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<AuthResult> {
      try {
        const existing = await queryOne<{ id: string }>(
          'SELECT id FROM users WHERE email = ?',
          [email]
        )

        if (existing) {
          return { user: null, error: 'Email already registered' }
        }

        const userId = generateUUID()
        const passwordHash = await hashPassword(password)

        await execute(
          'INSERT INTO users (id, email, password_hash, email_confirmed) VALUES (?, ?, ?, ?)',
          [userId, email, passwordHash, true]
        )

        // Check if this is the first user (make them admin)
        const userCount = await queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM profiles'
        )
        const isFirstUser = !userCount || userCount.count === 0
        const role = isFirstUser ? 'admin' : 'engineer'

        const fullName = (metadata?.full_name as string) || email

        await execute(
          'INSERT INTO profiles (id, email, full_name, role, is_active) VALUES (?, ?, ?, ?, ?)',
          [userId, email, fullName, role, true]
        )

        const token = generateToken(userId, email)
        await setAuthCookie(token)

        return {
          user: { id: userId, email },
          error: null,
        }
      } catch (error) {
        console.error('MySQL signUp error:', error)
        return { user: null, error: 'Registration failed' }
      }
    },

    async signOut(): Promise<{ error: string | null }> {
      try {
        await clearAuthCookie()
        return { error: null }
      } catch (error) {
        console.error('MySQL signOut error:', error)
        return { error: 'Sign out failed' }
      }
    },

    async getUser(): Promise<{ data: { user: AuthUser | null }; error: string | null }> {
      try {
        const token = await getAuthToken()
        if (!token) {
          return { data: { user: null }, error: null }
        }

        const payload = verifyToken(token)
        if (!payload) {
          return { data: { user: null }, error: null }
        }

        const user = await queryOne<DBUser>(
          'SELECT id, email FROM users WHERE id = ?',
          [payload.userId]
        )

        if (!user) {
          return { data: { user: null }, error: null }
        }

        return {
          data: { user: { id: user.id, email: user.email } },
          error: null,
        }
      } catch (error) {
        console.error('MySQL getUser error:', error)
        return { data: { user: null }, error: 'Failed to get user' }
      }
    },

    async getSession(): Promise<{ data: { session: unknown }; error: string | null }> {
      try {
        const token = await getAuthToken()
        if (!token) {
          return { data: { session: null }, error: null }
        }

        const payload = verifyToken(token)
        if (!payload) {
          return { data: { session: null }, error: null }
        }

        return {
          data: { session: { token, user: payload } },
          error: null,
        }
      } catch (error) {
        console.error('MySQL getSession error:', error)
        return { data: { session: null }, error: 'Failed to get session' }
      }
    },
  }
}

// Admin functions for creating users without logging them in
export async function createUserAsAdmin(
  email: string,
  password: string,
  fullName: string,
  role: string
): Promise<{ userId: string | null; error: string | null }> {
  try {
    const existing = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    )

    if (existing) {
      return { userId: null, error: 'Email already registered' }
    }

    const userId = generateUUID()
    const passwordHash = await hashPassword(password)

    await execute(
      'INSERT INTO users (id, email, password_hash, email_confirmed) VALUES (?, ?, ?, ?)',
      [userId, email, passwordHash, true]
    )

    await execute(
      'INSERT INTO profiles (id, email, full_name, role, is_active) VALUES (?, ?, ?, ?, ?)',
      [userId, email, fullName, role, true]
    )

    return { userId, error: null }
  } catch (error) {
    console.error('MySQL createUserAsAdmin error:', error)
    return { userId: null, error: 'Failed to create user' }
  }
}
