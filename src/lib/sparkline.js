/**
 * @param {import('./types.d.ts').Stats} stats
 * @param {string[]} years
 * @returns {import('./types.d.ts').TrendPoint[]}
 */
export function buildTotalTrend(stats, years) {
  const byYear = (stats && stats.byYear) || {};
  return years.map((y) => ({ year: y, count: byYear[y] ?? 0 }));
}

/**
 * @param {import('./types.d.ts').TrendPoint[]} points
 * @param {{ width?: number, height?: number, decimals?: number }} [opts]
 * @returns {import('./types.d.ts').Sparkline}
 */
export function toSparkline(points, { width = 100, height = 40, decimals = 2 } = {}) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const round = (n) => Number(n.toFixed(decimals));

  const coords = points.map((p, i) => [round(i * step), round(height - (p.count / max) * height)]);
  const line = coords.map((c) => c.join(',')).join(' ');
  const area = `M${coords.map((c) => c.join(',')).join(' L')} L${round(width)},${round(height)} L0,${round(height)} Z`;

  return { max, coords, line, area };
}
