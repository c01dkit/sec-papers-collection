export function initAwardsView() {
  // 必须按 id 取。document.querySelector('.bar') 会先命中 TopNav 的
  // <div class="wrap bar">（它在 DOM 里更靠前），于是监听挂错元素、页面上
  // 所有按钮都点不动；更糟的是 dataset.bound 被写到了 TopNav 上，而 TopNav
  // 跨软导航一直存在，从此这个 init 永远早退。
  const bar = document.getElementById('awBar');
  if (!bar || bar.dataset.bound) return;
  bar.dataset.bound = '1';

  const conferences = [...document.querySelectorAll('[data-conf-panel]')];
  let mode = 'award';

  const showConf = (name) => {
    for (const panel of conferences) {
      panel.hidden = panel.dataset.confPanel !== name;
    }
    for (const tab of bar.querySelectorAll('.tab')) {
      tab.setAttribute('aria-selected', tab.dataset.conf === name ? 'true' : 'false');
    }
  };

  const showMode = (next) => {
    mode = next;
    for (const panel of document.querySelectorAll('[data-group-panel]')) {
      panel.hidden = panel.dataset.groupPanel !== mode;
    }
    for (const btn of bar.querySelectorAll('.gt')) {
      btn.setAttribute('aria-pressed', btn.dataset.group === mode ? 'true' : 'false');
    }
  };

  bar.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (tab) return showConf(tab.dataset.conf);
    const gt = e.target.closest('.gt');
    if (gt) return showMode(gt.dataset.group);
  });
}
