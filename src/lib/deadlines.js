const ISO_DATE = /(\d{4})-(\d{2})-(\d{2})/;

/**
 * 把截止日字符串解析成本地午夜的 Date。
 * 不能用 new Date('2026-06-04')：那会被当成 UTC 午夜，在 UTC-x 时区会退到前一天。
 * 区间（含 ~）取结束日；'TBA' 之类返回 null 由调用方跳过。
 */
export function parseDeadlineDate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const part = raw.includes('~') ? raw.split('~').pop() : raw;
  const m = String(part).trim().match(ISO_DATE);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function localMidnight(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function flattenDeadlines(timeline) {
  const out = [];
  for (const pub of timeline || []) {
    for (const cycle of pub.cycles || []) {
      for (const ddl of cycle.ddls || []) {
        const date = parseDeadlineDate(ddl.date);
        if (!date) continue;
        out.push({
          publication: pub.publication,
          cycle: cycle.name,
          stage: ddl.stage,
          iso: ddl.date,
          date,
        });
      }
    }
  }
  return out;
}

/**
 * 首页倒计时用。规则（spec §9.6）：
 *   - 只显示未来的截止日，按日期升序；
 *   - 未来不足 want 条时，用最近的已过期项补齐并标 past；
 *   - 一条未来的都没有 → placeholder=true，绝不显示负天数。
 */
export function pickUpcomingDeadlines(timeline, today, want = 3) {
  const flat = flattenDeadlines(timeline);
  if (!flat.length) return { items: [], placeholder: true };

  const base = localMidnight(today);
  const dayMs = 86400000;

  const future = flat.filter((d) => d.date >= base).sort((a, b) => a.date - b.date);
  if (!future.length) return { items: [], placeholder: true };

  const past = flat.filter((d) => d.date < base).sort((a, b) => b.date - a.date);

  const toItem = (d, isPast) => ({
    publication: d.publication,
    cycle: d.cycle,
    stage: d.stage,
    iso: d.iso,
    daysLeft: Math.round((d.date - base) / dayMs),
    past: isPast,
  });

  const items = future.slice(0, want).map((d) => toItem(d, false));
  for (const d of past) {
    if (items.length >= want) break;
    items.push(toItem(d, true));
  }

  return { items, placeholder: false };
}
