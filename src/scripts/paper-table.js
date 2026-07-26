import { applyFilters, sortRows, paginate, loadPapers } from '@/lib/papers.js';
import { highlightSegments } from '@/lib/highlight.js';
import { getSettings, getFavorites, toggleFavorite, isPersistent } from './settings-store.js';

const state = {
  rows: [],          // 全量（或预渲染的种子）
  favorites: new Set(),
  keywords: [],
  query: '',
  publications: [],
  years: [],
  favoritesOnly: false,
  sortKey: null,
  sortDir: 'asc',
  page: 1,
  perPage: 15,
  loaded: false,     // 全量数据是否已到位
};

let i18n = {};
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

function renderTitle(td, title) {
  const patterns = [
    ...(state.query ? [{ text: state.query, cls: 'q-hit' }] : []),
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
    favoritesOnly: state.favoritesOnly,
    favorites: state.favorites,
  });
  const ordered = state.sortKey ? sortRows(filtered, state.sortKey, state.sortDir) : filtered;
  const page = paginate(ordered, state.page, state.perPage);
  state.page = page.page;

  els.tbody.replaceChildren(...page.rows.map(buildRow));
  els.empty.hidden = page.total > 0;

  els.count.textContent = state.loaded
    ? fmt(i18n.total, { __N__: page.total.toLocaleString() })
    : els.count.textContent;
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
    state.loaded = true;
    els.count.textContent = fmt(i18n.total, { __N__: data.length.toLocaleString() });
    render();
  } catch (err) {
    console.warn('[paper-table] 全量数据加载失败，保留预渲染内容', err);
    // 预渲染的 30 行仍在 state.rows 里，页面依旧可读
    showNotice(i18n.loadFailed, true);
  }
}

export async function initPaperTable() {
  const tbody = document.getElementById('ptBody');
  if (!tbody || tbody.dataset.bound) return;
  tbody.dataset.bound = '1';

  i18n = JSON.parse(document.getElementById('ptI18n').textContent);
  els = {
    tbody,
    empty: document.getElementById('ptEmpty'),
    notice: document.getElementById('notice'),
    count: document.getElementById('ptCount'),
    pgInfo: document.getElementById('pgInfo'),
    pgPrev: document.getElementById('pgPrev'),
    pgNext: document.getElementById('pgNext'),
    q: document.getElementById('q'),
    fPub: document.getElementById('fPub'),
    fYear: document.getElementById('fYear'),
    favOnly: document.getElementById('favOnly'),
    clearAll: document.getElementById('clearAll'),
    perPage: document.getElementById('perPage'),
  };

  // 先用内嵌的种子数据当数据源，这样 CDN 失败也有内容可筛
  state.rows = readSeed();

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
    }, 120);
  });

  els.fPub.addEventListener('change', () => {
    state.publications = readDropdown(els.fPub, i18n.anyPublication);
    state.page = 1;
    render();
  });

  els.fYear.addEventListener('change', () => {
    state.years = readDropdown(els.fYear, i18n.anyYear);
    state.page = 1;
    render();
  });

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
    state.favoritesOnly = false;
    state.sortKey = null;
    state.page = 1;
    els.q.value = '';
    for (const d of [els.fPub, els.fYear]) {
      d.querySelectorAll('input:checked').forEach((i) => (i.checked = false));
      d.open = false;
    }
    readDropdown(els.fPub, i18n.anyPublication);
    readDropdown(els.fYear, i18n.anyYear);
    els.favOnly.setAttribute('aria-pressed', 'false');
    els.favOnly.querySelector('span').textContent = '☆';
    document.querySelectorAll('.pt th[data-dir]').forEach((th) => delete th.dataset.dir);
    render();
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

  document.querySelectorAll('.pt th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      state.sortDir = state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc';
      state.sortKey = key;
      document.querySelectorAll('.pt th[data-dir]').forEach((o) => delete o.dataset.dir);
      th.dataset.dir = state.sortDir === 'asc' ? '↑' : '↓';
      render();
    });
  });

  // 行内委托：收藏按钮 + 点标题复制
  tbody.addEventListener('click', async (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      const id = Number(favBtn.dataset.fav);
      const { favorites: next, added } = await toggleFavorite(id);
      state.favorites = new Set(next);
      favBtn.setAttribute('aria-pressed', added ? 'true' : 'false');
      favBtn.textContent = added ? '★' : '☆';
      // 「仅看收藏」开着时取消收藏要让该行立刻消失
      if (state.favoritesOnly) render();
      return;
    }
    if (e.target.closest('a')) return;   // 论文外链交给浏览器
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const title = tr.querySelector('[data-title]')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(title);
      showNotice(i18n.copied, false);
      setTimeout(() => { els.notice.hidden = true; }, 2000);
    } catch {
      /* 无剪贴板权限时静默 */
    }
  });

  render();
  fetchFull();
}
