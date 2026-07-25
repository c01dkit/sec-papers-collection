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
          dateText: ddl.date,   // 原始字符串，可能是区间；可计算的日期在 date 里
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
    // dateText 是给人看的原始字符串，区间日期会保留成 '2026-05-01 ~ 2026-05-10'。
    // 刻意不叫 iso：它并不总是可被 new Date() 解析的 ISO 串，叫 iso 会诱使
    // 消费方直接 new Date(it.iso)。要拿可计算的日期请用 parseDeadlineDate()。
    dateText: d.dateText,
    // 已过期的项不给天数。曾经这里对过期项也算差值，于是会返回 daysLeft: -13
    // 这样的值 —— 字段名叫 daysLeft，消费方极容易直接渲染成「还剩 -13 天」，
    // 而那正是这个模块存在的理由。给 null 能让误用当场显形，
    // 而不是安静地把一个负数印到首页上。
    daysLeft: isPast ? null : Math.round((d.date - base) / dayMs),
    past: isPast,
  });

  const items = future.slice(0, want).map((d) => toItem(d, false));
  for (const d of past) {
    if (items.length >= want) break;
    items.push(toItem(d, true));
  }

  return { items, placeholder: false };
}
