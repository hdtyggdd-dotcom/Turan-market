import { translateListings, type ListingTranslation } from '@workspace/api-client-react';
import type { LangCode } from '../constants/i18n';

export type ListingText = { id: string; title: string; description?: string | null };
type Waiter = { source: ListingText; key: string; resolve: (value: ListingTranslation | null) => void };
const cache = new Map<string, { value: ListingTranslation | null; expires: number }>();
const waiting = new Map<LangCode, Waiter[]>();
const inFlight = new Map<string, Promise<ListingTranslation | null>>();
let timer: ReturnType<typeof setTimeout> | undefined;
export const listingTextKey = (source: ListingText, lang: LangCode) =>
  JSON.stringify([source.id, source.title, source.description, lang]);

async function flush() {
  timer = undefined;
  const batches = [...waiting.entries()];
  waiting.clear();
  for (const [language, requests] of batches) {
    // Bound requests, and combine visible cards instead of charging once per card.
    for (let offset = 0; offset < requests.length; offset += 20) {
      const batch = requests.slice(offset, offset + 20);
      let items: ListingTranslation[] = [];
      try { items = (await translateListings({ listingIds: [...new Set(batch.map(p => p.source.id))], language })).items; }
      catch { /* Explicit unavailable state, no automatic provider retries. */ }
      for (const request of batch) {
        const item = items.find(value => value.id === request.source.id && value.language === language &&
          value.sourceTitle === request.source.title && (request.source.description === undefined ||
          value.sourceDescription === (request.source.description ?? '')));
        const value = item?.status === 'ready' ? item : null;
        cache.set(request.key, { value, expires: Date.now() + (value ? 3600_000 : 60_000) });
        inFlight.delete(request.key);
        request.resolve(value);
      }
      while (cache.size > 500) cache.delete(cache.keys().next().value!);
    }
  }
}

export function requestListingTranslation(source: ListingText, lang: LangCode) {
  const key = listingTextKey(source, lang);
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return Promise.resolve(saved.value);
  const existing = inFlight.get(key);
  if (existing) return existing;
  const promise = new Promise<ListingTranslation | null>(resolve => {
    const queue = waiting.get(lang) ?? [];
    queue.push({ source, key, resolve });
    waiting.set(lang, queue);
    if (!timer) timer = setTimeout(() => { void flush(); }, 120);
  });
  inFlight.set(key, promise);
  return promise;
}
