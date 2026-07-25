export const TOP_TIER = ['IEEE S&P', 'ACM CCS', 'USENIX Sec', 'NDSS'];
export const SE_SYS = ['ICSE', 'ASE', 'FSE', 'ISSTA', 'ASPLOS', 'SOSP'];
export const MATRIX_YEARS = Array.from({ length: 12 }, (_, i) => String(2015 + i));

function buildGroup(byPY, names, years) {
  const firstYear = Number(years[0]);

  const rows = names
    .filter((name) => byPY[name])
    .map((name) => {
      const counts = byPY[name];
      const cells = years.map((y) => (counts[y] ? { year: y, count: counts[y], alpha: 0 } : null));
      const preYears = Object.keys(counts)
        .filter((y) => Number(y) < firstYear)
        .sort();
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

export function buildCoverageMatrix(stats, years = MATRIX_YEARS) {
  const byPY = (stats && stats.byPublicationAndYear) || {};
  return {
    years,
    top: buildGroup(byPY, TOP_TIER, years),
    se: buildGroup(byPY, SE_SYS, years),
  };
}
