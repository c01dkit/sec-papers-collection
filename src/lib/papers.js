import { DATA_BASE } from './cdn.js';

const DEFAULT_PAGE_SIZE = 15;

export function applyFilters(rows, criteria) {
  const c = criteria || {};
  const query = String(c.query || '').trim().toLowerCase();
  // 空数组表示「这一维不筛」，不是「筛掉全部」
  const pubSet = c.publications && c.publications.length ? new Set(c.publications) : null;
  const yearSet = c.years && c.years.length ? new Set(c.years.map(Number)) : null;
  const favoritesOnly = Boolean(c.favoritesOnly);
  const favorites = c.favorites instanceof Set ? c.favorites : null;

  return rows.filter((row) => {
    // 用 includes 而非正则：用户可能输入 C++ 或 ( ，正则会误匹配甚至抛错
    if (query && !String(row.title).toLowerCase().includes(query)) return false;
    if (pubSet && !pubSet.has(row.publication)) return false;
    if (yearSet && !yearSet.has(Number(row.year))) return false;
    if (favoritesOnly && !(favorites && favorites.has(row.id))) return false;
    return true;
  });
}

// 只定义主键比较；二级键（id 升序）在 sortRows 里恒定附加。
// 别把二级键写进这里再对整体 reverse() —— 那会把「同年按 id 升序」也翻过来，
// 降序时 [1,2,3,4,5] 会变成 [2,1,4,3,5]，与预期不符。
const PRIMARY = {
  id: (a, b) => a.id - b.id,
  year: (a, b) => a.year - b.year,
  title: (a, b) => String(a.title).localeCompare(String(b.title)),
  publication: (a, b) => String(a.publication).localeCompare(String(b.publication)),
};

export function sortRows(rows, key, dir = 'asc') {
  const primary = PRIMARY[key];
  if (!primary) return [...rows];
  const sign = dir === 'desc' ? -1 : 1;
  // 方向只作用于主键；主键相等时恒按 id 升序
  return [...rows].sort((a, b) => sign * primary(a, b) || a.id - b.id);
}

export function paginate(rows, page, size) {
  const perPage = Number(size) > 0 ? Number(size) : DEFAULT_PAGE_SIZE;
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Number(page) || 1), pageCount);
  const start = (current - 1) * perPage;
  const slice = rows.slice(start, start + perPage);

  return {
    rows: slice,
    page: current,
    pageCount,
    total,
    from: total ? start + 1 : 0,
    to: total ? start + slice.length : 0,
  };
}

export async function loadPapers(fetchImpl) {
  const doFetch = fetchImpl || globalThis.fetch;
  const res = await doFetch(`${DATA_BASE}/data.json`);
  if (!res.ok) throw new Error(`data.json HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('data.json payload is not an array');
  return data;
}
