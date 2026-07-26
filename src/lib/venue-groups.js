// 分组依据 data-statistics.json 里 overview[].category 的三个取值。
// 不硬编码会议名单——名单从实际数据推出，新增会议不用改这里。
const GROUPS = [
  { key: 'top-tier', labelKey: 'abstract.topTier', names: ['IEEE S&P', 'ACM CCS', 'USENIX Sec', 'NDSS'] },
  { key: 'software-engineering', labelKey: 'abstract.softwareEngineering', names: ['ICSE', 'ASE', 'FSE', 'ISSTA'] },
  { key: 'system', labelKey: 'abstract.system', names: ['ASPLOS', 'SOSP'] },
];

export function groupVenues(stats) {
  const byPY = (stats && stats.byPublicationAndYear) || {};
  return GROUPS.map((g) => ({
    key: g.key,
    labelKey: g.labelKey,
    venues: g.names
      .filter((name) => byPY[name])   // 只列真实存在的，避免空选项
      .map((name) => ({
        name,
        years: Object.keys(byPY[name]).sort((a, b) => Number(b) - Number(a)),
        counts: byPY[name],
      })),
  }));
}
