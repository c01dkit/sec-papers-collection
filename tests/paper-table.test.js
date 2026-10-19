// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const SEED = [
  { id: 'IO26001', tag: '107N', year: 2026, title: 'IoT firmware taint', publication: 'IEEE S&P', paper: '#' },
  { id: 'IO26002', tag: '123N', year: 2026, title: 'Fuzzing one', publication: 'IEEE S&P', paper: '#' },
  { id: 'IC25001', tag: '623D', year: 2025, title: 'SoK fuzzing', publication: 'ACM CCS', paper: '#' },
];
const I18N = {
  loadFailed: 'failed', previewNote: 'preview __N__', previewOffline: 'offline __N__', retry: 'retry',
  total: 'total __N__', pageOf: '__P__/__C__', selected: 'sel __N__',
  anyPublication: 'anyPub', anyYear: 'anyYear', anyTopic: 'anyTopic', anyType: 'anyType',
  copied: 'copied', notPersistent: 'np', openPaper: 'open', toggleFavorite: 'fav', filterByTopic: 'byTopic',
  searchPlaceholder: 'ph', searchPlaceholderRegex: 'ph-re',
};
const TAX = {
  types: { 1: '方法设计', 6: 'SoK' },
  topics: { '07': '物联网安全', 23: '模糊测试与漏洞挖掘' },
};

const opt = (v, label) => `<label class="fd-opt"><input type="checkbox" value="${v}" /><span>${label}</span></label>`;
const flat = (id, opts) =>
  `<details class="fd" id="${id}"><summary><span data-fd-value>x</span></summary><div class="fd-menu">${opts}</div></details>`;
const grouped = (id, groups) =>
  `<details class="fd fd--grp" id="${id}"><summary><span data-fd-value>x</span></summary><div class="fd-menu">` +
  `<input type="search" data-fd-search />` +
  groups.map(([label, opts]) => `<div class="fd-grp"><div class="fd-ghead">${label}</div>${opts}</div>`).join('') +
  `</div></details>`;

function mount() {
  document.body.innerHTML = `
    <div class="toolbar">
      <input type="search" id="q" />
      <button id="qRe" aria-pressed="false"></button>
      ${flat('fPub', opt('IEEE S&P', 'IEEE S&P') + opt('ACM CCS', 'ACM CCS'))}
      ${flat('fYear', opt('2026', '2026') + opt('2025', '2025'))}
      ${grouped('fTopic', [['基础设施', opt('07', '物联网安全')], ['软件', opt('23', '模糊测试与漏洞挖掘')]])}
      ${flat('fType', opt('1', '方法设计') + opt('6', 'SoK'))}
      <button id="favOnly" aria-pressed="false"><span>☆</span></button>
      <button id="clearAll"></button>
    </div>
    <p id="qErr" hidden></p>
    <p id="notice" hidden></p>
    <table class="pt"><tbody id="ptBody"></tbody></table>
    <p id="ptEmpty" hidden></p>
    <span id="ptCount"></span>
    <select id="perPage"><option>15</option></select>
    <button id="pgPrev"></button><span id="pgInfo"></span><button id="pgNext"></button>
    <p id="ptToast" hidden></p>
    <script type="application/json" id="ptSeed">${JSON.stringify(SEED)}</script>
    <script type="application/json" id="ptI18n">${JSON.stringify(I18N)}</script>
    <script type="application/json" id="ptTax">${JSON.stringify(TAX)}</script>
  `;
}

const tick = () => new Promise((r) => setTimeout(r, 0));
const rowIds = () => [...document.querySelectorAll('#ptBody tr')].map((tr) => tr.dataset.id);
const checked = (id) => [...document.querySelectorAll(`#${id} input:checked`)].map((i) => i.value);

