interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

const loginAttempts = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5; // 5 tentatives
const WINDOW_MS = 15 * 60 * 1000; // par 15 minutes
const BLOCK_MS = 30 * 60 * 1000; // blocage 30 min après dépassement

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  remainingAttempts?: number;
  blockedFor?: number;
} {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry) {
    loginAttempts.set(ip, { attempts: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Check if blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      blockedFor: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  // Window expired — reset
  if (now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.set(ip, { attempts: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  // Increment attempts
  entry.attempts++;

  if (entry.attempts > MAX_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_MS;
    return { allowed: false, blockedFor: Math.ceil(BLOCK_MS / 1000) };
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.attempts };
}

export function resetLoginRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

// Cleanup expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    const windowExpired = now - entry.firstAttempt > WINDOW_MS;
    const blockExpired = !entry.blockedUntil || now > entry.blockedUntil;
    if (windowExpired && blockExpired) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000).unref();
