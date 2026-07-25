export function totalPapers(conf) {
  return (conf.awards || []).reduce((sum, a) => sum + (a.papers || []).length, 0);
}

export function groupByAward(conf) {
  return (conf.awards || []).map((award) => ({
    key: `award-${award.name}`,
    label: award.name,
    count: (award.papers || []).length,
    papers: (award.papers || []).map((p) => ({ ...p, awardName: award.name })),
  }));
}

export function groupByYear(conf) {
  const buckets = new Map();
  for (const award of conf.awards || []) {
    for (const paper of award.papers || []) {
      const year = String(paper.year);
      if (!buckets.has(year)) buckets.set(year, []);
      buckets.get(year).push({ ...paper, awardName: award.name });
    }
  }
  return [...buckets.keys()]
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({
      key: `year-${year}`,
      label: year,
      count: buckets.get(year).length,
      papers: buckets.get(year),
    }));
}

/**
 * 首页获奖精选。确定性排序（年份降序 → 会议名 → 标题），
 * 再贪心地优先凑不同会议 —— 结果进构建产物，不能随调用变化。
 */
export function pickHighlights(awards, n = 2) {
  const flat = [];
  for (const conf of awards || []) {
    for (const award of conf.awards || []) {
      for (const paper of award.papers || []) {
        flat.push({
          publication: conf.publication,
          awardName: award.name,
          year: paper.year,
          title: paper.title,
        });
      }
    }
  }

  flat.sort(
    (a, b) =>
      b.year - a.year ||
      a.publication.localeCompare(b.publication) ||
      a.title.localeCompare(b.title)
  );

  const picked = [];
  const seenPubs = new Set();
  for (const item of flat) {
    if (picked.length >= n) break;
    if (seenPubs.has(item.publication)) continue;
    picked.push(item);
    seenPubs.add(item.publication);
  }
  // 会议数不够 n 时放宽「不同会议」的要求补齐
  for (const item of flat) {
    if (picked.length >= n) break;
    if (!picked.includes(item)) picked.push(item);
  }

  return picked;
}
