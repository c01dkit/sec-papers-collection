export function initReveal() {
  // 先立旗，再 early-return。这面旗的语义是「揭示机制跑到了」，
  // BaseLayout 内联脚本里的保险靠它判断要不要撤掉 reveal-on（详见那边的注释）。
  // 放在 early-return 之前是有意的：没有可揭示元素同样属于「跑到了」，
  // 而挂在 window 上（不是 documentElement 的 dataset）是因为软导航时
  // Astro 的 swapRootAttributes 会覆盖根元素属性，window 不受影响。
  window.__spcRevealReady = 1;

  const els = document.querySelectorAll('html.reveal-on [data-reveal]:not(.in)');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        // 同一父级内按序号错开，让一组元素依次浮现而非齐刷刷跳出
        const i = el.parentElement ? [].indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
        el.classList.add('in');
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.1 }
  );

  els.forEach((el) => io.observe(el));
}
