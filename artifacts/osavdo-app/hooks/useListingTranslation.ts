import { useEffect, useState } from 'react';
import { useI18n } from '../context/I18nContext';
import { listingTextKey, requestListingTranslation, type ListingText } from '../services/listing-translations';
import type { ListingTranslation } from '@workspace/api-client-react';

export function useListingTranslation(source?: ListingText) {
  const { lang } = useI18n();
  const key = source ? listingTextKey(source, lang) : '';
  const [result, setResult] = useState<{ key: string; value: ListingTranslation | null } | null>(null);
  useEffect(() => {
    if (!source) return;
    let active = true;
    void requestListingTranslation(source, lang).then(value => {
      if (active) setResult({ key, value });
    });
    return () => { active = false; };
  }, [key, lang]);
  const current = result?.key === key ? result : null;
  return { translation: current?.value ?? null, loading: !!source && !current,
    unavailable: !!source && !!current && !current.value, lang };
}
