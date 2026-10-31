import type { LangCode } from '../constants/i18n';
import catalog from '../constants/locales/ui.json';

type Catalog = Record<string, Partial<Record<LangCode, string>>>;
const messages: Catalog = catalog;
let language: LangCode = 'uz';
const listeners = new Set<() => void>();
export const getUiLanguage = () => language;
export function subscribeUiLanguage(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function setUiLanguage(next: LangCode) {
  if (next === language) return;
  language = next;
  listeners.forEach(listener => listener());
}
export const normalizeUiText = (text: string) => text.replace(/\s+/g, ' ').trim();
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.keys(messages).filter(key => /\{\{\d+\}\}/.test(key)).map(key => {
  const indices: string[] = [];
  const parts = key.split(/(\{\{\d+\}\})/);
  const regex = parts.map(part => {
    if (/^\{\{\d+\}\}$/.test(part)) { indices.push(part); return '(.*?)'; }
    return escapeRegex(part);
  }).join('');
  return { key, indices, regex: new RegExp(`^${regex}$`), specificity: key.replace(/\{\{\d+\}\}/g, '').length };
}).sort((a, b) => b.specificity - a.specificity);

/** Only catalogued application copy is translated. Never send customer text to AI. */
export function translateUi(text: string, lang: LangCode = language): string {
  if (lang === 'uz' || !text.trim()) return text;
  // Guides are composed from individual headings/paragraphs, not one giant catalog key.
  if (text.includes('\n')) return text.split(/(\r?\n)/).map(part =>
    /^\r?\n$/.test(part) ? part : translateUi(part, lang)).join('');
  const key = normalizeUiText(text);
  let translated = messages[key]?.[lang];
  if (!translated) {
    for (const template of templates) {
      const match = template.regex.exec(key);
      if (!match || !messages[template.key]?.[lang]) continue;
      const values = Object.fromEntries(template.indices.map((token, i) => [token, match[i + 1]]));
      translated = messages[template.key]![lang]!.replace(/\{\{\d+\}\}/g, token => values[token] ?? token);
      break;
    }
  }
  if (!translated) return text;
  return (text.match(/^\s*/)?.[0] ?? '') + translated + (text.match(/\s*$/)?.[0] ?? '');
}

export const UI_LOCALES: Record<LangCode, string> = {
  uz: 'uz-Latn-UZ', en: 'en-GB', ru: 'ru-RU', kz: 'kk-KZ', kg: 'ky-KG',
  tj: 'tg-TJ', tm: 'tk-TM', af: 'fa-AF', cn: 'zh-CN', ir: 'fa-IR', tr: 'tr-TR',
};
export const getUiLocale = () => UI_LOCALES[language];
