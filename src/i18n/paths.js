import { LOCALES, DEFAULT_LOCALE } from './index.js';

const LANG_PREFIX = new RegExp(`^/(${LOCALES.join('|')})(/.*)?$`);

export function swapLangInPath(pathname, toLang) {
  const m = String(pathname || '').match(LANG_PREFIX);
  if (!m) return `/${toLang}/`;
  return `/${toLang}${m[2] || '/'}`;
}

export function resolveLang(stored, navLang) {
  if (LOCALES.includes(stored)) return stored;
  return String(navLang || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function localizedHref(lang, slug) {
  return slug ? `/${lang}/${slug}/` : `/${lang}/`;
}

export { LOCALES, DEFAULT_LOCALE };
