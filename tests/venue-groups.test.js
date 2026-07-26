import { describe, it, expect } from 'vitest';
import { groupVenues } from '@/lib/venue-groups.js';
import stats from '@/assets/data/data-statistics.json';
import zh from '@/i18n/zh.json';
import en from '@/i18n/en.json';

describe('groupVenues', () => {
  const groups = groupVenues(stats);

  it('三组：安全四大 / 软工 / 系统', () => {
    expect(groups.map((g) => g.key)).toEqual(['top-tier', 'software-engineering', 'system']);
  });

  it('每组的文案 key 指向 abstract.*', () => {
    expect(groups.map((g) => g.labelKey)).toEqual([
      'abstract.topTier',
      'abstract.softwareEngineering',
      'abstract.system',
    ]);
  });

  it('这些 key 在两份 locale 里都真的存在', () => {
    // 原来这条的名字里写着「两语存在」却根本没查 locale。t() 缺 key 会抛，
    // 所以缺了会在构建时炸——但那是构建的功劳，不是这条测试的。要么真查，要么改名。
    for (const g of groups) {
      const [ns, key] = g.labelKey.split('.');
      expect(zh[ns]?.[key], `zh ${g.labelKey}`).toBeTruthy();
      expect(en[ns]?.[key], `en ${g.labelKey}`).toBeTruthy();
    }
  });

  it('新增会议只要出现在 overview 里就会被列出 —— 不用改前端代码', () => {
    // 这是本次修复的回归测试。CLAUDE.md 记的加会议流程是纯数据操作
    // （改 data.yml + 跑 --analyze）。名单一旦写死在前端，那个流程会安静地
    // 产出一个缺会议的站点：不报错、不空组，只是查不到。
    const withNew = {
      ...stats,
      overview: [...stats.overview, { category: 'top-tier', label: 'FancySec' }],
      byPublicationAndYear: { ...stats.byPublicationAndYear, FancySec: { 2026: 7 } },
    };
    const top = groupVenues(withNew).find((g) => g.key === 'top-tier');
    expect(top.venues.map((v) => v.name)).toContain('FancySec');
    // 没列进 ORDER 的排在本组末尾，而不是被丢掉
    expect(top.venues.at(-1).name).toBe('FancySec');
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
