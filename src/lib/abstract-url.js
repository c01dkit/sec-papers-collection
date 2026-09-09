// 摘要页的「当前届次」<-> URL 查询串。
//   /zh/abstract/?pub=IEEE+S%26P&year=2025
// 参数名与检索页（search-url.js）保持一致：pub / year。
// 首页收录矩阵的格子、以及分享出去的地址都靠这个契约落到具体届次上。

/**
 * @param {{ pub?: string, year?: string | number } | null | undefined} sel
 * @returns {string}  '?pub=…&year=…' 或 ''（缺任一项时）
 */
export function writeAbstractParams(sel) {
  const pub = String(sel?.pub ?? '').trim();
  const year = String(sel?.year ?? '').trim();
  if (!pub || !year) return '';
  const p = new URLSearchParams();
  p.set('pub', pub);
  p.set('year', year);
  return `?${p.toString()}`;
}

/**
 * @param {string | undefined} search  location.search（带不带问号都行）
 * @returns {{ pub: string, year: string } | null}
 */
export function readAbstractParams(search) {
  const p = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const pub = (p.get('pub') || '').trim();
  const year = (p.get('year') || '').trim();
  if (!pub || !/^\d{4}$/.test(year)) return null;
  return { pub, year };
}

/**
 * @param {string} lang
 * @param {string} pub
 * @param {string | number} year
 * @returns {string}
 */
export function abstractHref(lang, pub, year) {
  return `/${lang}/abstract/${writeAbstractParams({ pub, year })}`;
}
