// 数据契约的单一出处。src/lib/*.js 用 JSDoc 的 import('./types.d.ts') 引用，
// .astro frontmatter 用 `import type` 引用。
//
// 为什么需要这个文件：lib 里的函数是纯 JS 且参数无标注，返回值因此推成 any，
// 而 .astro 的 frontmatter 是按 TypeScript 检查的 —— 模板里每个
// `xs.map((x) => …)` 的 x 都成了隐式 any，`astro check` 报一片 ts(7006)。
// 在源头把形状写清楚，类型就能一路流到模板，不必在几十个回调上补 `: any`。
//
// 年份键**一律是字符串**（'2015'）：JSON 的对象键本来就只能是字符串，
// byYear / map_data / counts 都得用 Record<string, …> 索引。误当数字索引
// 会在 noImplicitAny 下当场报错，这正是想要的效果。

// ── src/assets/data/data-statistics.json ──────────────────────────

/**
 * overview[] 的一项。fill / borderColor / tension 是 Chart.js 的样式字段，本站不读，故不列。
 *
 * map_data 的值是 `number | undefined` 而不是 `number`：每个会议只有自己办过的
 * 那些年份，`map_data['2001']` 对 IEEE S&P 就是 undefined。这也不只是求稳 ——
 * 各会议年份集合不同，TS 从 JSON 推出的 overview 元素类型是个并集，缺的年份被补成
 * `'2001'?: undefined`，写成 Record<string, number> 时整个 overview 都赋不进来。
 */
export interface OverviewItem {
  category: string;
  label: string;
  map_data: Record<string, number | undefined>;
}

export interface Stats {
  total: number;
  overview: OverviewItem[];
  byPublication: Record<string, number>;
  byYear: Record<string, number>;
  byPublicationAndYear: Record<string, Record<string, number>>;
  byPublicationAndYearAndStatus: Record<string, Record<string, string>>;
  years: string[];
}

// ── src/assets/data/data.json、data-quick-view.json ────────────────

/** 论文行。abstract 只存在于 meta_json/[Publication - Year].json，列表数据里没有。 */
export interface Paper {
  /** 7 字符永久标识，如 'IO25001'。见 docs/id-rule.md。收藏功能以此为主键。 */
  id: string;
  /** 4 字符可变标签（类型 + topic + 奖项），如 '1A3N'。目前不在 UI 中展示。 */
  tag: string;
  year: number;
  title: string;
  category: string;
  publication: string;
  paper: string;
  status: string;
  abstract?: string;
}

// ── src/assets/data/submission-timeline.json ──────────────────────

export interface TimelineDdl {
  stage: string;
  /** 原始字符串，可能是区间（'2026-05-01 ~ 2026-05-10'）或 'TBA'。 */
  date: string;
  value?: string;
}

export interface TimelineCycle {
  name: string;
  ddls: TimelineDdl[];
}

export interface TimelinePublication {
  publication: string;
  cycles: TimelineCycle[];
  timezone?: string;
  url?: string;
  update?: string;
  date?: string;
  place?: string;
}

// ── src/assets/data/awards.json ───────────────────────────────────

export interface AwardPaper {
  year: number;
  title: string;
}

export interface Award {
  name: string;
  papers: AwardPaper[];
}

export interface AwardConference {
  publication: string;
  awards: Award[];
}

// ── lib/awards-model.js 的产物 ────────────────────────────────────

/** 分组后的论文，比 AwardPaper 多带一个奖项名（分组按年份时靠它显示奖项）。 */
export interface AwardGroupPaper extends AwardPaper {
  awardName: string;
}

export interface AwardGroup {
  key: string;
  label: string;
  count: number;
  papers: AwardGroupPaper[];
}

export interface AwardHighlight {
  publication: string;
  awardName: string;
  year: number;
  title: string;
}

// ── lib/coverage.js 的产物 ────────────────────────────────────────

export interface MatrixCell {
  year: string;
  count: number;
  /** 0..1 的组内相对强度；上色前还会被 CoverageMatrix.astro 压到 0.06..0.50。 */
  alpha: number;
}

export interface MatrixRow {
  publication: string;
  /** 与 CoverageMatrix.years 一一对应；该年没有数据时是 null，不是 0。 */
  cells: (MatrixCell | null)[];
  preYears: string[];
  preTotal: number;
}

export interface MatrixGroup {
  rows: MatrixRow[];
  max: number;
}

export interface CoverageMatrix {
  years: string[];
  top: MatrixGroup;
  se: MatrixGroup;
  sys: MatrixGroup;
}

export interface MatrixVenues {
  top: string[];
  se: string[];
  sys: string[];
}

// ── lib/deadlines.js 的产物 ───────────────────────────────────────

export interface FlatDeadline {
  publication: string;
  cycle: string;
  stage: string;
  dateText: string;
  date: Date;
}

export interface DeadlineItem {
  publication: string;
  cycle: string;
  stage: string;
  dateText: string;
  /** 已过期的项恒为 null —— 绝不返回负天数，理由见 deadlines.js 里的长注释。 */
  daysLeft: number | null;
  past: boolean;
}

export interface UpcomingDeadlines {
  items: DeadlineItem[];
  placeholder: boolean;
}

// ── lib/trend-series.js 的产物 ────────────────────────────────────

export interface TrendSeries {
  label: string;
  /** 该会议当年没办时是 null 而非 0，好让 Chart.js 断线。 */
  data: (number | null)[];
}

export interface TrendGroup {
  category: string;
  labelKey: string;
  years: string[];
  series: TrendSeries[];
}

// ── lib/venue-groups.js 的产物 ────────────────────────────────────

export interface VenueEntry {
  name: string;
  years: string[];
  counts: Record<string, number>;
}

export interface VenueGroup {
  key: string;
  labelKey: string;
  venues: VenueEntry[];
}

// ── lib/sparkline.js 的产物 ───────────────────────────────────────

export interface TrendPoint {
  year: string;
  count: number;
}

export interface Sparkline {
  max: number;
  coords: number[][];
  line: string;
  area: string;
}

// ── src/data/changelog.js ─────────────────────────────────────────

export interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

// ── 组件用的小结构 ────────────────────────────────────────────────

/** FilterDropdown 的一个选项。count 可缺省（缺省时不渲染右侧计数）。 */
export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}
