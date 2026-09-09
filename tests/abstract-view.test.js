// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const I18N = {
  loading: 'loading', failed: 'failed', noData: 'nodata', count: '__N__ papers',
  noAbstract: 'no-abstract', openPaper: 'open', langSwitch: 'switch lang', langZh: '中', langEn: 'EN',
  pageLang: 'zh',
};

const BOTH = { id: 'IO26001', tag: '107N', title: 'Fuzzing the kernel', paper: 'https://x/1',
  abstract: 'We fuzz the kernel.', abstract_zh: '我们对内核做模糊测试。' };
const EN_ONLY = { id: 'IO26002', tag: '107N', title: 'English only', paper: '#',
  abstract: 'Only English here.', abstract_zh: '' };
const NONE = { id: 'IO26003', tag: '107N', title: 'Nothing', paper: '#', abstract: '', abstract_zh: '' };

function mount(pageLang = 'zh') {
  document.body.innerHTML = `
    <nav class="picker"><button class="yr" data-venue="IEEE S&P" data-year="2026">2026</button></nav>
    <div id="abResult"><p class="hint">hint</p></div>
    <script type="application/json" id="abI18n">${JSON.stringify({ ...I18N, pageLang })}</script>
  `;
}

const tick = () => new Promise((r) => setTimeout(r, 0));

async function boot(papers, { pageLang = 'zh', settings = {} } = {}) {
  const store = await import('@/scripts/settings-store.js');
  await store.patchSettings({ abstractLang: 'page', abstractSwitch: true, keywords: [], ...settings });
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => papers })));
  mount(pageLang);
  const { initAbstractView } = await import('@/scripts/abstract-view.js');
  await initAbstractView();
  document.querySelector('.yr').click();
  await tick(); await tick();
}

const items = () => [...document.querySelectorAll('#abResult .item')];
const absOf = (li) => li.querySelector('.abs');
const swOf = (li) => li.querySelector('.lsw');

afterEach(() => { vi.unstubAllGlobals(); });

describe('摘要中/EN 切换', () => {
  it('跟随页面：中文页初始显示中文，切换按钮靠右、中 高亮', async () => {
    await boot([BOTH]);
    const li = items()[0];
    expect(absOf(li).textContent).toBe(BOTH.abstract_zh);
    expect(absOf(li).lang).toBe('zh-CN');
    const sw = swOf(li);
    expect(sw).not.toBeNull();
    expect(sw.parentElement.className).toBe('trow');
    expect(sw.dataset.lang).toBe('zh');
    expect(sw.querySelector('[data-l="zh"]').classList.contains('on')).toBe(true);
    expect(sw.querySelector('[data-l="en"]').classList.contains('on')).toBe(false);
    expect(sw.getAttribute('aria-label')).toBe('switch lang');
  });

  it('跟随页面：英文页初始显示英文', async () => {
    await boot([BOTH], { pageLang: 'en' });
    const li = items()[0];
    expect(absOf(li).textContent).toBe(BOTH.abstract);
    expect(absOf(li).lang).toBe('en');
    expect(swOf(li).dataset.lang).toBe('en');
  });

  it('点一下在两种语言之间来回切，只影响这一篇', async () => {
    await boot([BOTH, { ...BOTH, id: 'IO26009', title: 'Second' }]);
    const [a, b] = items();
    swOf(a).click();
    expect(absOf(a).textContent).toBe(BOTH.abstract);
    expect(absOf(a).lang).toBe('en');
    expect(swOf(a).dataset.lang).toBe('en');
    expect(absOf(b).textContent).toBe(BOTH.abstract_zh);   // 另一篇不动
    swOf(a).click();
    expect(absOf(a).textContent).toBe(BOTH.abstract_zh);
  });

  it('设置固定英文：中文页也先显示英文', async () => {
    await boot([BOTH], { settings: { abstractLang: 'en' } });
    expect(absOf(items()[0]).textContent).toBe(BOTH.abstract);
  });

  it('设置固定中文：英文页也先显示中文', async () => {
    await boot([BOTH], { pageLang: 'en', settings: { abstractLang: 'zh' } });
    expect(absOf(items()[0]).textContent).toBe(BOTH.abstract_zh);
  });

  it('没有中文摘要：回落英文，且不画切换按钮', async () => {
    await boot([EN_ONLY], { settings: { abstractLang: 'zh' } });
    const li = items()[0];
    expect(absOf(li).textContent).toBe(EN_ONLY.abstract);
    expect(absOf(li).lang).toBe('en');
    expect(swOf(li)).toBeNull();
  });

  it('老数据没有 abstract_zh 字段：行为与只有英文相同', async () => {
    const { abstract_zh, ...legacy } = BOTH;
    await boot([legacy]);
    const li = items()[0];
    expect(absOf(li).textContent).toBe(BOTH.abstract);
    expect(swOf(li)).toBeNull();
  });

  it('两种都没有：显示「暂无摘要」，不挂 lang，不画按钮', async () => {
    await boot([NONE]);
    const li = items()[0];
    expect(absOf(li).textContent).toBe('no-abstract');
    expect(absOf(li).classList.contains('abs--none')).toBe(true);
    expect(absOf(li).hasAttribute('lang')).toBe(false);
    expect(swOf(li)).toBeNull();
  });

  it('设置关掉按钮：不画按钮，但默认语言照样生效', async () => {
    await boot([BOTH], { pageLang: 'en', settings: { abstractSwitch: false, abstractLang: 'zh' } });
    const li = items()[0];
    expect(swOf(li)).toBeNull();
    expect(absOf(li).textContent).toBe(BOTH.abstract_zh);
  });

  it('关键词高亮在两种语言里都生效', async () => {
    await boot([BOTH], { settings: { keywords: ['内核', 'kernel'] } });
    const li = items()[0];
    expect(absOf(li).querySelector('b.hl')?.textContent).toBe('内核');
    swOf(li).click();
    expect(absOf(li).querySelector('b.hl')?.textContent).toBe('kernel');
  });

  it('标题与外链仍在标题行左侧，按钮在最右', async () => {
    await boot([BOTH]);
    const trow = items()[0].querySelector('.trow');
    expect([...trow.children].map((c) => c.className)).toEqual(['tmain', 'lsw']);
    expect(trow.querySelector('.tmain .ttl').textContent).toBe(BOTH.title);
    expect(trow.querySelector('.tmain .ext').href).toBe('https://x/1');
  });
});

