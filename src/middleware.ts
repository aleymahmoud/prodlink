import { type NextRequest } from 'next/server'
import { updateSession } from '@/shared/lib/supabase/middleware'
import { updateMySQLSession } from '@/shared/lib/database/mysql/middleware'

export async function middleware(request: NextRequest) {
  const provider = process.env.DATABASE_PROVIDER || 'supabase'

  if (provider === 'mysql') {
    return await updateMySQLSession(request)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