async function boot(search = '') {
  history.replaceState(null, '', `/zh/search/${search}`);
  mount();
  const { initPaperTable } = await import('@/scripts/paper-table.js');
  await initPaperTable();
  await tick();   // fetchFull 的 reject 落地，render 再跑一次
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('paper-table：主题 / 类型 / URL', () => {
  it('从 URL 回填主题筛选：控件勾上、表格只剩命中的行', async () => {
    await boot('?topic=23');
    expect(checked('fTopic')).toEqual(['23']);
    expect(rowIds()).toEqual(['IO26002', 'IC25001']);
    expect(document.querySelector('#fTopic [data-fd-value]').textContent).toBe('sel 1');
  });

  it('URL 里未知的码被丢弃，已知的类型照常生效', async () => {
    await boot('?topic=ZZ&type=6');
    expect(checked('fTopic')).toEqual([]);
    expect(checked('fType')).toEqual(['6']);
    expect(rowIds()).toEqual(['IC25001']);
  });

  it('行内渲染「类型 · 主题」，主题是带 data-topic 的按钮', async () => {
    await boot();
    const meta = document.querySelector('#ptBody tr[data-id="IC25001"] .meta');
    expect(meta.querySelector('span').textContent).toBe('SoK');
    const btn = meta.querySelector('button[data-topic]');
    expect(btn.dataset.topic).toBe('23');
    expect(btn.textContent).toBe('模糊测试与漏洞挖掘');
    expect(btn.title).toBe('byTopic');
  });

  it('点行内主题按钮：按该主题筛选、勾上下拉、写回 URL', async () => {
    await boot();
    expect(rowIds()).toHaveLength(3);
    document.querySelector('#ptBody tr[data-id="IO26001"] button[data-topic]').click();
    expect(rowIds()).toEqual(['IO26001']);
    expect(checked('fTopic')).toEqual(['07']);
    expect(document.querySelector('#fTopic [data-fd-value]').textContent).toBe('sel 1');
    expect(location.search).toBe('?topic=07');
  });

  it('点另一主题的按钮是替换而不是追加', async () => {
    await boot('?topic=07');
    // 先把 23 也勾上，再点 07 的按钮，结果应只剩 07
    const cb = document.querySelector('#fTopic input[value="23"]');
    cb.checked = true;
    cb.dispatchEvent(new Event('change', { bubbles: true }));
    expect(checked('fTopic')).toEqual(['07', '23']);
    expect(location.search).toBe('?topic=07&topic=23');
    document.querySelector('#ptBody tr[data-id="IO26001"] button[data-topic]').click();
    expect(checked('fTopic')).toEqual(['07']);
    expect(location.search).toBe('?topic=07');
  });

  it('「清除筛选」清空主题 / 类型与 URL', async () => {
    await boot('?topic=23&type=6');
    expect(rowIds()).toEqual(['IC25001']);
    document.getElementById('clearAll').click();
    expect(rowIds()).toHaveLength(3);
    expect(checked('fTopic')).toEqual([]);
    expect(checked('fType')).toEqual([]);
    expect(location.search).toBe('');
  });

  it('下拉过滤框按名字藏选项，整组都不命中时藏组；勾选状态不受影响', async () => {
    await boot('?topic=07');
    const box = document.querySelector('#fTopic [data-fd-search]');
    box.value = '模糊';
    box.dispatchEvent(new Event('input'));
    const grps = document.querySelectorAll('#fTopic .fd-grp');
    expect(grps[0].hidden).toBe(true);
    expect(grps[1].hidden).toBe(false);
    expect(checked('fTopic')).toEqual(['07']);   // 被藏起来的 07 仍然勾着
    document.getElementById('clearAll').click();
    expect(box.value).toBe('');
    expect(grps[0].hidden).toBe(false);
  });

  it('查询词与会议筛选也写回 URL，顺序固定', async () => {
    await boot();
    const q = document.getElementById('q');
    q.value = 'fuzz';
    q.dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 150));   // 脚本里的 120ms 防抖（不用假计时器：boot 自己要等真实的 tick）
    const pub = document.querySelector('#fPub input[value="ACM CCS"]');
    pub.checked = true;
    pub.dispatchEvent(new Event('change', { bubbles: true }));
    expect(location.search).toBe('?q=fuzz&pub=ACM+CCS');
    expect(rowIds()).toEqual(['IC25001']);
  });

  it('URL 里未知的码在回填后被规范化掉', async () => {
    await boot('?topic=ZZ&type=6&pub=Nope');
    expect(location.search).toBe('?type=6');
  });

  it('行内主题码在下拉里没有选项时不动现有筛选', async () => {
    await boot('?topic=23');
    // 造一行下拉里没有的主题码
    const tr = document.querySelector('#ptBody tr[data-id="IO26002"]');
    const btn = tr.querySelector('button[data-topic]');
    btn.dataset.topic = 'ZZ';
    btn.click();
    expect(checked('fTopic')).toEqual(['23']);
    expect(location.search).toBe('?topic=23');
  });

  it('过滤框上的 change 事件不触发筛选', async () => {
    await boot('?topic=23');
    const box = document.querySelector('#fTopic [data-fd-search]');
    box.value = 'x';
    box.dispatchEvent(new Event('change', { bubbles: true }));
    expect(checked('fTopic')).toEqual(['23']);
    expect(rowIds()).toEqual(['IO26002', 'IC25001']);
  });
});

