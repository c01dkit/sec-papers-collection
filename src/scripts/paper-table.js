import { applyFilters, sortRows, paginate, loadPapers } from '@/lib/papers.js';
import { highlightSegments } from '@/lib/highlight.js';
import { parseTag } from '@/lib/tags.js';
import { readSearchParams, writeSearchParams } from '@/lib/search-url.js';
import { getSettings, getFavorites, toggleFavorite, isPersistent } from './settings-store.js';

// state 必须能整体重建。模块在软导航时不会重新执行（同一个 bundle URL），
// 但 DOM 是全新的、dataset.bound 也没了，于是 init 会再跑一次。若此时只重置
// rows，上一次访问留下的筛选条件会活下来，而界面上的控件全是空的 ——
// 表现为「什么都没选，表格却是空的」，用户无从下手。
const initialState = () => ({
  rows: [],          // 全量（或预渲染的种子）
  favorites: new Set(),
  keywords: [],
  query: '',
  publications: [],
  years: [],
  topics: [],        // tag 第 2-3 位的码
  types: [],         // tag 第 1 位的码
  favoritesOnly: false,
  sortKey: null,
  sortDir: 'asc',
  page: 1,
  perPage: 15,
  status: 'loading', // 'loading' | 'loaded' | 'failed'
});

let state = initialState();

let i18n = {};
// 当前语言的 码 -> 名（#ptTax）。与 PaperRow.astro 预渲染用的是同一份，
// 所以运行期造的行和构建期的行文字一致。
let tax = { types: {}, topics: {} };
let els = {};

const fmt = (tpl, map) =>
  Object.entries(map).reduce((s, [k, v]) => s.replaceAll(k, v), tpl);

/**
 * 读取内嵌的种子数据（预渲染那 30 行的完整记录），作为 CDN 失败时的兜底数据源。
 * 不从表格 DOM 反推：那样会丢字段、要从文本 parse 数字，而且和表格列结构
 * 紧耦合 —— 以后改列就默默失效。
 */
function readSeed() {
  const el = document.getElementById('ptSeed');
  if (!el) return [];
  try {
    const rows = JSON.parse(el.textContent);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.warn('[paper-table] 种子数据解析失败', err);
    return [];
  }
}

// 参数是元素而不是 id：调用处保留字面量的 getElementById('ptI18n')，
// tests/wiring.test.js 才能继续守住这几个 id 与模板的对应关系。
function readJson(el, fallback) {
  if (!el) return fallback;
  try {
    return JSON.parse(el.textContent);
  } catch (err) {
    console.warn(`[paper-table] #${el.id} 解析失败`, err);
    return fallback;
  }
}

function renderTitle(td, title) {
  // 必须用 trim 后的查询。applyFilters 内部会 trim，而这里不 trim 的话，
  // 输入一个空格：什么都不会被筛掉（对的），但每个标题里的每个空格都被标成命中；
  // 反过来 "fuzz " 能正确筛选却一处都高亮不出来。
  const q = state.query.trim();
  const patterns = [
    ...(q ? [{ text: q, cls: 'q-hit' }] : []),
    ...state.keywords.map((k) => ({ text: k, cls: 'hl' })),
  ];
  const frag = document.createDocumentFragment();
  for (const seg of highlightSegments(title, patterns)) {
    if (!seg.hit) {
      frag.appendChild(document.createTextNode(seg.text));
    } else {
      const b = document.createElement('b');
      b.className = seg.cls;
      b.textContent = seg.text;
      frag.appendChild(b);
    }
  }
  td.replaceChildren(frag);
}

// 标题下方的「类型 · 主题」。结构必须与 PaperRow.astro 一致：
// .meta > span(类型) + button[data-topic](主题)。类型 0 / 主题 00 不渲染；两者都没有时不渲染 .meta。
// 样式在 search.astro 的 <style is:global> 里 —— 这里是 createElement，拿不到 scope 属性。
function buildMeta(row) {
  const tag = parseTag(row.tag);
  const typeText = tag.type === '0' ? '' : (tax.types[tag.type] ?? tag.type);
  const topicText = tag.topic === '00' ? '' : (tax.topics[tag.topic] ?? tag.topic);
  if (!typeText && !topicText) return null;
  const meta = document.createElement('span');
  meta.className = 'meta';
  if (typeText) {
    const s = document.createElement('span');
    s.textContent = typeText;
    meta.appendChild(s);
  }
  if (topicText) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.topic = tag.topic;
    b.title = i18n.filterByTopic;
    b.textContent = topicText;
    meta.appendChild(b);
  }
  return meta;
}

