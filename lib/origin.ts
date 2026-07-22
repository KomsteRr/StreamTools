export function getRequestOrigin(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
    request.headers.get("host");
  const proto =
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
    "http";

  if (host && !host.includes("0.0.0.0")) {
    return `${proto}://${host}`;
  }

  try {
    const urlOrigin = new URL(request.url).origin;
    if (!urlOrigin.includes("0.0.0.0")) {
      return urlOrigin;
    }
  } catch {}

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
