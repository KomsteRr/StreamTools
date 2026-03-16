// Global alert emitter using a simple in-memory pub/sub
// Stored on globalThis to survive HMR in development
declare global {
  // eslint-disable-next-line no-var
  var alertListenersMap: Map<string, Set<(data: string) => void>>;
}

if (!global.alertListenersMap) {
  global.alertListenersMap = new Map();
}

export function subscribeToAlerts(userId: string | null, cb: (data: string) => void) {
  const key = userId || "global";
  if (!global.alertListenersMap.has(key)) {
    global.alertListenersMap.set(key, new Set());
  }
  const listeners = global.alertListenersMap.get(key)!;
  listeners.add(cb);

  return () => {
    listeners.delete(cb);
    if (listeners.size === 0) {
      global.alertListenersMap.delete(key);
    }
  };
}

export function publishAlert(userId: string | null, alert: object) {
  const key = userId || "global";
  const listeners = global.alertListenersMap.get(key);
  if (listeners) {
    const data = JSON.stringify(alert);
    listeners.forEach((cb) => cb(data));
  }
}
