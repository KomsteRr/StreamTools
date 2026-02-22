// Global alert emitter using a simple in-memory pub/sub
// Stored on globalThis to survive HMR in development
declare global {
  // eslint-disable-next-line no-var
  var alertListeners: Set<(data: string) => void>;
}

if (!global.alertListeners) {
  global.alertListeners = new Set();
}

export function subscribeToAlerts(cb: (data: string) => void) {
  global.alertListeners.add(cb);
  return () => global.alertListeners.delete(cb);
}

export function publishAlert(alert: object) {
  const data = JSON.stringify(alert);
  global.alertListeners.forEach((cb) => cb(data));
}
