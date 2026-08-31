import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl
  const session = req.auth

  // Redirect unauthenticated users from protected routes
  if (!session) {
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/book') ||
      pathname.startsWith('/booking') ||
      pathname.startsWith('/admin')
    ) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Redirect non-admin users from admin routes
  if (session && session.user.role !== 'ADMIN' && pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Redirect logged-in users away from auth pages
  if (session && (pathname === '/login' || pathname === '/register')) {
    if (session.user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
