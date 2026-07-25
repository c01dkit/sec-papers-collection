import { ACCENTS, THEMES } from '@/lib/settings-schema.js';

export const LS_THEME = 'spc-theme';
export const LS_ACCENT = 'spc-accent';

export function nextTheme(cur) {
  return cur === 'dark' ? 'light' : 'dark';
}

export function cycleAccent(cur, dir = 1) {
  const i = ACCENTS.indexOf(cur);
  if (i < 0) return ACCENTS[0];
  return ACCENTS[(i + dir + ACCENTS.length) % ACCENTS.length];
}

function apply(theme, accent) {
  const el = document.documentElement;
  el.classList.add('theme-anim');
  if (THEMES.includes(theme)) el.dataset.theme = theme;
  if (ACCENTS.includes(accent)) el.dataset.accent = accent;
  clearTimeout(window.__spcThemeTimer);
  window.__spcThemeTimer = setTimeout(() => el.classList.remove('theme-anim'), 500);
}

// 唯一写入口是 patchSettings，镜像同步在它内部完成 —— 别在这里直接写 localStorage
async function persist(patch) {
  try {
    const mod = await import('./settings-store.js');
    await mod.patchSettings({
      ...(patch.theme ? { darkTheme: patch.theme === 'dark', rememberDarkMode: true } : {}),
      ...(patch.accent ? { theme: patch.accent, rememberTheme: true } : {}),
    });
  } catch (err) {
    console.warn('[theme] 持久化失败，本次切换仅本页有效', err);
  }
}

// 只在整个页面会话里跑一次：软导航会重复调 initTheme()，但水合不需要
// （也不该）每次都重新读库 —— 数据不会在同一个 tab 里凭空变化。
let hydrated = false;

/**
 * 把 IndexedDB 里的持久设置水合到本页。老用户的浏览器里只有 IndexedDB、
 * 没有 localStorage 镜像（旧站从不写 spc-* 键），预绘制脚本读不到镜像时
 * 只能跟随系统偏好——不补这一步，他们存的主题会在首访时被无声忽略。
 *
 * 只在对应的 remember 开关打开、且水合结果与当前已渲染的值不同时才应用，
 * 避免没必要的 theme-anim 过渡（多数情况下镜像早已和库一致）。
 */
async function hydrateAndApply() {
  if (hydrated) return;
  hydrated = true;
  try {
    const mod = await import('./settings-store.js');
    const settings = await mod.hydrateSettings();
    const el = document.documentElement;
    let theme = el.dataset.theme;
    let accent = el.dataset.accent;
    let changed = false;

    if (settings.rememberDarkMode) {
      const wanted = settings.darkTheme ? 'dark' : 'light';
      if (wanted !== theme) {
        theme = wanted;
        changed = true;
      }
    }
    if (settings.rememberTheme) {
      const wanted = settings.theme;
      if (wanted !== accent) {
        accent = wanted;
        changed = true;
      }
    }

    if (changed) apply(theme, accent);
  } catch (err) {
    console.warn('[theme] 水合失败，本页沿用预绘制主题', err);
  }
}

export function initTheme() {
  const el = document.documentElement;

  hydrateAndApply();

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn && !themeBtn.dataset.bound) {
    themeBtn.dataset.bound = '1';
    themeBtn.addEventListener('click', () => {
      const theme = nextTheme(el.dataset.theme);
      apply(theme, el.dataset.accent);
      persist({ theme });
    });
  }

  const accentBtn = document.getElementById('accentCycle');
  if (accentBtn && !accentBtn.dataset.bound) {
    accentBtn.dataset.bound = '1';
    accentBtn.addEventListener('click', () => {
      const accent = cycleAccent(el.dataset.accent);
      apply(el.dataset.theme, accent);
      persist({ accent });
    });
  }
}

export { apply as applyTheme };