function buildRow(row) {
  const tr = document.createElement('tr');
  tr.dataset.id = String(row.id);

  const cells = [
    ['c-id', String(row.id)],
    ['c-pub', row.publication],
    ['c-year', String(row.year)],
  ];
  for (const [cls, text] of cells) {
    const td = document.createElement('td');
    td.className = cls;
    td.textContent = text;
    tr.appendChild(td);
  }

  const tdTitle = document.createElement('td');
  tdTitle.className = 'c-title';
  const span = document.createElement('span');
  span.dataset.title = '';
  renderTitle(span, row.title);
  tdTitle.appendChild(span);
  const meta = buildMeta(row);
  if (meta) tdTitle.appendChild(meta);
  tr.appendChild(tdTitle);

  const tdAct = document.createElement('td');
  tdAct.className = 'c-act';
  if (row.paper && row.paper !== '#') {
    const a = document.createElement('a');
    a.href = row.paper;
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = i18n.openPaper;
    a.setAttribute('aria-label', i18n.openPaper);
    a.textContent = '↗';
    tdAct.appendChild(a);
  } else {
    const off = document.createElement('span');
    off.className = 'off';
    off.setAttribute('aria-hidden', 'true');
    off.textContent = '↗';
    tdAct.appendChild(off);
  }
  const fav = document.createElement('button');
  fav.type = 'button';
  fav.dataset.fav = String(row.id);
  fav.title = i18n.toggleFavorite;
  fav.setAttribute('aria-label', i18n.toggleFavorite);
  const on = state.favorites.has(row.id);
  fav.setAttribute('aria-pressed', on ? 'true' : 'false');
  fav.textContent = on ? '★' : '☆';
  tdAct.appendChild(fav);
  tr.appendChild(tdAct);

  return tr;
}

function render() {
  const filtered = applyFilters(state.rows, {
    query: state.query,
    publications: state.publications,
    years: state.years,
    topics: state.topics,
    types: state.types,
    favoritesOnly: state.favoritesOnly,
    favorites: state.favorites,
  });
  const ordered = state.sortKey ? sortRows(filtered, state.sortKey, state.sortDir) : filtered;
  const page = paginate(ordered, state.page, state.perPage);
  state.page = page.page;

  els.tbody.replaceChildren(...page.rows.map(buildRow));
  els.empty.hidden = page.total > 0;

  // 三态都要如实写出来。原先在未加载时保留旧文本，结果 CDN 失败后计数永远停在
  // 「预览 30 篇」，而表格已经在按筛选条件变化 —— 两者对不上。
  const countTpl = { loading: i18n.previewNote, loaded: i18n.total, failed: i18n.previewOffline }[state.status];
  els.count.textContent = fmt(countTpl, { __N__: page.total.toLocaleString() });
  els.pgInfo.textContent = fmt(i18n.pageOf, {
    __P__: String(page.page),
    __C__: String(page.pageCount),
  });
  els.pgPrev.disabled = page.page <= 1;
  els.pgNext.disabled = page.page >= page.pageCount;
}

function readDropdown(details, placeholder) {
  const checked = [...details.querySelectorAll('input:checked')].map((i) => i.value);
  const slot = details.querySelector('[data-fd-value]');
  slot.textContent = checked.length ? fmt(i18n.selected, { __N__: String(checked.length) }) : placeholder;
  return checked;
}

// 筛选条件写回 URL（replaceState，不产生历史记录），结果因此可分享、可从主题索引页深链。
// 「仅看收藏」是本地状态，不进 URL。全空时把 ?… 整段去掉。
function syncUrl() {
  // 软导航后 120ms 防抖可能才触发：此时 els 指向已脱离文档的旧 DOM，
  // location.pathname 已是新页面，不能把 ?q=… 写到别的页面上去。
  if (!els.tbody?.isConnected) return;
  const next = location.pathname + writeSearchParams(state);
  if (next === location.pathname + location.search) return;
  history.replaceState(history.state, '', next);
}

// 主题下拉里的就地过滤框：按选项名（不含右侧计数）大小写无关子串匹配，
// 不命中的选项置 hidden，整组都不命中时把组也藏掉。只藏不改勾选，readDropdown 只看 input:checked。
// 返回一个「清空过滤框」函数给「清除筛选」用。
function bindOptionFilter(details) {
  const box = details.querySelector('[data-fd-search]');
  if (!box) return () => {};
  const apply = () => {
    const needle = box.value.trim().toLowerCase();
    for (const grp of details.querySelectorAll('.fd-grp')) {
      let visible = 0;
      for (const opt of grp.querySelectorAll('.fd-opt')) {
        const label = opt.querySelector('span')?.textContent ?? '';
        const hit = !needle || label.toLowerCase().includes(needle);
        opt.hidden = !hit;
        if (hit) visible += 1;
      }
      grp.hidden = visible === 0;
    }
  };
  box.addEventListener('input', apply);
  return () => {
    box.value = '';
    apply();
  };
}

