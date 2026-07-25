export const ACCENTS = ['slate', 'indigo', 'oxblood', 'pine'];
export const THEMES = ['light', 'dark'];
const LANGS = ['zh', 'en'];

/** localStorage 镜像键名。存在的唯一理由是预绘制脚本要同步读取。 */
export const MIRROR = {
  theme: 'spc-theme',
  accent: 'spc-accent',
  lang: 'spc-lang',
  rememberDark: 'spc-remember-dark',
  rememberAccent: 'spc-remember-accent',
  rememberLang: 'spc-remember-lang',
};

export function DEFAULT_SETTINGS() {
  return {
    theme: 'slate',            // 强调色 slug（语义已从 PrimeVue 预设名改变）
    language: 'en',
    darkTheme: false,
    rememberLanguage: false,
    rememberDarkMode: false,
    rememberTheme: false,
    showStatusDots: false,
    keywords: [],
  };
}

/**
 * 把任意来源的原始对象规整成合法设置。
 * 输出的键集合恒等于 DEFAULT_SETTINGS()，多余字段一律丢弃 ——
 * 否则历史遗留字段（如 llmEndpoint）会永远躺在用户库里越积越多。
 */
export function migrateSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = DEFAULT_SETTINGS();

  out.theme = ACCENTS.includes(src.theme) ? src.theme : 'slate';
  out.language = LANGS.includes(src.language) ? src.language : 'en';
  out.darkTheme = Boolean(src.darkTheme);
  out.rememberLanguage = Boolean(src.rememberLanguage);
  out.rememberDarkMode = Boolean(src.rememberDarkMode);
  out.rememberTheme = Boolean(src.rememberTheme);
  out.showStatusDots = Boolean(src.showStatusDots);
  out.keywords = Array.isArray(src.keywords)
    ? src.keywords.filter((k) => k !== null && k !== undefined && String(k) !== '').map(String)
    : [];

  return out;
}
