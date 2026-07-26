import { describe, it, expect } from 'vitest';
import { groupVenues } from '@/lib/venue-groups.js';
import stats from '@/assets/data/data-statistics.json';

describe('groupVenues', () => {
  const groups = groupVenues(stats);

  it('三组：安全四大 / 软工 / 系统', () => {
    expect(groups.map((g) => g.key)).toEqual(['top-tier', 'software-engineering', 'system']);
  });

  it('每组的文案 key 指向 abstract.* 且两语存在', () => {
    expect(groups.map((g) => g.labelKey)).toEqual([
      'abstract.topTier',
      'abstract.softwareEngineering',
      'abstract.system',
    ]);
  });

  it('只列出数据里真实存在的会议 —— 避免出现空选项', () => {
    const all = groups.flatMap((g) => g.venues.map((v) => v.name));
    expect(all).toHaveLength(10);
    for (const name of all) {
      expect(stats.byPublicationAndYear[name]).toBeTruthy();
    }
  });

  it('不含数据里没有的会议（原实现硬编码里残留的 TSE）', () => {
    const all = groups.flatMap((g) => g.venues.map((v) => v.name));
    expect(all).not.toContain('TSE');
  });

  it('每个会议的年份按降序排列，最新在前', () => {
    for (const g of groups) {
      for (const v of g.venues) {
        const nums = v.years.map(Number);
        expect(nums).toEqual([...nums].sort((a, b) => b - a));
      }
    }
  });

  it('年份只来自该会议真实办过的届次', () => {
    const sosp = groups.flatMap((g) => g.venues).find((v) => v.name === 'SOSP');
    expect(sosp.years).not.toContain('2016');
    expect(sosp.years).toContain('2025');
  });

  it('空数据返回三个空组而不是崩', () => {
    const empty = groupVenues({ byPublicationAndYear: {} });
    expect(empty).toHaveLength(3);
    expect(empty.every((g) => g.venues.length === 0)).toBe(true);
  });
});
