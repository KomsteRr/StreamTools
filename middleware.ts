import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Pages / routes that are always public (no session required)
const PUBLIC_OVERLAYS = [
  '/twitch-chat-overlay',
  '/spotify-stream',
  '/alerts-overlay',
]

const PUBLIC_API = [
  '/api/spotify/callback', // OAuth callback — must stay public
  '/api/spotify/now-playing',
  '/api/settings/public',
  '/api/alerts/stream',
  '/api/twitch/config',
]

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session')
  const { pathname } = request.nextUrl

  // ── Always allow overlay pages (used in OBS, no login required) ───────────
  if (PUBLIC_OVERLAYS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Always allow public API endpoints ─────────────────────────────────────
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Protect all API routes ─────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized — please login first' },
        { status: 401 }
      )
    }
    return NextResponse.next()
  }

  // ── Redirect authenticated users away from /login ──────────────────────────
  if (pathname.startsWith('/login')) {
    if (session) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // ── Protect all other pages ────────────────────────────────────────────────
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *  - _next/static (Next.js static files)
     *  - _next/image (Next.js image optimisation)
     *  - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
