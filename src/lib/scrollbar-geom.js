/**
 * 自绘页面滚动条的几何计算。纯函数，不碰 DOM。
 *
 * 单独拆出来是因为「滑轨上下各留一段空白」把原本一眼能看懂的三行公式变成了
 * 两套坐标系：视口坐标（0 … viewport）和滑轨坐标（inset … viewport-inset）。
 * 滑块长度按滑轨算、位移也按滑轨算，唯独 CSS 的 top 已经把 inset 吃掉了，
 * 所以 offset 是相对滑轨顶端的、不能再加一次 inset —— 这类差一项的错误在
 * 浏览器里只表现为「滚到底时下面多出/少了十几像素」，几乎不可能靠肉眼定位。
 */

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

/** 滑块最短多少像素。太短的滑块既抓不住，也读不出「还剩多少」。 */
export const MIN_THUMB = 32;

/**
 * @param {object} p
 * @param {number} p.viewport   视口高度（window.innerHeight）
 * @param {number} p.content    文档总高（documentElement.scrollHeight）
 * @param {number} p.scrollY    当前滚动位置
 * @param {number} [p.inset]    滑轨上下两端各留的空白
 * @param {number} [p.minThumb] 滑块最短长度
 * @returns {{height:number, offset:number, travel:number, scrollable:number}|null}
 *   不可滚动（或滑轨被 inset 吃光）时返回 null —— 调用方据此把滑块整条藏掉，
 *   而不是画一根占满滑轨的假滑块。
 */
export function thumbLayout({ viewport, content, scrollY, inset = 0, minThumb = MIN_THUMB }) {
  const scrollable = content - viewport;
  const track = viewport - inset * 2;
  // 用 > 0 而不是 >= 0，顺带挡掉 NaN：任一入参缺失时整个表达式为 false，
  // 返回 null（藏起来），不会把 NaN 写进 style.height 变成一条隐形的坏元素。
  if (!(scrollable > 0) || !(track > 0)) return null;

  const height = clamp(track * (viewport / content), Math.min(minThumb, track), track);
  const travel = track - height;
  const offset = travel > 0 ? clamp(scrollY / scrollable, 0, 1) * travel : 0;

  return { height, offset, travel, scrollable };
}

/**
 * 拖动滑块时，指针的纵向位移换算成目标滚动位置。
 *
 * @param {object} p
 * @param {number} p.startScroll 按下时的 scrollY
 * @param {number} p.deltaY      指针相对按下点的纵向位移
 * @param {number} p.travel      滑块在滑轨里能走的距离（thumbLayout 给出）
 * @param {number} p.scrollable  文档能滚的距离（thumbLayout 给出）
 * @returns {number} 已夹在 [0, scrollable] 内的目标位置
 */
export function scrollFromDrag({ startScroll, deltaY, travel, scrollable }) {
  if (!(travel > 0)) return startScroll;
  return clamp(startScroll + (deltaY / travel) * scrollable, 0, scrollable);
}
