export function initAwardsView() {
  const bar = document.querySelector('.bar');
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
