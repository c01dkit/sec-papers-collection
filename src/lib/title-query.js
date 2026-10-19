// 检索页标题查询的编译：子串模式 / 正则模式 -> 匹配函数 + 高亮 pattern。
// applyFilters（筛选）与 paper-table.js（高亮、输入框的无效态）共用这一处，
// 两边对「这个查询命中什么」的理解才不会分家。
//
// 两种模式都大小写不敏感、都先 trim（与 search-url.js 读写 URL 时一致）。
// 子串模式保持 includes：用户输入 C++ 或 ( 时不能误匹配甚至抛错。
// 正则模式不加 g 标志 —— 带 g 的 RegExp.test 会记住 lastIndex，同一个对象
// 连续测两行，第二行会从上一行的命中位置之后开始找，结果时对时错。

/**
 * @typedef {{ match: ((title: string) => boolean) | null,
 *             highlight: { text: string } | { re: RegExp } | null,
 *             error: boolean }} TitleQuery
 */

/** @type {TitleQuery} */
const NONE = Object.freeze({ match: null, highlight: null, error: false });

/**
 * @param {unknown} query
 * @param {boolean} [regex]
 * @returns {TitleQuery}
 *   match 为 null 表示「这一维不筛」—— 空查询如此，无效正则也如此（error: true），
 *   后者交给调用方把输入框标成无效，而不是把整张表清空。
 */
export function compileTitleQuery(query, regex = false) {
  const q = String(query ?? '').trim();
  if (!q) return NONE;

  if (!regex) {
    const needle = q.toLowerCase();
    return {
      match: (title) => String(title).toLowerCase().includes(needle),
      highlight: { text: q },
      error: false,
    };
  }

  let re;
  try {
    re = new RegExp(q, 'i');
  } catch {
    return { ...NONE, error: true };
  }
  return { match: (title) => re.test(String(title)), highlight: { re }, error: false };
}
