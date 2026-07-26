import { describe, it, expect } from 'vitest';
import { applyFilters, sortRows, paginate, loadPapers } from '@/lib/papers.js';

const ROWS = [
  { id: 1, year: 2026, title: 'Bridge: High-Order Taint Detection', publication: 'IEEE S&P' },
  { id: 2, year: 2026, title: 'Camveil: Coordinated Fuzzing', publication: 'IEEE S&P' },
  { id: 3, year: 2025, title: 'Directed Greybox Fuzzing', publication: 'ACM CCS' },
  { id: 4, year: 2025, title: 'Formal Verification of TLS', publication: 'NDSS' },
  { id: 5, year: 2024, title: 'A Study of C++ Templates', publication: 'ACM CCS' },
];

describe('applyFilters', () => {
  it('无条件时原样返回', () => {
    expect(applyFilters(ROWS, {})).toHaveLength(5);
    expect(applyFilters(ROWS, undefined)).toHaveLength(5);
  });

  it('标题子串匹配，大小写不敏感', () => {
    expect(applyFilters(ROWS, { query: 'fuzz' }).map((r) => r.id)).toEqual([2, 3]);
    expect(applyFilters(ROWS, { query: 'FUZZ' }).map((r) => r.id)).toEqual([2, 3]);
  });

  it('查询词首尾空白被忽略', () => {
    expect(applyFilters(ROWS, { query: '  fuzz  ' }).map((r) => r.id)).toEqual([2, 3]);
  });

  it('纯空白查询等于无查询', () => {
    expect(applyFilters(ROWS, { query: '   ' })).toHaveLength(5);
  });

  it('查询词含正则特殊字符时按字面匹配，不炸也不误匹配', () => {
    expect(applyFilters(ROWS, { query: 'C++' }).map((r) => r.id)).toEqual([5]);
    expect(() => applyFilters(ROWS, { query: '(' })).not.toThrow();
    expect(applyFilters(ROWS, { query: '(' })).toEqual([]);
  });

  it('会议多选取并集', () => {
    expect(applyFilters(ROWS, { publications: ['ACM CCS'] }).map((r) => r.id)).toEqual([3, 5]);
    expect(applyFilters(ROWS, { publications: ['ACM CCS', 'NDSS'] }).map((r) => r.id)).toEqual([3, 4, 5]);
  });

  it('年份多选取并集，字符串与数字都认', () => {
    expect(applyFilters(ROWS, { years: [2025] }).map((r) => r.id)).toEqual([3, 4]);
    expect(applyFilters(ROWS, { years: ['2025'] }).map((r) => r.id)).toEqual([3, 4]);
  });

  it('多个维度之间取交集', () => {
    const out = applyFilters(ROWS, { query: 'fuzz', publications: ['ACM CCS'] });
    expect(out.map((r) => r.id)).toEqual([3]);
  });

  it('空数组视为「不筛这一维」而非「筛掉全部」', () => {
    expect(applyFilters(ROWS, { publications: [], years: [] })).toHaveLength(5);
  });

  it('仅看收藏', () => {
    const favorites = new Set([2, 5]);
    expect(applyFilters(ROWS, { favoritesOnly: true, favorites }).map((r) => r.id)).toEqual([2, 5]);
  });

  it('仅看收藏但收藏为空时返回空', () => {
    expect(applyFilters(ROWS, { favoritesOnly: true, favorites: new Set() })).toEqual([]);
  });

  it('仅看收藏但没传 favorites 时返回空，而不是崩', () => {
    expect(applyFilters(ROWS, { favoritesOnly: true })).toEqual([]);
  });

  it('收藏与其他维度叠加', () => {
    const favorites = new Set([2, 3, 5]);
    const out = applyFilters(ROWS, { favoritesOnly: true, favorites, query: 'fuzz' });
    expect(out.map((r) => r.id)).toEqual([2, 3]);
  });

  it('不修改传入的数组', () => {
    const copy = [...ROWS];
    applyFilters(ROWS, { query: 'fuzz' });
    expect(ROWS).toEqual(copy);
  });
});