// ── URL 深链：首页矩阵格子 → /[lang]/abstract/?pub=…&year=… ──────────────
describe('URL 深链', () => {
  async function bootAt(search, papers = [BOTH]) {
    const store = await import('@/scripts/settings-store.js');
    await store.patchSettings({ abstractLang: 'page', abstractSwitch: true, keywords: [] });
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, status: 200, json: async () => papers })));
    history.replaceState(null, '', `/zh/abstract/${search}`);
    document.body.innerHTML = `
      <nav class="picker">
        <button class="yr" data-venue="IEEE S&P" data-year="2026">2026</button>
        <button class="yr" data-venue="IEEE S&P" data-year="2025">2025</button>
        <button class="yr" data-venue="NDSS" data-year="2025">2025</button>
      </nav>
      <div id="abResult"><p class="hint">hint</p></div>
      <script type="application/json" id="abI18n">${JSON.stringify(I18N)}</script>
    `;
    const { initAbstractView } = await import('@/scripts/abstract-view.js');
    await initAbstractView();
    await tick(); await tick();
  }
  const pressed = () => [...document.querySelectorAll('.yr[aria-pressed="true"]')]
    .map((b) => `${b.dataset.venue} ${b.dataset.year}`);

  afterEach(() => { history.replaceState(null, '', '/zh/abstract/'); });

  it('带 ?pub&year 打开：对应 chip 按下、直接加载该届次', async () => {
    await bootAt('?pub=IEEE+S%26P&year=2025');
    expect(pressed()).toEqual(['IEEE S&P 2025']);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(String(fetch.mock.calls[0][0])).toContain(encodeURIComponent('IEEE S&P - 2025.json'));
    expect(document.querySelector('#abResult .head h2').textContent).toBe('IEEE S&P 2025');
  });

  it('URL 指向不存在的届次：什么也不加载，保留初始提示', async () => {
    await bootAt('?pub=NDSS&year=2026');
    expect(pressed()).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
    expect(document.querySelector('#abResult .hint').textContent).toBe('hint');
  });

  it('没有参数：行为与从前一致', async () => {
    await bootAt('');
    expect(pressed()).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('点 chip 后地址栏跟着变（replaceState，不产生历史记录）', async () => {
    await bootAt('');
    const before = history.length;
    document.querySelector('.yr[data-venue="NDSS"]').click();
    await tick();
    expect(location.search).toBe('?pub=NDSS&year=2025');
    expect(location.pathname).toBe('/zh/abstract/');
    expect(history.length).toBe(before);
  });
});
