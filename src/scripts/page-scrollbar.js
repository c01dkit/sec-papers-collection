import { thumbLayout, scrollFromDrag } from '@/lib/scrollbar-geom.js';

// 这两个是模块级状态，活过软导航（CLAUDE.md 不变量 3）。必须显式持有：
// ClientRouter 换页时整个 <body> 被替换，绑在 #pageSb 上的监听器随元素一起
// 消失，但绑在 window / document 上的那几个不会 —— 不拆的话每次跳转都叠一层，
// 而且旧的那层还闭包着已经离开文档的元素，会往一个看不见的 div 上写样式。
// 这里不用 dataset.bound 那套幂等守卫：元素每次都是全新的，本来就该重绑。
let ctrl;
let ro;

export function initPageScrollbar() {
  ctrl?.abort();
  ro?.disconnect();
  ro = undefined;

  const sb = document.getElementById('pageSb');
  if (!sb) return;

  ctrl = new AbortController();
  const { signal } = ctrl;

  let hovering = false;
  let dragging = false;
  let ticking = false;
  let hideTimer;
  let startY = 0;
  let startScroll = 0;
  let geom = null;

  function layout() {
    geom = thumbLayout({
      viewport: window.innerHeight,
      content: document.documentElement.scrollHeight,
      scrollY: window.scrollY,
      // 两端留白只写在 CSS 里（.page-sb 的 top），这里读回来，免得同一个数字
      // 在两处各存一份、改一处忘一处
      inset: parseFloat(getComputedStyle(sb).top) || 0,
    });
    if (!geom) {
      sb.classList.remove('visible');
      return false;
    }
    sb.style.height = `${geom.height}px`;
    sb.style.transform = `translateY(${geom.offset}px)`;
    return true;
  }

  function show(linger) {
    if (!layout()) return;
    sb.classList.add('visible');
    clearTimeout(hideTimer);
    if (linger) hideTimer = setTimeout(() => sb.classList.remove('visible'), 900);
  }

  const sync = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      // 指针在页面里（或正在拖）时常驻；靠滚轮/键盘滚的才滚完淡出
      show(!hovering && !dragging);
    });
  };

  addEventListener('scroll', sync, { passive: true, signal });
  addEventListener('resize', sync, { passive: true, signal });

  // 光靠 scroll/resize 不够：检索页改一次筛选就换掉整张表，文档高度能从几十屏
  // 掉到一屏，而这个过程里一次 scroll 事件都没有 —— 滑块会一直停在旧长度，
  // 直到用户下次滚动才纠正。ResizeObserver 在 jsdom 里没有，所以要探测。
  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(() => layout());
    ro.observe(document.documentElement);
  }

  document.addEventListener(
    'mousemove',
    () => {
      if (hovering) return;
      hovering = true;
      show(false);
    },
    { passive: true, signal }
  );

  document.documentElement.addEventListener(
    'mouseleave',
    () => {
      hovering = false;
      if (dragging) return;
      clearTimeout(hideTimer);
      sb.classList.remove('visible');
    },
    { signal }
  );

  sb.addEventListener(
    'pointerdown',
    (e) => {
      if (!layout()) return;
      // 挡掉按下时的文本选中，否则拖到一半整页会被刷蓝
      e.preventDefault();
      dragging = true;
      sb.classList.add('dragging');
      sb.setPointerCapture(e.pointerId);
      startY = e.clientY;
      startScroll = window.scrollY;
    },
    { signal }
  );

  sb.addEventListener(
    'pointermove',
    (e) => {
      if (!dragging || !geom) return;
      const top = scrollFromDrag({
        startScroll,
        deltaY: e.clientY - startY,
        travel: geom.travel,
        scrollable: geom.scrollable,
      });
      // 必须显式 instant：global.css 给 html 开了 scroll-behavior:smooth，
      // 走 window.scrollTo(0, y) 会让每一次 pointermove 都排一段缓动动画，
      // 拖动手感变成橡皮筋，滑块永远追不上指针。
      window.scrollTo({ top, behavior: 'instant' });
    },
    { signal }
  );

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    sb.classList.remove('dragging');
    if (!hovering) show(true);
  };
  sb.addEventListener('pointerup', endDrag, { signal });
  sb.addEventListener('pointercancel', endDrag, { signal });

  // 先把几何量好，但不加 .visible：刚进页面还没人动过，不该凭空闪一条出来
  layout();
}
