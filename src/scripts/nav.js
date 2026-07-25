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

    // 菜单的显隐由 CSS 的 :hover / :focus-within 决定，aria-expanded 必须跟着它走。
    // 只在 HTML 里写死 aria-expanded="false" 的话，菜单在视觉上打开时读屏软件
    // 仍会播报「已折叠」—— 控件对辅助技术说了假话。
    const setExpanded = (open) => btn?.setAttribute('aria-expanded', open ? 'true' : 'false');

    misc.addEventListener('mouseenter', () => setExpanded(true));
    misc.addEventListener('mouseleave', () => {
      // 鼠标移开但焦点还在组内时，:focus-within 让菜单仍然是开着的
      if (!misc.contains(document.activeElement)) setExpanded(false);
    });
    misc.addEventListener('focusin', () => setExpanded(true));
    misc.addEventListener('focusout', () => {
      // focusout 早于新焦点落位，下一帧再判断焦点去了哪里
      requestAnimationFrame(() => {
        if (!misc.contains(document.activeElement)) setExpanded(false);
      });
    });

    // Escape 收起：把焦点移出组，让 :focus-within 释放
    misc.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      btn?.blur();
      misc.querySelectorAll('.misc-menu a').forEach((a) => a.blur());
      setExpanded(false);
    });

    // 鼠标点击后主动 blur，把显隐交还给 hover；键盘激活（detail===0）保留焦点。
    const blurOnMouse = (e) => {
      if (e.detail > 0) e.currentTarget.blur();
    };
    btn?.addEventListener('click', blurOnMouse);
    misc.querySelectorAll('.misc-menu a').forEach((a) => a.addEventListener('click', blurOnMouse));
  }
}
