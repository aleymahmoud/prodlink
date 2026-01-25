'use client'

import { createClient } from '@/shared/lib/supabase/client'

interface LogEntry {
  type: 'error' | 'warning' | 'info' | 'performance'
  message: string
  stack?: string
  url?: string
  metadata?: Record<string, unknown>
}

class ErrorLogger {
  private supabase = createClient()

  async log(entry: LogEntry): Promise<void> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()

      await this.supabase.from('error_logs').insert({
        type: entry.type,
        message: entry.message,
        stack: entry.stack,
        url: entry.url || (typeof window !== 'undefined' ? window.location.href : null),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        user_id: user?.id || null,
        metadata: entry.metadata || {},
      })
    } catch (e) {
      // Silently fail - don't cause errors while logging errors
      console.error('Failed to log error:', e)
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log({
      type: 'error',
      message,
      stack: error?.stack,
      metadata: { ...metadata, originalError: error?.message },
    })
  }

  warning(message: string, metadata?: Record<string, unknown>): void {
    this.log({
      type: 'warning',
      message,
      metadata,
    })
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log({
      type: 'info',
      message,
      metadata,
    })
  }

  performance(operation: string, durationMs: number, metadata?: Record<string, unknown>): void {
    this.log({
      type: 'performance',
      message: `${operation} took ${durationMs}ms`,
      metadata: { ...metadata, operation, durationMs },
    })
  }
}

export const logger = new ErrorLogger()

// Global error handler for uncaught errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', undefined, {
      reason: String(event.reason),
    })
  })
}
