import { describe, it, expect } from 'vitest';
import { buildCoverageMatrix, TOP_TIER, SE_SYS, MATRIX_YEARS } from '@/lib/coverage.js';
import stats from '@/assets/data/data-statistics.json';

describe('MATRIX_YEARS', () => {
  it('是 2015 到 2026 共 12 列', () => {
    expect(MATRIX_YEARS).toHaveLength(12);
    expect(MATRIX_YEARS[0]).toBe('2015');
    expect(MATRIX_YEARS[11]).toBe('2026');
  });
});

describe('buildCoverageMatrix', () => {
  const m = buildCoverageMatrix(stats);

  it('两组行数与常量一致', () => {
    expect(m.top.rows.map((r) => r.publication)).toEqual(TOP_TIER);
    expect(m.se.rows.map((r) => r.publication)).toEqual(SE_SYS);
  });

  it('两组各自归一 —— 峰值不同，不能共用一个 max', () => {
    expect(m.top.max).toBe(439);   // USENIX Sec 2025
    expect(m.se.max).toBe(389);    // ASE 2025
    expect(m.top.max).not.toBe(m.se.max);
  });

  it('峰值格的 alpha 为 1，其余小于 1', () => {
    const usenix = m.top.rows.find((r) => r.publication === 'USENIX Sec');
    const peak = usenix.cells.find((c) => c && c.year === '2025');
    expect(peak.alpha).toBe(1);
    const y2015 = usenix.cells.find((c) => c && c.year === '2015');
    expect(y2015.alpha).toBeLessThan(1);
    expect(y2015.alpha).toBeGreaterThan(0);
  });

  it('该年没办的会议是 null 格而非 0 格', () => {
    const sosp = m.se.rows.find((r) => r.publication === 'SOSP');
    const i2016 = MATRIX_YEARS.indexOf('2016');
    expect(sosp.cells[i2016]).toBeNull();      // SOSP 双年办，2016 没有
    const i2015 = MATRIX_YEARS.indexOf('2015');
    expect(sosp.cells[i2015]).not.toBeNull();
  });

  it('2015 年之前的数据收进 preYears / preTotal，不占列', () => {
    const sosp = m.se.rows.find((r) => r.publication === 'SOSP');
    expect(sosp.preYears).toContain('2001');
    expect(sosp.preYears).toContain('2013');
    expect(sosp.preYears.every((y) => Number(y) < 2015)).toBe(true);
    expect(sosp.preTotal).toBe(210);           // 17+21+66+25+23+28+30

    const spp = m.top.rows.find((r) => r.publication === 'IEEE S&P');
    expect(spp.preYears).toEqual([]);
    expect(spp.preTotal).toBe(0);
  });

  it('每行的格子数等于列数', () => {
    for (const row of [...m.top.rows, ...m.se.rows]) {
      expect(row.cells).toHaveLength(MATRIX_YEARS.length);
    }
  });

  it('空数据不炸，max 兜底为 1 避免除零', () => {
    const empty = buildCoverageMatrix({ byPublicationAndYear: {} });
    expect(empty.top.rows).toEqual([]);
    expect(empty.top.max).toBe(1);
  });
});
