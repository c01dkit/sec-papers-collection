import { describe, it, expect } from 'vitest';
import { totalPapers, groupByAward, groupByYear, pickHighlights } from '@/lib/awards-model.js';
import awards from '@/assets/data/awards.json';

const CONF = {
  publication: 'TEST',
  awards: [
    { name: 'Best Paper', papers: [{ year: 2025, title: 'B1' }, { year: 2024, title: 'B2' }] },
    { name: 'Distinguished', papers: [{ year: 2025, title: 'D1' }] },
  ],
};

describe('totalPapers', () => {
  it('累加所有奖项下的论文数', () => {
    expect(totalPapers(CONF)).toBe(3);
  });

  it('没有奖项时为 0', () => {
    expect(totalPapers({ awards: [] })).toBe(0);
  });
});

describe('groupByAward', () => {
  it('每个奖项一组，保留原顺序，并给每篇挂上 awardName', () => {
    const g = groupByAward(CONF);
    expect(g.map((x) => x.label)).toEqual(['Best Paper', 'Distinguished']);
    expect(g[0].count).toBe(2);
    expect(g[0].papers[0].awardName).toBe('Best Paper');
  });

  it('key 唯一且带前缀', () => {
    const g = groupByAward(CONF);
    expect(new Set(g.map((x) => x.key)).size).toBe(g.length);
    expect(g[0].key).toBe('award-Best Paper');
  });
});

describe('groupByYear', () => {
  it('按年份降序分组', () => {
    const g = groupByYear(CONF);
    expect(g.map((x) => x.label)).toEqual(['2025', '2024']);
    expect(g[0].count).toBe(2);      // B1 + D1
    expect(g[1].count).toBe(1);      // B2
  });

  it('同年内不同奖项都带上 awardName', () => {
    const g = groupByYear(CONF);
    expect(g[0].papers.map((p) => p.awardName).sort()).toEqual(['Best Paper', 'Distinguished']);
  });
});

describe('pickHighlights', () => {
  it('取最新年份，且优先来自不同会议', () => {
    const picks = pickHighlights(awards, 2);
    expect(picks).toHaveLength(2);
    expect(new Set(picks.map((p) => p.publication)).size).toBe(2);
    const maxYear = Math.max(
      ...awards.flatMap((c) => c.awards.flatMap((a) => a.papers.map((p) => p.year)))
    );
    expect(picks[0].year).toBe(maxYear);
  });

  it('每条都带齐渲染所需字段', () => {
    for (const p of pickHighlights(awards, 2)) {
      expect(p).toHaveProperty('publication');
      expect(p).toHaveProperty('awardName');
      expect(p).toHaveProperty('year');
      expect(typeof p.title).toBe('string');
      expect(p.title.length).toBeGreaterThan(0);
    }
  });

  it('结果稳定：同一输入两次调用完全一致', () => {
    expect(pickHighlights(awards, 2)).toEqual(pickHighlights(awards, 2));
  });

  it('空输入返回空数组', () => {
    expect(pickHighlights([], 2)).toEqual([]);
    expect(pickHighlights(undefined, 2)).toEqual([]);
  });
});
