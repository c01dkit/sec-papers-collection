// tag 的解析与查表。tag 的结构见 docs/id-rule.md 第 2 节：
//   t[0] 类型码（0-9），t[1:2] topic 码（2 位大写 hex），t[3] 奖项码。
// 码 -> 名的表来自 src/assets/data/topics.json（由 analyzers/id_taxonomy.py 导出），
// 本模块不硬写任何主题名。

const DEFAULT_TAG = Object.freeze({ type: '0', topic: '00', award: 'N' });
const TAG_RE = /^[0-9][0-9A-F]{2}[A-Z]$/;

/** 两个哨兵码：未分类 / 不属于任何分类。它们不在任何分组里，索引页与下拉单独列。 */
export const SENTINEL_TOPICS = ['00', 'FF'];

/**
 * @param {unknown} tag
 * @returns {import('./types.d.ts').ParsedTag}
 */
export function parseTag(tag) {
  if (typeof tag !== 'string' || !TAG_RE.test(tag)) return { ...DEFAULT_TAG };
  return { type: tag[0], topic: tag.slice(1, 3), award: tag[3] };
}

/**
 * @param {import('./types.d.ts').TaxonomyName | undefined} name
 * @param {string} lang
 * @returns {string | undefined}
 */
export function localName(name, lang) {
  if (!name) return undefined;
  return (lang === 'zh' ? name.zh : name.en) ?? name.en;
}

/**
 * @param {import('./types.d.ts').Taxonomy | undefined} taxonomy
 * @param {string} code
 * @param {string} lang
 */
export function topicLabel(taxonomy, code, lang) {
  return localName(taxonomy?.topics?.[code], lang) ?? code;
}

/**
 * @param {import('./types.d.ts').Taxonomy | undefined} taxonomy
 * @param {string} code
 * @param {string} lang
 */
export function typeLabel(taxonomy, code, lang) {
  return localName(taxonomy?.types?.[code], lang) ?? code;
}

/**
 * 当前语言的 码 -> 名，类型与主题各一张。检索页（#ptTax）与摘要页（#abTax）把它内嵌给
 * 页面脚本，预渲染与运行期造出来的行才用同一份文字。约 6KB 未压缩。
 *
 * @param {import('./types.d.ts').Taxonomy} taxonomy
 * @param {string} lang
 * @returns {{ types: Record<string, string>, topics: Record<string, string> }}
 */
export function codeNames(taxonomy, lang) {
  /** @param {Record<string, import('./types.d.ts').TaxonomyName>} table */
  const names = (table) =>
    Object.fromEntries(Object.entries(table).map(([code, n]) => [code, localName(n, lang) ?? code]));
  return { types: names(taxonomy.types), topics: names(taxonomy.topics) };
}

// 2 位大写 hex 的字典序就是数值序，所以直接比字符串
const inRange = (code, lo, hi) => code >= lo && code <= hi;
const sum = (xs) => xs.reduce((s, x) => s + x.count, 0);

// 显式 .sort() 不是多余的：topics.json 虽按码写入，但 Object.keys 会把 '10'…'99'
// 这类整数样的键排到 '00'…'0F' 前面（V8 的整数键优先规则）。去掉排序，下拉与索引页
// 的顺序就会静默乱掉。
function topicsIn(taxonomy, lo, hi) {
  return Object.keys(taxonomy.topics)
    .filter((code) => !SENTINEL_TOPICS.includes(code) && inRange(code, lo, hi))
    .sort();
}

/**
 * 检索页「主题」下拉的分组选项。只含篇数 > 0 的主题；哨兵码（若有篇数）收在末尾一组，
 * 组名由调用方从 i18n 传入 —— 本模块不碰文案。
 *
 * @param {import('./types.d.ts').Taxonomy} taxonomy
 * @param {Partial<import('./types.d.ts').Stats> | undefined} stats
 * @param {string} lang
 * @param {string} tailLabel
 * @returns {import('./types.d.ts').FilterGroup[]}
 */
export function topicOptions(taxonomy, stats, lang, tailLabel) {
  const counts = stats?.byTopic || {};
  const option = (code) => ({ value: code, label: topicLabel(taxonomy, code, lang), count: counts[code] });
  const groups = [];
  for (const g of taxonomy.groups) {
    const options = topicsIn(taxonomy, g.lo, g.hi).filter((code) => (counts[code] || 0) > 0).map(option);
    if (options.length) groups.push({ label: localName(g, lang) ?? g.en, options });
  }
  const tail = SENTINEL_TOPICS.filter((code) => (counts[code] || 0) > 0).map(option);
  if (tail.length) groups.push({ label: tailLabel, options: tail });
  return groups;
}

/**
 * 检索页「类型」下拉的选项，只含篇数 > 0 的类型。
 *
 * @param {import('./types.d.ts').Taxonomy} taxonomy
 * @param {Partial<import('./types.d.ts').Stats> | undefined} stats
 * @param {string} lang
 * @returns {import('./types.d.ts').FilterOption[]}
 */
export function typeOptions(taxonomy, stats, lang) {
  const counts = stats?.byType || {};
  return Object.keys(taxonomy.types)
    .filter((code) => (counts[code] || 0) > 0)
    .sort()
    .map((code) => ({ value: code, label: typeLabel(taxonomy, code, lang), count: counts[code] }));
}

/**
 * 主题索引页的数据：段 -> 组 -> 主题（含 0 篇的），外加哨兵行、类型行、合计。
 * `max` 是段内最大篇数，横条按段内归一（与首页覆盖矩阵同一做法）。
 *
 * stats 缺 byTopic / byType 时抛错：那是 data-statistics.json 过期，
 * 让 astro build 失败比渲染一张全零的索引页诚实。
 *
 * @param {import('./types.d.ts').Taxonomy} taxonomy
 * @param {import('./types.d.ts').Stats | undefined} stats
 * @param {string} lang
 * @returns {import('./types.d.ts').TopicIndex}
 */
export function buildTopicIndex(taxonomy, stats, lang) {
  if (!stats || !stats.byTopic || !stats.byType) {
    throw new Error('data-statistics.json 缺少 byTopic / byType —— 先跑 uv run main.py --analyze');
  }
  const counts = stats.byTopic;
  const entry = (code) => ({ code, label: topicLabel(taxonomy, code, lang), count: counts[code] || 0 });

  const bands = taxonomy.bands.map((b) => {
    const groups = taxonomy.groups
      .filter((g) => g.band === b.key)
      .map((g) => {
        const topics = topicsIn(taxonomy, g.lo, g.hi).map(entry);
        return { lo: g.lo, hi: g.hi, label: localName(g, lang) ?? g.en, total: sum(topics), topics };
      });
    const all = groups.flatMap((g) => g.topics);
    return {
      key: b.key,
      label: localName(b, lang) ?? b.en,
      total: sum(all),
      max: all.reduce((m, t) => Math.max(m, t.count), 0),
      groups,
    };
  });

  const sentinels = SENTINEL_TOPICS.map(entry);
  const types = Object.keys(taxonomy.types)
    .sort()
    .map((code) => ({ code, label: typeLabel(taxonomy, code, lang), count: stats.byType[code] || 0 }));
  const total = Number(stats.total) || 0;
  return { bands, sentinels, types, total, classified: total - (counts['00'] || 0) };
}
