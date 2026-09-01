import { NextResponse } from 'next/server'

const PUBLIC_PREFIXES = ['/login', '/api/auth']

export function middleware(request) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const hasSession = request.cookies.getAll()
    .some(c => c.name.startsWith('moneta.') || c.name.startsWith('__Secure-moneta.'))

  if (!hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
