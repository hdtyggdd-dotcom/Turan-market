// Only server-defined destinations are accepted; never navigate to an arbitrary push URL.
export function notificationRoute(data: { target?: unknown; loadId?: unknown }): '/driver/verification' | `/cargo/${string}` | null {
  if (data.target === 'driver_verification') return '/driver/verification';
  if (typeof data.loadId === 'string' && data.loadId) return `/cargo/${encodeURIComponent(data.loadId)}`;
  return null;
}
