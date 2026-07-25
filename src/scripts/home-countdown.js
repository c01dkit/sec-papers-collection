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
  const daysLabel = box.dataset.daysLabel || '';
  const passedLabel = box.dataset.passedLabel || '';
  let anyFuture = false;

  for (const row of rows) {
    const date = parseDeadlineDate(row.dataset.ddl);
    if (!date) continue;
    const days = Math.round((date - base) / 86400000);

    const slot = row.querySelector('[data-days]');
    const unit = row.querySelector('.unit');

    // 两个方向都要处理，且互为逆操作：构建时已过期的行也可能因访客所在时区
    // 而翻回未来。所以每个分支都把 class、天数、单位三者一并写到位，
    // 不能只改其中一两个 —— 那样会留下「样式说未过期、文字说已截止」的行。
    if (days >= 0) {
      anyFuture = true;
      row.classList.remove('past');
      if (slot) slot.textContent = String(days);
      if (unit) unit.textContent = daysLabel ? ` ${daysLabel}` : '';
    } else {
      row.classList.add('past');
      if (slot) slot.textContent = passedLabel;   // 绝不写负数
      if (unit) unit.textContent = '';
    }
  }

  if (!anyFuture) {
    const ph = document.createElement('div');
    ph.className = 'ph';
    ph.textContent = box.dataset.placeholder || '';
    box.replaceChildren(ph);
  }
}
