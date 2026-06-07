// Next.js middleware that runs on every request.
// Redirects HTTP → HTTPS in production, enforces auth on protected routes,
// restricts admin paths to ADMIN-role users, and forwards user identity
// headers (x-user-id, x-user-email) to API routes.

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { config as appConfig } from '@/lib/config'
import { jwtVerify } from 'jose'

const JWT_SECRET = appConfig.jwtSecret

async function verifyJwt(token: string, secret: string): Promise<{ userId: string; email: string; role: string } | null> {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const { payload } = await jwtVerify(token, keyData)
    return payload as { userId: string; email: string; role: string }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') === 'http'
  ) {
    const secureUrl = new URL(request.url)
    secureUrl.protocol = 'https:'
    return NextResponse.redirect(secureUrl.toString(), 301)
  }

  const isPublicPage = ['/login', '/register', '/verify-otp', '/set-password', '/forgot-password', '/reset-password'].includes(path)
  const isPublicApi = path.startsWith('/api/auth/') && 
                      !['/api/auth/me', '/api/auth/logout'].includes(path)
  const isCronJob = path === '/api/admin/cleanup'
  
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon.ico') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  const accessTokenCookie = request.cookies.get('access_token')
  const token = accessTokenCookie?.value

  let payload = null
  if (token) {
    payload = await verifyJwt(token, JWT_SECRET)
  }

  if (!payload) {
    if (isPublicPage || isPublicApi || isCronJob) {
      return NextResponse.next()
    }
    
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (payload && isPublicPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (path.startsWith('/api/admin') || path.startsWith('/admin')) {
    if (payload.role !== 'ADMIN') {
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId)
  requestHeaders.set('x-user-email', payload.email)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
