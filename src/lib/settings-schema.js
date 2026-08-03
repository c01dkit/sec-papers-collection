export const ACCENTS = ['slate', 'indigo', 'oxblood', 'pine'];
export const THEMES = ['light', 'dark'];
// 'small' 是站点原始字号（16px 基准），即「无规则」档 ——
// tokens.css 只为 medium/large 写根字号覆盖。默认档取 'large'。
export const FONT_SIZES = ['small', 'medium', 'large'];
// 版心宽度（--wrap-max）：narrow 是站点原始的 1120px，即「无规则」档；
// full 表示不设上限，以浏览器窗口实际宽度为准（max-width: none）。默认档取 'medium'。
export const PAGE_WIDTHS = ['narrow', 'medium', 'wide', 'full'];

/**
 * localStorage 镜像键名。存在的唯一理由是预绘制脚本要同步读取。
 *
 * 没有 `lang` 键：`spc-lang` 记的是「用户实际浏览过的语言」，唯一合法写手是
 * nav.js（切语言链接点击时）和 BaseLayout 的预绘制脚本（每次访问当前页时，
 * 按 URL 前缀写一次）。这里曾经也镜像过一份 `settings.language`，但那个字段
 * 从来没人写（没有任何 patchSettings 调用带过 language），永远停在默认值
 * 'en' —— 于是每次 patchSettings/hydrateSettings 跑一遍 mirror()，就会用这个
 * 永远陈旧的 'en' 覆盖掉 nav.js 刚写的真实值。中文读者切到中文、随手改一个
 * 开关，语言记忆就被静默重置成英文。两个写手各管各的、互不覆盖，问题才会
 * 消失 —— 所以 language 字段本身也从 schema 里整体删掉了，见下方 DEFAULT_SETTINGS。
 */
export const MIRROR = {
  theme: 'spc-theme',
  accent: 'spc-accent',
  fontSize: 'spc-fontsize',
  pageWidth: 'spc-pagewidth',
  rememberDark: 'spc-remember-dark',
  rememberAccent: 'spc-remember-accent',
  rememberLang: 'spc-remember-lang',
};

export function DEFAULT_SETTINGS() {
  return {
    theme: 'slate',            // 强调色 slug（语义已从 PrimeVue 预设名改变）
    fontSize: 'large',
    pageWidth: 'medium',
    darkTheme: false,
    rememberLanguage: false,
    rememberDarkMode: false,
    rememberTheme: false,
    keywords: [],
  };
}

/**
 * 把任意来源的原始对象规整成合法设置。
 * 输出的键集合恒等于 DEFAULT_SETTINGS()，多余字段一律丢弃 ——
 * 否则历史遗留字段（如 llmEndpoint、language、showStatusDots）会永远躺在
 * 用户库里越积越多。language 从没人写过、showStatusDots 的唯一消费方
 * PaperStats.vue 已随旧 Vue 应用一起删除，两者都归为死字段处理。
 */
export function migrateSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = DEFAULT_SETTINGS();

  out.theme = ACCENTS.includes(src.theme) ? src.theme : 'slate';
  out.fontSize = FONT_SIZES.includes(src.fontSize) ? src.fontSize : 'large';
  out.pageWidth = PAGE_WIDTHS.includes(src.pageWidth) ? src.pageWidth : 'medium';
  out.darkTheme = Boolean(src.darkTheme);
  out.rememberLanguage = Boolean(src.rememberLanguage);
  out.rememberDarkMode = Boolean(src.rememberDarkMode);
  out.rememberTheme = Boolean(src.rememberTheme);
  out.keywords = Array.isArray(src.keywords)
    ? src.keywords.filter((k) => k !== null && k !== undefined && String(k) !== '').map(String)
    : [];

  return out;
}
