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
    // settings-store.js 在 Task 10 之前不存在于磁盘上，这个动态 import 注定
    // 404，要靠下面的 catch 接住。字面量路径会被静态分析提前解析，且实测两条
    // 流水线的行为不一致：
    //   - astro build（Rolldown 打包浏览器产物）：字面量 + 未加 @vite-ignore
    //     时，解析不到直接 UNRESOLVED_IMPORT 构建失败——发生在 try/catch 能起
    //     作用之前；加 /* @vite-ignore */ 能让它跳过静态解析、留到运行时。
    //   - vitest 在 jsdom environment 下（比如本文件被 tests/boot.test.js 经
    //     boot.js 间接 import 时）：同一处哪怕加了 /* @vite-ignore */ 依然会在
    //     transform 阶段报一模一样的 "Failed to resolve import" 错误；换成
    //     node environment（如 tests/theme.test.js）则不会。这是本仓库里实测
    //     到的 Vite jsdom-environment 转换与 Rolldown 生产打包之间的差异，
    //     不是我们能改的第三方行为。
    // 用变量装着路径可以在两条流水线里都稳定生效：变量不是字符串字面量，
    // 两边的静态分析都无法提前解析，因此都会把它当成真正的运行时动态 import
    // 留到实际执行到这一行才去 fetch，失败了正常落进下面的 catch。
    // Task 10 建好 settings-store.js 之后，这个变量写法可以改回字面量，
    // 好让 Vite 恢复对该路径的静态检查（写错路径能被发现）。
    const settingsStorePath = './settings-store.js';
    const mod = await import(/* @vite-ignore */ settingsStorePath);
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
