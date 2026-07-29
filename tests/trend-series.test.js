import { describe, it, expect } from 'vitest';
import { buildSeries } from '@/lib/trend-series.js';
import { SERIES_COLORS, seriesStyle } from '@/lib/chart-palette.js';
import stats from '@/assets/data/data-statistics.json';

describe('buildSeries', () => {
  const groups = buildSeries(stats);

  it('三张图，对应三个 category', () => {
    expect(groups.map((g) => g.category)).toEqual(['top-tier', 'software-engineering', 'system']);
  });

  it('每张图的线数不超过配色数', () => {
    for (const g of groups) {
      expect(g.series.length).toBeLessThanOrEqual(SERIES_COLORS.length);
    }
  });

  it('同一张图内所有线共用同一条年份轴', () => {
    for (const g of groups) {
      for (const s of g.series) {
        expect(s.data).toHaveLength(g.years.length);
      }
    }
  });

  it('年份轴升序', () => {
    for (const g of groups) {
      const nums = g.years.map(Number);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    }
  });

  it('该会议当年没办时数据点是 null，让 Chart.js 断线而不是画成 0', () => {
    const sys = groups.find((g) => g.category === 'system');
    const sosp = sys.series.find((s) => s.label === 'SOSP');
    const i2016 = sys.years.indexOf('2016');
    if (i2016 >= 0) expect(sosp.data[i2016]).toBeNull();
  });

  it('真实数据点对得上', () => {
    const top = groups.find((g) => g.category === 'top-tier');
    const usenix = top.series.find((s) => s.label === 'USENIX Sec');
    expect(usenix.data[top.years.indexOf('2025')]).toBe(454);
  });

  it('不再引用 PrimeVue 的 CSS 变量名', () => {
    const json = JSON.stringify(groups);
    expect(json).not.toContain('--p-');
  });

  it('空数据返回空数组而不是崩', () => {
    expect(buildSeries({ overview: [] })).toEqual([]);
    expect(buildSeries({})).toEqual([]);
  });
});

describe('seriesStyle', () => {
  // 注入取值函数（而不是传 isDark）正是这次配色改法的理由 —— 那就得真测它。
  const fake = (name) => `resolved(${name})`;

  it('按序取色，超过 4 条线时回绕', () => {
    expect(seriesStyle(0, fake).borderColor).toBe('resolved(--chart-1)');
    expect(seriesStyle(3, fake).borderColor).toBe('resolved(--chart-4)');
    expect(seriesStyle(4, fake).borderColor).toBe('resolved(--chart-1)');
  });

  it('后两条线带虚线，做颜色之外的冗余编码', () => {
    expect(seriesStyle(0, fake).borderDash).toEqual([]);
    expect(seriesStyle(1, fake).borderDash).toEqual([]);
    expect(seriesStyle(2, fake).borderDash).toEqual([5, 3]);
    expect(seriesStyle(3, fake).borderDash).toEqual([2, 3]);
  });

  it('交出去的是解析后的值，不是变量名 —— Chart.js 不认 var()', () => {
    expect(seriesStyle(0, fake).borderColor).not.toMatch(/^--/);
  });
});

describe('SERIES_COLORS', () => {
  it('至少 4 个，且互不相同', () => {
    expect(SERIES_COLORS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(SERIES_COLORS).size).toBe(SERIES_COLORS.length);
  });
});
