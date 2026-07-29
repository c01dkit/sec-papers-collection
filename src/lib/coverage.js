import { venuesByCategory } from './venue-groups.js';

/** 矩阵固定 12 列。列数是版面约束（再多横向就滚不下了），不是数据约束。 */
export const MATRIX_SPAN = 12;

/**
 * 矩阵的年份列：以数据里最新的一年收尾，往前数 MATRIX_SPAN 年。
 *
 * 原先这里写死 2015–2026。写死的代价不是「少一列」而是「数据静默消失」：
 * 2027 年的论文既进不了格子（buildGroup 只遍历传进来的 years），也进不了
 * preYears（那个只收早于首列的年份），于是从矩阵里整个蒸发，不报错也不留痕；
 * 同时 Hero 的「覆盖年份」走的是 stats.years，会照实显示到 2027 —— 首页
 * 自己跟自己打架。改成按数据前滚之后，每年自动多一列、掉一列。
 *
 * 用「最新年份往前数」而不是「stats.years 的末 12 项」：后者遇到数据稀疏的
 * 年份（SOSP 双年办那种）会把窗口悄悄拉宽到十几年跨度。日历区间里某一年
 * 真的一篇都没有，就该显示成一整列空格 —— 那是事实，不是缺陷。
 *
 * @param {import('./types.d.ts').Stats} stats
 * @param {number} [span]
 * @returns {string[]}
 */
export function matrixYears(stats, span = MATRIX_SPAN) {
  const years = ((stats && stats.years) || []).map(Number).filter(Number.isFinite);
  if (!years.length) return [];
  const end = Math.max(...years);
  return Array.from({ length: span }, (_, i) => String(end - span + 1 + i));
}

/**
 * 首页矩阵的三个分组，与 venue-groups.js 的 GROUPS 一一对应：安全四大
 * （top）、软工（se）、系统（sys）。名单同样从 overview[].category 推出，
 * 不写死——原因见 venue-groups.js 顶部注释：写死会让 CLAUDE.md 记录的
 * 「改 data.yml + --analyze」加会议流程安静地漏掉矩阵里的新会议。
 *
 * 软工与系统原先合并成一组 se，代价是共用一个 max：ASE 2025 的 389 把
 * 整个系统组压到 alpha 0.2 以下，SOSP/OSDI 那几行深浅几乎看不出变化。
 * 拆开之后每组各自归一，也各自上色（--mx-*-rgb 三套）。
 *
 * @param {import('./types.d.ts').Stats} stats
 * @returns {import('./types.d.ts').MatrixVenues}
 */
export function matrixVenues(stats) {
  const byCat = venuesByCategory(stats);
  return {
    top: byCat.get('top-tier') || [],
    se: byCat.get('software-engineering') || [],
    sys: byCat.get('system') || [],
  };
}

/**
 * @param {Record<string, Record<string, number>>} byPY
 * @param {string[]} names
 * @param {string[]} years
 * @returns {import('./types.d.ts').MatrixGroup}
 */
function buildGroup(byPY, names, years) {
  const firstYear = Number(years[0]);

  const rows = names
    .filter((name) => byPY[name])
    .map((name) => {
      const counts = byPY[name];
      const cells = years.map((y) => (counts[y] ? { year: y, count: counts[y], alpha: 0 } : null));
      const preYears = Object.keys(counts)
        .filter((y) => Number(y) < firstYear)
        .sort((a, b) => Number(a) - Number(b));   // 数值排序：别依赖年份都是四位数
      const preTotal = preYears.reduce((sum, y) => sum + counts[y], 0);
      return { publication: name, cells, preYears, preTotal };
    });

  // 每组各自归一：三组量级各差一截，共用一个 max 会让小组整行淡得看不出
  // 变化——四大峰值 439（USENIX Sec 2025）、软工 389（ASE 2025）、系统
  // 只有 100 上下，系统组若跟着 439 归一，全组 alpha 都挤在 0.2 以下。
  const values = rows.flatMap((r) => r.cells.filter(Boolean).map((c) => c.count));
  const max = Math.max(1, ...values);   // 兜底 1，避免空数据时除零
  for (const row of rows) {
    for (const cell of row.cells) {
      if (cell) cell.alpha = Math.min(1, cell.count / max);
    }
  }

  return { rows, max };
}

/**
 * @param {import('./types.d.ts').Stats} stats
 * @param {string[]} [years] 默认按数据前滚，见 matrixYears
 * @returns {import('./types.d.ts').CoverageMatrix}
 */
export function buildCoverageMatrix(stats, years = matrixYears(stats)) {
  const byPY = (stats && stats.byPublicationAndYear) || {};
  const { top, se, sys } = matrixVenues(stats);
  return {
    years,
    top: buildGroup(byPY, top, years),
    se: buildGroup(byPY, se, years),
    sys: buildGroup(byPY, sys, years),
  };
}
