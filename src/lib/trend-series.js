const LABEL_KEYS = {
  'top-tier': 'abstract.topTier',
  'software-engineering': 'abstract.softwareEngineering',
  system: 'abstract.system',
};

const ORDER = ['top-tier', 'software-engineering', 'system'];

export function buildSeries(stats) {
  const overview = (stats && stats.overview) || [];
  if (!overview.length) return [];

  const byCategory = new Map();
  for (const item of overview) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }

  return ORDER.filter((c) => byCategory.has(c)).map((category) => {
    const items = byCategory.get(category);
    const years = [...new Set(items.flatMap((i) => Object.keys(i.map_data)))].sort(
      (a, b) => Number(a) - Number(b)
    );
    return {
      category,
      labelKey: LABEL_KEYS[category] ?? category,
      years,
      // null 而非 0：该会议当年没办，Chart.js 应当断线而不是画一条掉到零的假谷底
      series: items.map((i) => ({
        label: i.label,
        data: years.map((y) => (i.map_data[y] == null ? null : i.map_data[y])),
      })),
    };
  });
}
