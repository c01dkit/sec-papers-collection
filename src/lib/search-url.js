// 检索页的筛选状态 <-> URL 查询串。
//   /zh/search/?q=fuzz&pub=IEEE+S%26P&pub=NDSS&year=2025&topic=23&topic=32&type=6
// 多值用重复参数（会议名含空格与 &，逗号拼接会出事）。
// 「仅看收藏」是本地状态，不进 URL。
// 读取时未知的值直接丢弃：URL 里的筛选一定能在控件上看见，不会出现「看不见的筛选」。

const MULTI = [
  ['pub', 'publications'],
  ['year', 'years'],
  ['topic', 'topics'],
  ['type', 'types'],
];

/**
 * @param {string | undefined} search  location.search（带不带问号都行）
 * @param {{ publications?: Set<string>, years?: Set<string>, topics?: Set<string>, types?: Set<string> } | undefined} valid
 */
export function readSearchParams(search, valid) {
  const p = new URLSearchParams(String(search || '').replace(/^\?/, ''));
  const keep = (field, values) => {
    const ok = valid?.[field];
    return ok instanceof Set ? values.filter((v) => ok.has(v)) : values;
  };
  const out = { query: (p.get('q') || '').trim() };
  for (const [param, field] of MULTI) out[field] = keep(field, p.getAll(param));
  return out;
}

/**
 * @param {{ query?: string, publications?: (string|number)[], years?: (string|number)[], topics?: string[], types?: string[] } | undefined} state
 * @returns {string}  '?q=…' 或 ''
 */
export function writeSearchParams(state) {
  const p = new URLSearchParams();
  const q = String(state?.query || '').trim();
  if (q) p.set('q', q);
  for (const [param, field] of MULTI) {
    for (const v of state?.[field] || []) p.append(param, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}
