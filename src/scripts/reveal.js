export function initReveal() {
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
