import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Whitelist of allowed domains for proxying (security measure)
const ALLOWED_DOMAINS = [
  "static-cdn.jtvnw.net",
  "badges.twitch.tv",
  "cdn.7tv.app",
  "cdn.betterttv.net",
  "cdn.frankerfacez.com",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new NextResponse("Invalid url parameter", { status: 400 });
  }

  // Security: only allow whitelisted domains
  const hostname = parsedUrl.hostname;
  const isAllowed = ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  );
  if (!isAllowed) {
    return new NextResponse("Domain not allowed", { status: 403 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; StreamOverlay/1.0)",
        "Accept": "image/webp,image/png,image/svg+xml,image/*,*/*",
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return new NextResponse(`Upstream error: ${response.status}`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type") || "image/png";
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Cache for 1 hour in OBS / browser
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("[image-proxy] Failed to fetch:", url, error);
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
