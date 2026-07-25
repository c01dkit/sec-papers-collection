import { parseDeadlineDate } from '@/lib/deadlines.js';

/**
 * 首页倒计时的客户端刷新。构建时嵌入的天数在部署当天正确，之后会过期；
 * 这里按访客本地时区重算，并在所有截止日都已过去时切成占位文案 ——
 * 否则数据断更后首页会显示「还剩 −30 天」。
 *
 * 日期解析**必须复用 parseDeadlineDate**，不要在这里自己写正则。区间日期
 * （'2026-05-01 ~ 2026-05-10'）该取的是 ~ 之后的结束日；早先这里用
 * /(\d{4})-(\d{2})-(\d{2})/ 取第一个匹配，于是构建时用结束日、客户端用开始日，
 * 同一条截止日在两处算出的天数不一样。
 */
export function initCountdown() {
  const box = document.querySelector('[data-countdown]');
  if (!box || box.dataset.bound) return;
  box.dataset.bound = '1';

  const rows = [...box.querySelectorAll('[data-ddl]')];
  if (!rows.length) return;

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let anyFuture = false;

  for (const row of rows) {
    const date = parseDeadlineDate(row.dataset.ddl);
    if (!date) continue;
    const days = Math.round((date - base) / 86400000);

    const slot = row.querySelector('[data-days]');
    if (days >= 0) {
      anyFuture = true;
      row.classList.remove('past');
      if (slot) slot.textContent = String(days);
    } else {
      row.classList.add('past');
      // 已过期的行不显示负天数
      if (slot) slot.closest('.num')?.replaceChildren(document.createTextNode('—'));
    }
  }

  if (!anyFuture) {
    const ph = document.createElement('div');
    ph.className = 'ph';
    ph.textContent = box.dataset.placeholder || '';
    box.replaceChildren(ph);
  }
}
