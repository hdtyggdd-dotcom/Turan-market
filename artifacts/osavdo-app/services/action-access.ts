import type { UserProfile } from '@/context/AuthContext';

export function hasActionIdentity(user: UserProfile | null) {
  return !!(user?.name?.trim() && user.phone?.trim());
}

export function hasActionLocation(user: UserProfile | null) {
  return !!(user?.regionId && user.districtId);
}

// Return only to in-app screens; never follow an arbitrary URL from query input.
export function safeActionReturn(value: unknown, fallback = '/(tabs)'): string {
  if (typeof value !== 'string') return fallback;
  const [path, query] = value.split('?');
  if (!/^\/(?:(?:\(tabs\)\/)?(?:cart|create|profile|orders|my-products)|cargo\/(?:create|[A-Za-z0-9_-]+)|listing\/[A-Za-z0-9_-]+)$/.test(path)) return fallback;
  if (!query) return path;
  const params = new URLSearchParams(query);
  const orderId = params.get('orderId');
  return path === '/cargo/create' && orderId && /^[A-Za-z0-9_-]+$/.test(orderId)
    ? `${path}?orderId=${encodeURIComponent(orderId)}` : path;
}
