// 检索页的筛选状态 <-> URL 查询串。
//   /zh/search/?q=fuzz&pub=IEEE+S%26P&pub=NDSS&year=2025&topic=23&topic=32&type=6
//   /zh/search/?q=%5E(fuzz%7Ctaint)&re=1            （re=1：查询词按正则解释）
// 多值用重复参数（会议名含空格与 &，逗号拼接会出事）。
// re 只跟着非空的 q 出现：没有查询词时正则开关不改变任何结果，不该挂在地址栏里。
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
  const query = (p.get('q') || '').trim();
  const out = { query, regex: Boolean(query) && p.get('re') === '1' };
  for (const [param, field] of MULTI) out[field] = keep(field, p.getAll(param));
  return out;
}

/**
 * @param {{ query?: string, regex?: boolean, publications?: (string|number)[], years?: (string|number)[], topics?: string[], types?: string[] } | undefined} state
 * @returns {string}  '?q=…' 或 ''
 */
export function writeSearchParams(state) {
  const p = new URLSearchParams();
  const q = String(state?.query || '').trim();
  if (q) p.set('q', q);
  if (q && state?.regex) p.set('re', '1');
  for (const [param, field] of MULTI) {
    for (const v of state?.[field] || []) p.append(param, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}
