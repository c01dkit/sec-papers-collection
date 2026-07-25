import { describe, it, expect } from 'vitest';
import { buildTotalTrend, toSparkline } from '@/lib/sparkline.js';
import stats from '@/assets/data/data-statistics.json';

describe('toSparkline', () => {
  it('两点线性映射：y 轴翻转，峰值贴顶', () => {
    const s = toSparkline([{ count: 1 }, { count: 2 }], { width: 100, height: 40 });
    expect(s.max).toBe(2);
    expect(s.coords).toEqual([[0, 20], [100, 0]]);
    expect(s.line).toBe('0,20 100,0');
  });

  it('area 闭合到底边', () => {
    const s = toSparkline([{ count: 1 }, { count: 2 }], { width: 100, height: 40 });
    expect(s.area).toBe('M0,20 L100,0 L100,40 L0,40 Z');
  });

  it('单点不除零', () => {
    const s = toSparkline([{ count: 5 }], { width: 100, height: 40 });
    expect(s.coords).toEqual([[0, 0]]);
  });

  it('全零数据不产出 NaN', () => {
    const s = toSparkline([{ count: 0 }, { count: 0 }], { width: 100, height: 40 });
    expect(s.line).not.toContain('NaN');
    expect(s.coords).toEqual([[0, 40], [100, 40]]);
  });
});

describe('buildTotalTrend', () => {
  it('按给定年份取 byYear，缺年补 0', () => {
    const pts = buildTotalTrend({ byYear: { 2015: 10, 2017: 30 } }, ['2015', '2016', '2017']);
    expect(pts).toEqual([
      { year: '2015', count: 10 },
      { year: '2016', count: 0 },
      { year: '2017', count: 30 },
    ]);
  });

  it('真实数据 2015→2025 起点 894 终点 2342', () => {
    const years = Array.from({ length: 11 }, (_, i) => String(2015 + i));
    const pts = buildTotalTrend(stats, years);
    expect(pts[0]).toEqual({ year: '2015', count: 894 });
    expect(pts[10]).toEqual({ year: '2025', count: 2342 });
  });
});
