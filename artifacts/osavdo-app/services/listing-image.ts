/** Uploaded image IDs are portable; saved development hosts are not. */
export function resolveListingImageUrl(value: string, baseUrl: string): string | null {
  const ownImagePath = /^\/api\/images\/img_[A-Za-z0-9_-]+$/;
  const base = baseUrl.replace(/\/+$/, '');
  const relative = value.startsWith('api/images/') ? `/${value}` : value;
  if (ownImagePath.test(relative)) return `${base}${relative}`;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (ownImagePath.test(url.pathname)) return `${base}${url.pathname}`;
    return url.toString();
  } catch {
    return null;
  }
}
