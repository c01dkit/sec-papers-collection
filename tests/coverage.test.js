import { describe, it, expect } from 'vitest';
import { buildCoverageMatrix, matrixYears, MATRIX_SPAN } from '@/lib/coverage.js';
import stats from '@/assets/data/data-statistics.json';

describe('matrixYears', () => {
  it('以数据最新的一年收尾，往前数 12 列', () => {
    const ys = matrixYears(stats);
    expect(ys).toHaveLength(MATRIX_SPAN);
    expect(ys.at(-1)).toBe(String(Math.max(...stats.years.map(Number))));
    expect(ys[0]).toBe(String(Number(ys.at(-1)) - MATRIX_SPAN + 1));
  });

  it('数据往后长一年，窗口跟着前滚 —— 这是写死年份时会静默丢数据的那个场景', () => {
    const ys = matrixYears({ years: [...stats.years, '2027'] });
    expect(ys.at(-1)).toBe('2027');
    expect(ys[0]).toBe('2016');
    expect(ys).not.toContain('2015');   // 掉出窗口的最早一年折进 preYears
  });

  it('日历区间里空缺的年份照样占一列，不把窗口拉宽', () => {
    // stats.years 是「有数据的年份」，稀疏。若按「末 12 项」取，1994/2000
    // 这种孤点会把跨度悄悄拉到几十年。这里验的是按日历取。
    const ys = matrixYears({ years: ['1994', '2000', '2025', '2026'] });
    expect(ys).toEqual([
      '2015', '2016', '2017', '2018', '2019', '2020',
      '2021', '2022', '2023', '2024', '2025', '2026',
    ]);
  });

  it('没有年份数据时返回空数组而不是崩', () => {
    expect(matrixYears({})).toEqual([]);
    expect(matrixYears({ years: [] })).toEqual([]);
    expect(matrixYears(null)).toEqual([]);
  });
});

describe('buildCoverageMatrix', () => {
  const m = buildCoverageMatrix(stats);

  it('三组行数与实际会议名单一致', () => {
    // 字面量数组而非引用生成它们的同一个常量——原先这条拿 TOP_TIER/SE_SYS
    // 自己跟自己比，天然循环，永远不可能变红。
    expect(m.top.rows.map((r) => r.publication)).toEqual(['IEEE S&P', 'ACM CCS', 'USENIX Sec', 'NDSS']);
    expect(m.se.rows.map((r) => r.publication)).toEqual(['ICSE', 'ASE', 'FSE', 'ISSTA']);
    expect(m.sys.rows.map((r) => r.publication)).toEqual(['ASPLOS', 'SOSP', 'OSDI']);
  });

  it('软工与系统是两组，不再合并 —— 系统组不跟着软工峰值归一', () => {
    // 这条是拆组的理由本身：合并时两组共用 max 389，ASPLOS 2024 的 198
    // 只能拿到 alpha 0.51，SOSP 那种几十篇的行整行挤在 0.1 以下看不出深浅。
    // 拆开后系统组以 198 归一，同一批数字铺满 0..1。
    const asplos = m.sys.rows.find((r) => r.publication === 'ASPLOS');
    const peak = asplos.cells.find((c) => c && c.year === '2024');
    expect(peak.alpha).toBe(1);
    expect(peak.count / m.se.max).toBeLessThan(0.55);   // 合并时它只能到这个深度
  });

  it('三组各自归一 —— 峰值互不相同，不能共用一个 max', () => {
    expect(m.top.max).toBe(454);   // USENIX Sec 2025
    expect(m.se.max).toBe(389);    // ASE 2025
    expect(m.sys.max).toBe(198);   // ASPLOS 2024
    expect(new Set([m.top.max, m.se.max, m.sys.max]).size).toBe(3);
  });

  it('峰值格的 alpha 为 1，其余小于 1', () => {
    const usenix = m.top.rows.find((r) => r.publication === 'USENIX Sec');
    const peak = usenix.cells.find((c) => c && c.year === '2025');
    expect(peak.alpha).toBe(1);
    const y2015 = usenix.cells.find((c) => c && c.year === '2015');
    expect(y2015.alpha).toBeLessThan(1);
    expect(y2015.alpha).toBeGreaterThan(0);
  });

  // 下面两条钉的是「首列边界」的行为，跟窗口具体落在哪 12 年无关，所以显式
  // 传窗口。用默认值的话，明年数据前滚到 2016–2027，SOSP 2015 会滑进
  // preYears、preTotal 从 210 变 240 —— 测试变红，但它想守的东西没坏。
  const FIXED = Array.from({ length: 12 }, (_, i) => String(2015 + i));
  const f = buildCoverageMatrix(stats, FIXED);

  it('该年没办的会议是 null 格而非 0 格', () => {
    const sosp = f.sys.rows.find((r) => r.publication === 'SOSP');
    expect(sosp.cells[FIXED.indexOf('2016')]).toBeNull();   // SOSP 双年办，2016 没有
    expect(sosp.cells[FIXED.indexOf('2015')]).not.toBeNull();
  });

  it('早于首列的数据收进 preYears / preTotal，不占列', () => {
    const sosp = f.sys.rows.find((r) => r.publication === 'SOSP');
    expect(sosp.preYears).toContain('2001');
    expect(sosp.preYears).toContain('2013');
    expect(sosp.preYears.every((y) => Number(y) < 2015)).toBe(true);
    expect(sosp.preTotal).toBe(210);           // 17+21+66+25+23+28+30

    const spp = f.top.rows.find((r) => r.publication === 'IEEE S&P');
    expect(spp.preYears).toEqual([]);
    expect(spp.preTotal).toBe(0);
  });

  it('每行的格子数等于列数', () => {
    for (const row of [...m.top.rows, ...m.se.rows, ...m.sys.rows]) {
      expect(row.cells).toHaveLength(m.years.length);
    }
  });

  it('空数据不炸，max 兜底为 1 避免除零', () => {
    const empty = buildCoverageMatrix({ byPublicationAndYear: {} });
    for (const g of ['top', 'se', 'sys']) {
      expect(empty[g].rows).toEqual([]);
      expect(empty[g].max).toBe(1);
    }
  });
});
