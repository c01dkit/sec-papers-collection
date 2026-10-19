// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const I18N = {
  loading: 'loading', failed: 'failed', noData: 'nodata', count: '__N__ papers',
  noAbstract: 'no-abstract', openPaper: 'open', langSwitch: 'switch lang', langZh: '中', langEn: 'EN',
  pageLang: 'zh', searchHref: '/zh/search/',
};
const TAX = {
  types: { 0: '待分析', 1: '方法设计', 6: 'SoK' },
  topics: { '00': '未分类', '07': '物联网安全', 23: '模糊测试与漏洞挖掘' },
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
    <script type="application/json" id="abTax">${JSON.stringify(TAX)}</script>
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

describe('标题与摘要之间的标签行', () => {
  const tagsOf = (li) => li.querySelector('.tags');
  const texts = (li) => [...tagsOf(li).children].map((el) => el.textContent);

  it('依次是 #主题、#类型、#奖项，夹在标题行与摘要之间', async () => {
    await boot([{ ...BOTH, tag: '623D', awards: ['Distinguished Paper Award', 'Best Student Paper Award'] }]);
    const li = items()[0];
    expect([...li.children].map((el) => el.className)).toEqual(['trow', 'tags', 'abs']);
    expect(texts(li)).toEqual(['#模糊测试与漏洞挖掘', '#SoK', '#Distinguished Paper Award', '#Best Student Paper Award']);
  });

  it('主题与类型是去检索页按该码筛选的链接', async () => {
    await boot([{ ...BOTH, tag: '623N' }]);
    const [topic, type] = tagsOf(items()[0]).children;
    expect(topic.tagName).toBe('A');
    expect(topic.getAttribute('href')).toBe('/zh/search/?topic=23');
    expect(type.tagName).toBe('A');
    expect(type.getAttribute('href')).toBe('/zh/search/?type=6');
  });

  it('奖项是原始英文名，不是链接，带 tg--award 以区别样式', async () => {
    await boot([{ ...BOTH, tag: '107D', awards: ['Distinguished Paper Award'] }]);
    const award = tagsOf(items()[0]).querySelector('.tg--award');
    expect(award.tagName).toBe('SPAN');
    expect(award.textContent).toBe('#Distinguished Paper Award');
  });

  it('未分类主题（00）与待分析类型（0）不出标签', async () => {
    await boot([{ ...BOTH, tag: '007N', awards: [] }, { ...BOTH, id: 'IO26009', tag: '100N' }]);
    const [a, b] = items();
    expect(texts(a)).toEqual(['#物联网安全']);
    expect(texts(b)).toEqual(['#方法设计']);
  });

  it('什么标签都没有时不画这一行', async () => {
    await boot([{ ...BOTH, tag: '000N', awards: [] }]);
    const li = items()[0];
    expect(tagsOf(li)).toBeNull();
    expect([...li.children].map((el) => el.className)).toEqual(['trow', 'abs']);
  });

  it('畸形 tag、缺 awards 字段（CDN 上的旧数据）都安全降级', async () => {
    await boot([{ ...BOTH, tag: 'oops' }, { ...BOTH, id: 'IO26009', tag: '107D', awards: 'Best Paper Award' }]);
    const [a, b] = items();
    expect(tagsOf(a)).toBeNull();
    expect(texts(b)).toEqual(['#物联网安全', '#方法设计']);   // awards 不是数组时忽略，不把字符串逐字拆开
  });

  it('奖项名按文本插入，不当 HTML 解析', async () => {
    await boot([{ ...BOTH, tag: '000D', awards: ['<img src=x onerror=alert(1)>'] }]);
    const li = items()[0];
    expect(li.querySelector('img')).toBeNull();
    expect(texts(li)).toEqual(['#<img src=x onerror=alert(1)>']);
  });
});
