import { cookies } from "next/headers";

export interface SessionPayload {
  userId: string;
  role: "admin" | "user";
}

const SECRET = process.env.SESSION_SECRET || "fallback-secret-change-me";

// Internal helper to get a CryptoKey for HMAC-SHA256
async function getSecretKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Convert ArrayBuffer to base64url string
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Convert base64url string to Uint8Array
function base64UrlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padUrl = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
  const binary = atob(padUrl);
  // Ensure we allocate a standard ArrayBuffer, not a SharedArrayBuffer
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Sign a payload string using Web Crypto API.
 */
async function sign(payload: string): Promise<string> {
  const key = await getSecretKey();
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  return bufferToBase64Url(signature);
}

export async function createSessionValue(userId: string, role: "admin" | "user"): Promise<string> {
  const payload = JSON.stringify({ userId, role, iat: Date.now() });
  const encoder = new TextEncoder();
  
  // Use a standard ArrayBuffer
  const uintBytes = encoder.encode(payload);
  const buffer = new ArrayBuffer(uintBytes.length);
  new Uint8Array(buffer).set(uintBytes);

  const encoded = bufferToBase64Url(buffer);
  const sig = await sign(encoded);
  return `${encoded}.${sig}`;
}

/**
 * Parse and verify a signed session cookie value.
 * Returns null if invalid or tampered.
 */
export async function parseSession(cookieValue: string): Promise<SessionPayload | null> {
  try {
    const [encoded, sig] = cookieValue.split(".");
    if (!encoded || !sig) return null;

    const key = await getSecretKey();
    const encoder = new TextEncoder();
    const signatureBytes = base64UrlToUint8Array(sig);
    
    // Convert to standard ArrayBuffer for BufferSource type matching
    const sigBuffer = new ArrayBuffer(signatureBytes.length);
    new Uint8Array(sigBuffer).set(signatureBytes);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      sigBuffer,
      encoder.encode(encoded)
    );

    if (!isValid) return null;

    const decodedBytes = base64UrlToUint8Array(encoded);
    const jsonString = new TextDecoder().decode(decodedBytes);
    const json = JSON.parse(jsonString);
    if (!json.userId || !json.role) return null;

    return { userId: json.userId, role: json.role };
  } catch {
    return null;
  }
}

/**
 * Read the current session from the request cookies (server-side).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("session")?.value;
  if (!raw) return null;
  return parseSession(raw);
}

/**
 * Require a valid session, optionally requiring admin role.
 * Returns the session payload or null if unauthorized.
 */
export async function requireSession(adminOnly = false): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session) return null;
  if (adminOnly && session.role !== "admin") return null;
  return session;
}

export function getSafeUserId(session: SessionPayload | null | undefined): string | null {
  if (!session) return null;
  return session.role === "admin" ? null : session.userId;
}
