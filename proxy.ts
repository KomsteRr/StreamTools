import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { parseSession } from '@/lib/session'

// Pages / routes that are always public (used in OBS, no session required)
const PUBLIC_OVERLAYS = [
  '/twitch-chat-overlay',
  '/combined-chat-overlay',
  '/discord-overlay',
  '/alerts-overlay',
  '/goal-overlay',
  '/wheel-overlay',
  '/spotify-stream',
  '/discord-queue',
]

const PUBLIC_API = [
  '/api/spotify/callback', // OAuth callback — must stay public
  '/api/spotify/now-playing',
  '/api/settings/public',
  '/api/alerts/stream',
  '/api/alerts/config',
  '/api/chat/stream',
  '/api/chat/config',
  '/api/twitch/config',
  '/api/twitch/badges',
  '/api/twitch/7tv-emotes',
  '/api/discord/queue',
  '/api/discord/stream',
  '/api/discord/config',
  '/api/goal/config',
  '/api/wheel/config',
  '/api/wheel/stream',
  '/api/invite/setup',     // Invite token validation
]

const PUBLIC_PAGES = [
  '/invite/', // Invite pages are public
]

// Routes exclues du check setup_complete (toujours accessibles si connecté)
const SETUP_EXEMPT = [
  '/admin/setup',
  '/api/admin/setup',
  '/login',
  '/logout',
]

export async function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value
  let session = null;
  if (sessionCookie) {
    session = await parseSession(sessionCookie);
  }
  const { pathname } = request.nextUrl

  // ── Always allow overlay pages (used in OBS, no login required) ───────────
  if (PUBLIC_OVERLAYS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Always allow public API endpoints ─────────────────────────────────────
  if (PUBLIC_API.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Always allow invite pages ─────────────────────────────────────────────
  if (PUBLIC_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Protect admin routes (admin-only) ─────────────────────────────────────
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!session || session.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Forbidden — admin access required' },
          { status: 403 }
        )
      }
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }
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
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/dashboard'
      return NextResponse.redirect(redirectUrl)
    }
    return NextResponse.next()
  }

  // ── Protect all other pages ────────────────────────────────────────────────
  if (!session) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ── Check setup_complete (after auth confirmed) ───────────────────────────
  // Si setup non complété et que la route n'est pas exemptée du check
  const setupComplete = request.cookies.get('setup_complete')?.value === '1'
  const isSetupExempt = SETUP_EXEMPT.some((p) => pathname.startsWith(p))

  if (!setupComplete && !isSetupExempt && session.role === 'admin') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/admin/setup'
    return NextResponse.redirect(redirectUrl)
  }

  // Non-admin sans setup : on laisse passer (l'admin setup en premier, les users suivent)

  return NextResponse.next()
}

export const middleware = proxy

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
