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
    // 鼠标点击后主动 blur，把显隐交还给 hover；键盘激活（detail===0）保留焦点。
    const blurOnMouse = (e) => {
      if (e.detail > 0) e.currentTarget.blur();
    };
    misc.querySelector('.misc-btn')?.addEventListener('click', blurOnMouse);
    misc.querySelectorAll('.misc-menu a').forEach((a) => a.addEventListener('click', blurOnMouse));
  }
}
