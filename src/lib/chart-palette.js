// 每个 category 各一张图、每张最多 4 条线，所以 4 个颜色就够 —— 不需要 10 个。
// 这让低饱和的编辑风配色仍能保持可辨识度。
//
// 颜色不写死在这里：Chart.js 会把颜色烤进实例，构建那一刻之后不会再跟着
// CSS 变量走，但这不代表颜色本身该是这个文件里的十六进制字面量——那样明暗
// 切换就有两份数据源（tokens.css 一份、这里又一份），也违反「颜色只认
// 设计系统自定义属性，Chart.js 也不例外」的规矩。真正的值放在 tokens.css
// 的 --chart-1..--chart-4（明暗各一套），跟首页覆盖矩阵用的 --mx-top-rgb/
// --mx-se-rgb 同一个路数：固定、不随用户选的 --accent 变，只随明暗切换。
// 这里只存变量名；调用方（trends-chart.js）在构建图表那一刻用
// getComputedStyle 读出当时的具体值——跟同一个文件里 --faint/--muted 等
// 颜色的取法一致。主题一变，MutationObserver 触发的重建自然读到新值。
export const SERIES_COLORS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4'];

// 低饱和配色下光靠颜色区分不够稳，给后两条线加虚线做冗余编码
export const SERIES_DASH = [[], [], [5, 3], [2, 3]];

/**
 * @param {number} index 第几条线（0-based）
 * @param {(name: string) => string} cssVar 读取 CSS 自定义属性的函数，
 *   由调用方传入（它需要 document，这个模块本身不摸 DOM，纯函数、好测）。
 */
export function seriesStyle(index, cssVar) {
  return {
    borderColor: cssVar(SERIES_COLORS[index % SERIES_COLORS.length]),
    borderDash: SERIES_DASH[index % SERIES_DASH.length],
  };
}
