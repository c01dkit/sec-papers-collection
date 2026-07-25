import { initTheme } from './theme.js';
import { initReveal } from './reveal.js';
import { initNav } from './nav.js';

const PAGES = new Map();

/** 页面脚本用它注册自己的 init；boot 按 <main data-page> 分派。 */
export function registerPage(name, initFn) {
  PAGES.set(name, initFn);
}

async function boot() {
  initNav();
  initTheme();
  initReveal();

  const page = document.querySelector('main[data-page]')?.dataset.page;
  if (!page) return;

  const fn = PAGES.get(page);
  if (fn) {
    try {
      await fn();
    } catch (err) {
      console.error(`[boot] 页面 "${page}" 初始化失败`, err);
    }
  }
}

// astro:page-load 在首次加载与每次软导航后都会触发，
// 所以所有 init 必须幂等（用 dataset.bound 守卫）。
document.addEventListener('astro:page-load', boot);
