import { venuesByCategory } from './venue-groups.js';

export const MATRIX_YEARS = Array.from({ length: 12 }, (_, i) => String(2015 + i));

/**
 * 首页矩阵的两个分组：安全四大（top-tier）与「软工 + 系统」合并成一行
 * （se）。名单同样从 overview[].category 推出，不写死——原因见
 * venue-groups.js 顶部注释：写死会让 CLAUDE.md 记录的「改 data.yml +
 * --analyze」加会议流程安静地漏掉矩阵里的新会议。
 *
 * @param {import('./types.d.ts').Stats} stats
 * @returns {import('./types.d.ts').MatrixVenues}
 */
export function matrixVenues(stats) {
  const byCat = venuesByCategory(stats);
  return {
    top: byCat.get('top-tier') || [],
    se: [...(byCat.get('software-engineering') || []), ...(byCat.get('system') || [])],
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

  // 每组各自归一：四大与软工/系统量级差一截，共用一个 max 会让
  // ISSTA（44–170）和 SOSP（17–66）整行淡得看不出变化。
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
 * @param {string[]} [years]
 * @returns {import('./types.d.ts').CoverageMatrix}
 */
export function buildCoverageMatrix(stats, years = MATRIX_YEARS) {
  const byPY = (stats && stats.byPublicationAndYear) || {};
  const { top, se } = matrixVenues(stats);
  return {
    years,
    top: buildGroup(byPY, top, years),
    se: buildGroup(byPY, se, years),
  };
}