describe('sortRows', () => {
  it('按年份降序，同年按 id 升序', () => {
    expect(sortRows(ROWS, 'year', 'desc').map((r) => r.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('按年份升序', () => {
    expect(sortRows(ROWS, 'year', 'asc').map((r) => r.id)).toEqual([5, 3, 4, 1, 2]);
  });

  it('按标题字母序', () => {
    expect(sortRows(ROWS, 'title', 'asc')[0].title).toBe('A Study of C++ Templates');
  });

  it('按会议名排序，同会议按 id 升序', () => {
    expect(sortRows(ROWS, 'publication', 'asc').map((r) => r.id)).toEqual([3, 5, 1, 2, 4]);
  });

  it('不认识的 key 原样返回顺序（不偷偷按 id 排）', () => {
    // 必须用打乱过的输入。ROWS 本身就是 id 升序，拿它来断言的话，
    //「原样返回」与「回落到按 id 排序」两种实现都会绿 —— 这条就区分不了它们。
    const shuffled = [ROWS[3], ROWS[0], ROWS[4], ROWS[1], ROWS[2]]; // ids: 4,1,5,2,3
    expect(sortRows(shuffled, 'nope', 'asc').map((r) => r.id)).toEqual([4, 1, 5, 2, 3]);
  });

  it('返回新数组，不原地改', () => {
    const out = sortRows(ROWS, 'year', 'asc');
    expect(out).not.toBe(ROWS);
    expect(ROWS[0].id).toBe(1);
  });
});

describe('paginate', () => {
  it('常规分页', () => {
    const p = paginate(ROWS, 1, 2);
    expect(p.rows.map((r) => r.id)).toEqual([1, 2]);
    expect(p).toMatchObject({ page: 1, pageCount: 3, total: 5, from: 1, to: 2 });
  });

  it('末页不足一页时 to 收到总数', () => {
    const p = paginate(ROWS, 3, 2);
    expect(p.rows.map((r) => r.id)).toEqual([5]);
    expect(p).toMatchObject({ page: 3, from: 5, to: 5 });
  });

  it('页码超出上界时夹到末页', () => {
    expect(paginate(ROWS, 99, 2)).toMatchObject({ page: 3, from: 5, to: 5 });
  });

  it('页码为 0 或负数时夹到第 1 页', () => {
    expect(paginate(ROWS, 0, 2).page).toBe(1);
    expect(paginate(ROWS, -5, 2).page).toBe(1);
  });

  it('空数据：pageCount 至少 1，from/to 为 0，不出现「显示第 1 到 0 条」之外的怪值', () => {
    const p = paginate([], 1, 15);
    expect(p).toEqual({ rows: [], page: 1, pageCount: 1, total: 0, from: 0, to: 0 });
  });

  it('每页容量大于总数时一页装完', () => {
    expect(paginate(ROWS, 1, 100)).toMatchObject({ pageCount: 1, from: 1, to: 5 });
  });

  it('每页容量非法时兜底为 15 而不是除零', () => {
    expect(paginate(ROWS, 1, 0).pageCount).toBe(1);
    expect(paginate(ROWS, 1, 0).rows).toHaveLength(5);
  });
});

describe('loadPapers', () => {
  it('成功时返回解析后的数组', async () => {
    const fake = async () => ({ ok: true, status: 200, json: async () => ROWS });
    await expect(loadPapers(fake)).resolves.toHaveLength(5);
  });

  it('HTTP 错误时抛出带状态码的错误', async () => {
    const fake = async () => ({ ok: false, status: 503, json: async () => ({}) });
    await expect(loadPapers(fake)).rejects.toThrow(/503/);
  });

  it('网络异常原样冒泡，交给调用方降级', async () => {
    const fake = async () => {
      throw new TypeError('Failed to fetch');
    };
    await expect(loadPapers(fake)).rejects.toThrow(/Failed to fetch/);
  });

  it('返回非数组时抛错，避免下游拿到对象当数组用', async () => {
    const fake = async () => ({ ok: true, status: 200, json: async () => ({ oops: 1 }) });
    await expect(loadPapers(fake)).rejects.toThrow(/not an array/i);
  });
});