describe('paper-table：正则检索', () => {
  const q = () => document.getElementById('q');
  const re = () => document.getElementById('qRe');
  const err = () => document.getElementById('qErr');
  // 脚本里的 120ms 防抖（同上，不用假计时器）
  const type = async (value) => {
    q().value = value;
    q().dispatchEvent(new Event('input'));
    await new Promise((r) => setTimeout(r, 150));
  };

  it('从 URL 回填正则模式：开关按下、按正则筛选', async () => {
    await boot('?q=%5E(fuzz%7Csok)&re=1');
    expect(re().getAttribute('aria-pressed')).toBe('true');
    expect(q().value).toBe('^(fuzz|sok)');
    expect(rowIds()).toEqual(['IO26002', 'IC25001']);
  });

  it('默认是子串模式：同一个查询词按字面匹配', async () => {
    await boot('?q=%5E(fuzz%7Csok)');
    expect(re().getAttribute('aria-pressed')).toBe('false');
    expect(rowIds()).toEqual([]);
  });

  it('点开关切到正则模式：结果、占位文案与 URL 跟着变，再点切回', async () => {
    await boot();
    await type('fuzz|taint');
    expect(rowIds()).toEqual([]);
    expect(q().placeholder).toBe('ph');
    re().click();
    expect(re().getAttribute('aria-pressed')).toBe('true');
    expect(q().placeholder).toBe('ph-re');
    expect(rowIds()).toEqual(['IO26001', 'IO26002', 'IC25001']);
    expect(location.search).toBe('?q=fuzz%7Ctaint&re=1');
    re().click();
    expect(re().getAttribute('aria-pressed')).toBe('false');
    expect(rowIds()).toEqual([]);
    expect(location.search).toBe('?q=fuzz%7Ctaint');
  });

  it('无效正则：输入框标无效、显示提示，查询这一维不筛；改对后复原', async () => {
    await boot('?re=1&q=fuzz&pub=ACM+CCS');
    await type('(fuzz');
    expect(err().hidden).toBe(false);
    expect(q().getAttribute('aria-invalid')).toBe('true');
    expect(rowIds()).toEqual(['IC25001']);   // 会议筛选照常
    await type('^sok');
    expect(err().hidden).toBe(true);
    expect(q().hasAttribute('aria-invalid')).toBe(false);
    expect(rowIds()).toEqual(['IC25001']);
  });

  it('子串模式下输入 ( 不算无效', async () => {
    await boot();
    await type('(fuzz');
    expect(err().hidden).toBe(true);
    expect(q().hasAttribute('aria-invalid')).toBe(false);
  });

  it('正则命中的片段被高亮', async () => {
    await boot('?q=fuzz%5Cw*&re=1');
    const hits = [...document.querySelectorAll('#ptBody b.q-hit')].map((b) => b.textContent);
    expect(hits).toEqual(['Fuzzing', 'fuzzing']);
  });

  it('「清除筛选」把开关一起复位', async () => {
    await boot('?q=%5Esok&re=1');
    document.getElementById('clearAll').click();
    expect(re().getAttribute('aria-pressed')).toBe('false');
    expect(q().placeholder).toBe('ph');
    expect(location.search).toBe('');
    expect(rowIds()).toHaveLength(3);
  });
});
