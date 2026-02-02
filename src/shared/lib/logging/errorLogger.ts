'use client'

interface LogEntry {
  type: 'error' | 'warning' | 'info' | 'performance'
  message: string
  stack?: string
  url?: string
  metadata?: Record<string, unknown>
}

class ErrorLogger {
  async log(entry: LogEntry): Promise<void> {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${entry.type.toUpperCase()}]`, entry.message, entry.metadata || '')
    }
    // TODO: Implement error logging to database when error_logs table is added
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    console.error(message, error)
    this.log({
      type: 'error',
      message,
      stack: error?.stack,
      metadata: { ...metadata, originalError: error?.message },
    })
  }

  warning(message: string, metadata?: Record<string, unknown>): void {
    console.warn(message, metadata)
    this.log({
      type: 'warning',
      message,
      metadata,
    })
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    console.info(message, metadata)
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
