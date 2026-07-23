function configuredOrigin(): string | null {
  const value = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getRequestOrigin(request: Request): string {
  // Never trust X-Forwarded-Host/Proto supplied by a client. Production should
  // set NEXT_PUBLIC_APP_URL to the canonical public origin.
  const configured = configuredOrigin();
  if (configured) return configured;

  return new URL(request.url).origin;
}

export function resolveSpotifyRedirectUri(
  req: Request,
  dbRedirectUri?: string,
  envRedirectUri?: string,
): string {
  if (envRedirectUri?.trim()) return envRedirectUri.trim();
  if (dbRedirectUri?.trim()) return dbRedirectUri.trim();
  return `${getRequestOrigin(req)}/api/spotify/callback`;
}
