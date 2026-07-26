// 会议名单从 data-statistics.json 的 overview[].category 推出，不写死。
// CLAUDE.md 记的加会议流程是「改 data.yml，跑 --analyze」——纯数据操作。
// 名单写死在前端的话，那个流程会安静地产出一个缺会议的站点：没有报错、
// 没有空分组，就是查不到，得有人肉眼发现。
const GROUPS = [
  { key: 'top-tier', labelKey: 'abstract.topTier' },
  { key: 'software-engineering', labelKey: 'abstract.softwareEngineering' },
  { key: 'system', labelKey: 'abstract.system' },
];

// ORDER 只决定已知会议的展示顺序，不决定谁进得来。没列进来的新会议排在
// 本组末尾——顺序不理想总好过被丢掉。
const ORDER = ['IEEE S&P', 'ACM CCS', 'USENIX Sec', 'NDSS', 'ICSE', 'ASE', 'FSE', 'ISSTA', 'ASPLOS', 'SOSP'];
const rank = (name) => {
  const i = ORDER.indexOf(name);
  return i === -1 ? ORDER.length : i;
};

/** 从 overview 推出「分类 → 会议名数组」，供本模块与 coverage.js 共用。 */
export function venuesByCategory(stats) {
  const out = new Map();
  for (const s of (stats && stats.overview) || []) {
    if (!s || !s.category || !s.label) continue;
    if (!out.has(s.category)) out.set(s.category, []);
    out.get(s.category).push(s.label);
  }
  for (const list of out.values()) list.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  return out;
}

export function groupVenues(stats) {
  const byPY = (stats && stats.byPublicationAndYear) || {};
  const byCat = venuesByCategory(stats);
  return GROUPS.map((g) => ({
    key: g.key,
    labelKey: g.labelKey,
    venues: (byCat.get(g.key) || [])
      .filter((name) => byPY[name])   // 只列真实存在的，避免空选项
      .map((name) => ({
        name,
        years: Object.keys(byPY[name]).sort((a, b) => Number(b) - Number(a)),
        counts: byPY[name],
      })),
  }));
}
