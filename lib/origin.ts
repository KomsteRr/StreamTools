export function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
  const hostHeader = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() || "http";

  const targetHost =
    forwardedHost && !forwardedHost.includes("0.0.0.0")
      ? forwardedHost
      : hostHeader && !hostHeader.includes("0.0.0.0")
      ? hostHeader
      : null;

  if (targetHost) {
    return `${proto}://${targetHost}`;
  }

  try {
    const urlOrigin = new URL(request.url).origin;
    if (!urlOrigin.includes("0.0.0.0")) {
      return urlOrigin;
    }
  } catch {}

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function resolveSpotifyRedirectUri(
  req: Request,
  dbRedirectUri?: string,
  envRedirectUri?: string
): string {
  if (envRedirectUri && envRedirectUri.trim() !== "" && !envRedirectUri.includes("0.0.0.0")) {
    return envRedirectUri;
  }

  if (dbRedirectUri && dbRedirectUri.trim() !== "" && !dbRedirectUri.includes("0.0.0.0")) {
    return dbRedirectUri;
  }

  const origin = getRequestOrigin(req);
  return `${origin}/api/spotify/callback`;
}
