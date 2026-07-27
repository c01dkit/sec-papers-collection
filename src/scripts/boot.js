import { initTheme } from './theme.js';
import { initReveal } from './reveal.js';
import { initNav } from './nav.js';
import { initPageScrollbar } from './page-scrollbar.js';
import { initCountdown } from './home-countdown.js';

const PAGES = new Map();

/**
 * 页面脚本用它注册自己的 init；boot 按 <main data-page> 分派。
 *
 * **必须在模块顶层同步调用**（通过页面里的静态 `<script>` import）。
 * Astro 保证 `astro:page-load` 在本页所有静态阻塞脚本执行完之后才触发，
 * 所以顶层调用一定赶得上。反之，若从 `then()`、async 回调或延迟的
 * 动态 `import()` 里调用，注册可能发生在 boot() 已经分派之后 ——
 * 下面的 `if (fn)` 会静默跳过，页面的 init 永不执行，既不报错也无警告。
 * 那种 bug 的表现是「检索页就是不工作」，极难定位。
 */
export function registerPage(name, initFn) {
  PAGES.set(name, initFn);
}

registerPage('home', () => {
  initCountdown();
});

registerPage('search', async () => {
  const { initPaperTable } = await import('./paper-table.js');
  await initPaperTable();
});

registerPage('abstract', async () => {
  const { initAbstractView } = await import('./abstract-view.js');
  await initAbstractView();
});

registerPage('trends', async () => {
  const { initTrendsChart } = await import('./trends-chart.js');
  await initTrendsChart();
});

registerPage('timeline', () => import('./timeline.js').then((m) => m.initTimeline()));

registerPage('awards', () => import('./awards-view.js').then((m) => m.initAwardsView()));

registerPage('settings', () => import('./settings-form.js').then((m) => m.initSettingsForm()));

async function boot() {
  // 全局 init 各自独立兜错。原先它们直接串在一起，于是 initNav 或 initTheme
  // 里任何一处抛错都会跳过 initReveal —— reveal-on 留在 <html> 上而没人加 .in，
  // 整页 [data-reveal] 停在 opacity:0，看起来就是一张白页。一个坏了的汉堡菜单
  // 不该让整页内容消失。
  // BaseLayout 的内联保险也能兜住这一路，但那要等 window load + 500ms；
  // 这里当场兜住，代价是零。
  // scrollbar 放最后：它开局要量一次文档高度，让前面几个先把 DOM 动完。
  for (const [name, fn] of [
    ['nav', initNav],
    ['theme', initTheme],
    ['reveal', initReveal],
    ['scrollbar', initPageScrollbar],
  ]) {
    try {
      fn();
    } catch (err) {
      console.error(`[boot] 全局 "${name}" 初始化失败`, err);
    }
  }

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
