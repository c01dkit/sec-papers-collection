export function initNav() {
  const hdr = document.getElementById('siteHeader');
  const toggle = document.getElementById('navToggle');

  if (hdr && toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = '1';
    toggle.addEventListener('click', () => {
      const open = hdr.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    hdr.querySelectorAll('.core a').forEach((a) =>
      a.addEventListener('click', () => {
        hdr.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  const misc = document.getElementById('miscGroup');
  if (misc && !misc.dataset.bound) {
    misc.dataset.bound = '1';
    const btn = misc.querySelector('.misc-btn');
    const menu = misc.querySelector('.misc-menu');

    // 菜单显隐完全由 CSS 决定（:hover 或 :focus-within 任一成立即展开）。
    // aria-expanded 不去用 JS 复现那套规则，而是**读 CSS 的结论** ——
    // 直接查 computed display。
    //
    // 为什么必须这样：早先的版本用各个事件分别推断状态，结果鼠标悬停时点一下
    // 按钮就错位 —— blurOnMouse 的 blur 触发 focusout，JS 据此判定「已折叠」，
    // 但 :hover 仍然成立、菜单在视觉上还开着，于是读屏播报与实际相反，
    // 而且要等鼠标真正离开才恢复。读结论而不是推规则，这一整类错位都不存在。
    const syncExpanded = () => {
      if (!btn || !menu) return;
      const open = getComputedStyle(menu).display !== 'none';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    // 统一延到下一帧：focus 与 hover 引起的样式变化在本轮事件里可能还没落定
    const scheduleSync = () => requestAnimationFrame(syncExpanded);

    // mouseenter/mouseleave 不冒泡，挂在组上正好只关心组的边界；
    // focusin/focusout 冒泡，因此也能捕获三个链接的进出。
    for (const evt of ['mouseenter', 'mouseleave', 'focusin', 'focusout']) {
      misc.addEventListener(evt, scheduleSync);
    }

    // Escape 收起：把焦点移出组，让 :focus-within 释放。
    // 若此时鼠标仍悬停在组上，菜单依然是开着的 —— syncExpanded 会如实报告 true，
    // 因为那确实是 CSS 的结论。
    misc.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (misc.contains(document.activeElement)) document.activeElement.blur();
      scheduleSync();
    });

    // 鼠标点击后主动 blur，把显隐交还给 hover；键盘激活（detail===0）保留焦点。
    const blurOnMouse = (e) => {
      if (e.detail > 0) e.currentTarget.blur();
    };
    btn?.addEventListener('click', blurOnMouse);
    menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', blurOnMouse));
  }

  // 语言切换时记住选择，供下次访问 / 时分发
  const langLink = document.querySelector('a[data-lang-target]');
  if (langLink && !langLink.dataset.bound) {
    langLink.dataset.bound = '1';
    langLink.addEventListener('click', () => {
      try {
        localStorage.setItem('spc-lang', langLink.dataset.langTarget);
      } catch {
        /* 隐私模式下忽略 */
      }
    });
  }
}
