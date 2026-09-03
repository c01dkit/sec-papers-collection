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
      ${flat('fPub', opt('IEEE S&P', 'IEEE S&P') + opt('ACM CCS', 'ACM CCS'))}
      ${flat('fYear', opt('2026', '2026') + opt('2025', '2025'))}
      ${grouped('fTopic', [['基础设施', opt('07', '物联网安全')], ['软件', opt('23', '模糊测试与漏洞挖掘')]])}
      ${flat('fType', opt('1', '方法设计') + opt('6', 'SoK'))}
      <button id="favOnly" aria-pressed="false"><span>☆</span></button>
      <button id="clearAll"></button>
    </div>
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
    document.getElementById('fTopic').dispatchEvent(new Event('change'));
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
    document.getElementById('fPub').dispatchEvent(new Event('change'));
    expect(location.search).toBe('?q=fuzz&pub=ACM+CCS');
    expect(rowIds()).toEqual(['IC25001']);
  });
});
