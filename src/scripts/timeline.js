import { parseDeadlineDate } from '@/lib/deadlines.js';

const fmt = (tpl, map) => Object.entries(map).reduce((s, [k, v]) => s.replaceAll(k, v), tpl);

export function initTimeline() {
  const root = document.querySelector('.pub');
  if (!root || root.dataset.bound) return;
  root.dataset.bound = '1';

  const i18n = JSON.parse(document.getElementById('tlI18n').textContent);
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 逐个 cycle 独立标注：每个周期各有自己的「下一站」
  for (const cycle of document.querySelectorAll('[data-cycle]')) {
    const steps = [...cycle.querySelectorAll('.step[data-ddl]')];
    let marked = false;

    for (const step of steps) {
      const date = parseDeadlineDate(step.dataset.ddl);
      const slot = step.querySelector('[data-days]');
      if (!date) continue;

      const days = Math.round((date - base) / 86400000);

      if (days < 0) {
        step.classList.add('past');
        continue;
      }

      // 第一个未过期的就是这个周期的「下一站」
      if (!marked) {
        step.classList.add('next');
        marked = true;
        if (slot) slot.textContent = days === 0 ? i18n.today : fmt(i18n.daysLeft, { __N__: String(days) });
      }
    }
  }
}
