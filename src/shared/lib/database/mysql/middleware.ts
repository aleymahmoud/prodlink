import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const COOKIE_NAME = 'mysql_auth_token'

interface JWTPayload {
  userId: string
  email: string
}

export async function updateMySQLSession(request: NextRequest) {
  const response = NextResponse.next({ request })

  // Get token from cookie
  const token = request.cookies.get(COOKIE_NAME)?.value

  let user: JWTPayload | null = null
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-change-in-production')
      const { payload } = await jwtVerify(token, secret)
      user = payload as unknown as JWTPayload
    } catch {
      // Invalid token - clear it
      response.cookies.delete(COOKIE_NAME)
    }
  }

  // Protected routes - redirect to login if not authenticated
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  const isCallbackRoute = request.nextUrl.pathname.startsWith('/callback')
  const isMigrateRoute = request.nextUrl.pathname.startsWith('/api/db-migrate')
  const isDbStatusRoute = request.nextUrl.pathname.startsWith('/api/db-status')
  const isPublicRoute = isAuthRoute || isCallbackRoute || isMigrateRoute || isDbStatusRoute

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect logged-in users away from login page
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return response
}
