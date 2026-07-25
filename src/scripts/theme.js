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

// 持久化：localStorage 供下次首绘同步读取，IndexedDB 供设置页读取。
// settings-store 在 Task 10 补上；此处动态引入以免它还不存在时报错。
async function persist(patch) {
  try {
    if (patch.theme) localStorage.setItem(LS_THEME, patch.theme);
    if (patch.accent) localStorage.setItem(LS_ACCENT, patch.accent);
  } catch {
    /* 隐私模式下 localStorage 可能抛错，忽略 */
  }
  try {
    // @vite-ignore：settings-store.js 在 Task 10 之前不存在于磁盘上。没有这个注释，
    // Vite/Rolldown 在 `astro build` 时会把字面量动态 import 当成打包图的一部分去
    // 静态解析，解析不到就直接 UNRESOLVED_IMPORT 构建失败——这发生在 try/catch 能
    // 起作用之前，try/catch 只挡得住运行时的模块加载失败，挡不住构建期的路径解析。
    const mod = await import(/* @vite-ignore */ './settings-store.js');
    await mod.patchSettings({
      ...(patch.theme ? { darkTheme: patch.theme === 'dark' } : {}),
      ...(patch.accent ? { theme: patch.accent } : {}),
    });
  } catch {
    /* settings-store 不可用时静默降级，localStorage 已足够维持体验 */
  }
}

export function initTheme() {
  const el = document.documentElement;

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