// 复制提示必须和 #notice 分开。共用一个槽位时，复制一次就会把 CDN 失败提示
// 连同它的「重试」按钮一起 replaceChildren 掉，两秒后再把整条隐藏 ——
// 用户失去了唯一的恢复入口，且没有任何迹象表明发生过这件事。
let toastTimer = 0;
function showToast(text) {
  els.toast.textContent = text;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2000);
}

function showNotice(text, onRetry) {
  els.notice.replaceChildren(document.createTextNode(text));
  if (onRetry) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = i18n.retry;
    btn.addEventListener('click', () => {
      els.notice.hidden = true;
      fetchFull();
    });
    els.notice.appendChild(btn);
  }
  els.notice.hidden = false;
}

async function fetchFull() {
  try {
    const data = await loadPapers();
    state.rows = data;
    state.status = 'loaded';
    render();   // render 自己会按 status 写计数
  } catch (err) {
    console.warn('[paper-table] 全量数据加载失败，保留预渲染内容', err);
    // 种子数据仍在 state.rows 里，页面依旧可筛可排
    state.status = 'failed';
    render();   // 让计数改口说「离线预览」，而不是停在「加载中」
    showNotice(i18n.loadFailed, true);
  }
}

export async function initPaperTable() {
  const tbody = document.getElementById('ptBody');
  if (!tbody || tbody.dataset.bound) return;
  tbody.dataset.bound = '1';

  state = initialState();   // 见 initialState 上方注释：软导航必须清干净

  i18n = readJson(document.getElementById('ptI18n'), {});
  tax = readJson(document.getElementById('ptTax'), { types: {}, topics: {} });
  els = {
    tbody,
    empty: document.getElementById('ptEmpty'),
    notice: document.getElementById('notice'),
    toast: document.getElementById('ptToast'),
    count: document.getElementById('ptCount'),
    pgInfo: document.getElementById('pgInfo'),
    pgPrev: document.getElementById('pgPrev'),
    pgNext: document.getElementById('pgNext'),
    q: document.getElementById('q'),
    fPub: document.getElementById('fPub'),
    fYear: document.getElementById('fYear'),
    fTopic: document.getElementById('fTopic'),
    fType: document.getElementById('fType'),
    favOnly: document.getElementById('favOnly'),
    clearAll: document.getElementById('clearAll'),
    perPage: document.getElementById('perPage'),
  };

  // 四个下拉与各自的状态字段、占位文案。顺序即 URL 参数顺序（见 search-url.js）。
  const dropdowns = [
    [els.fPub, 'publications', i18n.anyPublication],
    [els.fYear, 'years', i18n.anyYear],
    [els.fTopic, 'topics', i18n.anyTopic],
    [els.fType, 'types', i18n.anyType],
  ];

  // 表头从 tbody 反查同一张表拿到，而不是 document.querySelectorAll('.pt th…')：
  // 类名是全站命名空间（Task 17 的 .bar 就是这么撞死获奖页的），而这里本来就
  // 有一个确定的根可用。
  const sortHeads = [...(tbody.closest('table')?.querySelectorAll('th[data-sort]') ?? [])];

  // aria-sort 与 data-dir 必须一起写：前者是读屏能拿到的排序状态，
  // 后者驱动 ::after 那个 ↑/↓ 箭头。只写一个就会有一方在说谎。
  const paintSort = () => {
    for (const th of sortHeads) {
      const active = th.dataset.sort === state.sortKey;
      if (active) {
        th.dataset.dir = state.sortDir === 'asc' ? '↑' : '↓';
      } else {
        delete th.dataset.dir;
      }
      th.setAttribute('aria-sort', !active ? 'none' : state.sortDir === 'asc' ? 'ascending' : 'descending');
    }
  };

  // 先用内嵌的种子数据当数据源，这样 CDN 失败也有内容可筛
  state.rows = readSeed();

  // 从 URL 回填筛选。合法值集合取自各下拉真实存在的选项：URL 里不认识的会议 / 年份 / 码
  // 直接丢掉，控件与状态才不会分家（否则会出现「看不见的筛选」）。
  // 软导航时 astro:page-load 在新 URL 上触发，location.search 就是新页面的。
  const valuesOf = (details) => new Set([...details.querySelectorAll('input[value]')].map((i) => i.value));
  const fromUrl = readSearchParams(location.search, {
    publications: valuesOf(els.fPub),
    years: valuesOf(els.fYear),
    topics: valuesOf(els.fTopic),
    types: valuesOf(els.fType),
  });
  state.query = fromUrl.query;
  els.q.value = fromUrl.query;
  for (const [details, field, placeholder] of dropdowns) {
    const want = new Set(fromUrl[field]);
    for (const input of details.querySelectorAll('input[value]')) input.checked = want.has(input.value);
    state[field] = readDropdown(details, placeholder);
  }
  // 把未知的值从地址栏里去掉、编码规范化：分享出去的 URL 要和页面实际在做的事一致
  syncUrl();

  const [settings, favorites] = await Promise.all([getSettings(), getFavorites()]);
  state.keywords = settings.keywords;
  state.favorites = new Set(favorites);
  if (!isPersistent()) showNotice(i18n.notPersistent, false);

  // ── 事件 ────────────────────────────────────────────
  let debounce;
  els.q.addEventListener('input', () => {
    clearTimeout(debounce);
    // 15600 行的全量筛选在输入时逐字跑会卡，压到 120ms
    debounce = setTimeout(() => {
      state.query = els.q.value;
      state.page = 1;
      render();
      syncUrl();
    }, 120);
  });

  for (const [details, field, placeholder] of dropdowns) {
    details.addEventListener('change', (e) => {
      if (e.target?.type !== 'checkbox') return;   // 过滤框的 change 不是筛选变化
      state[field] = readDropdown(details, placeholder);
      state.page = 1;
      render();
      syncUrl();
    });
  }

  const resetTopicFilterBox = bindOptionFilter(els.fTopic);

  els.favOnly.addEventListener('click', () => {
    state.favoritesOnly = !state.favoritesOnly;
    els.favOnly.setAttribute('aria-pressed', state.favoritesOnly ? 'true' : 'false');
    els.favOnly.querySelector('span').textContent = state.favoritesOnly ? '★' : '☆';
    state.page = 1;
    render();
  });

  els.clearAll.addEventListener('click', () => {
    state.query = '';
    state.publications = [];
    state.years = [];
    state.topics = [];
    state.types = [];
    state.favoritesOnly = false;
    state.sortKey = null;
    state.page = 1;
    els.q.value = '';
    for (const [details, , placeholder] of dropdowns) {
      details.querySelectorAll('input:checked').forEach((i) => (i.checked = false));
      details.open = false;
      readDropdown(details, placeholder);
    }
    resetTopicFilterBox();
    els.favOnly.setAttribute('aria-pressed', 'false');
    els.favOnly.querySelector('span').textContent = '☆';
    paintSort();   // sortKey 已置空 —— 箭头和 aria-sort 一起收回
    render();
    syncUrl();
  });

  els.perPage.addEventListener('change', () => {
    state.perPage = Number(els.perPage.value) || 15;
    state.page = 1;
    render();
  });

  els.pgPrev.addEventListener('click', () => {
    state.page -= 1;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  els.pgNext.addEventListener('click', () => {
    state.page += 1;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 事件绑在 <th> 里的 <button> 上，不是 <th> 上：原生按钮自带 tab 停靠点、
  // Enter/Space 激活和 button role，这三样是键盘用户能排序的全部前提。
  for (const th of sortHeads) {
    th.querySelector('button')?.addEventListener('click', () => {
      const key = th.dataset.sort;
      state.sortDir = state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc';
      state.sortKey = key;
      paintSort();
      render();
    });
  }

  // 行内委托：收藏按钮 + 行内主题按钮 + 点标题复制
  tbody.addEventListener('click', async (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      // id 是 'IO25001' 这样的字符串，别 Number() —— 会得到 NaN，
      // 收藏静默存成 [NaN] 且 favorites.has(row.id) 永不命中
      const id = favBtn.dataset.fav;
      const { favorites: next, added } = await toggleFavorite(id);
      state.favorites = new Set(next);
      favBtn.setAttribute('aria-pressed', added ? 'true' : 'false');
      favBtn.textContent = added ? '★' : '☆';
      // 「仅看收藏」开着时取消收藏要让该行立刻消失
      if (state.favoritesOnly) render();
      return;
    }
    // 行内主题按钮：把主题筛选**替换**成这一个（不是追加），并让下拉与 URL 跟上。
    // 必须排在「点行复制标题」之前，否则点主题名会顺便复制一次标题。
    const topicBtn = e.target.closest('[data-topic]');
    if (topicBtn) {
      const code = topicBtn.dataset.topic;
      const inputs = [...els.fTopic.querySelectorAll('input[value]')];
      // 选项在构建期按篇数 > 0 裁剪，行来自运行期的 CDN 数据：两者可能错位。
      // 没有对应选项时保持现状，而不是把已有的主题筛选清空。
      if (!inputs.some((input) => input.value === code)) return;
      for (const input of inputs) input.checked = input.value === code;
      state.topics = readDropdown(els.fTopic, i18n.anyTopic);
      state.page = 1;
      render();
      syncUrl();
      return;
    }
    if (e.target.closest('a')) return;   // 论文外链交给浏览器
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const title = tr.querySelector('[data-title]')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(title);
      showToast(i18n.copied);
    } catch {
      /* 无剪贴板权限时静默 */
    }
  });

  render();
  fetchFull();
}
