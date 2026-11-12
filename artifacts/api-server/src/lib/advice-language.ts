export const ADVICE_LANGUAGES = {
  uz: 'Uzbek', kz: 'Kazakh', kg: 'Kyrgyz', tj: 'Tajik', tm: 'Turkmen',
  af: 'Dari', ru: 'Russian', cn: 'Simplified Chinese', ir: 'Persian', tr: 'Turkish', en: 'English',
} as const;

export function adviceReplyLanguage(value: unknown): string | null {
  if (value === undefined) return ADVICE_LANGUAGES.uz;
  if (typeof value !== 'string' || !Object.hasOwn(ADVICE_LANGUAGES, value)) return null;
  return ADVICE_LANGUAGES[value as keyof typeof ADVICE_LANGUAGES];
}
