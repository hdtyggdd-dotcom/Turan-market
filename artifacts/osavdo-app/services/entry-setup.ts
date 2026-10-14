import { LANGUAGE_OPTIONS } from '../constants/i18n';

export const ENTRY_SETUP_VERSION = 'country-language-gps-v2';

export function needsEntrySetup(done: string | null, savedLocation: string | null, savedLanguage: string | null) {
  if (done !== ENTRY_SETUP_VERSION) return true;
  try {
    const country = savedLocation ? JSON.parse(savedLocation)?.countryId : null;
    return typeof country !== 'string' || !country.trim() ||
      !LANGUAGE_OPTIONS.some(option => option.code === savedLanguage);
  } catch {
    return true;
  }
}
