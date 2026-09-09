import { describe, it, expect } from 'vitest';
import { readAbstractParams, writeAbstractParams, abstractHref } from '@/lib/abstract-url.js';

describe('writeAbstractParams', () => {
  it('会议名里的空格与 & 都被编码', () => {
    expect(writeAbstractParams({ pub: 'IEEE S&P', year: '2025' })).toBe('?pub=IEEE+S%26P&year=2025');
  });

  it('年份可以是数字', () => {
    expect(writeAbstractParams({ pub: 'NDSS', year: 2024 })).toBe('?pub=NDSS&year=2024');
  });

  it('缺任一项时返回空串 —— 半个届次不成链接', () => {
    expect(writeAbstractParams({ pub: 'NDSS' })).toBe('');
    expect(writeAbstractParams({ year: '2024' })).toBe('');
    expect(writeAbstractParams(null)).toBe('');
  });
});

describe('readAbstractParams', () => {
  it('读回 write 写出的串，带不带问号都行', () => {
    expect(readAbstractParams('?pub=IEEE+S%26P&year=2025')).toEqual({ pub: 'IEEE S&P', year: '2025' });
    expect(readAbstractParams('pub=NDSS&year=2024')).toEqual({ pub: 'NDSS', year: '2024' });
  });

  it('缺任一项、或为空时给 null', () => {
    expect(readAbstractParams('?pub=NDSS')).toBeNull();
    expect(readAbstractParams('?year=2024')).toBeNull();
    expect(readAbstractParams('')).toBeNull();
    expect(readAbstractParams(undefined)).toBeNull();
    expect(readAbstractParams('?pub=&year=2024')).toBeNull();
  });

  it('年份两边的空白被裁掉，非四位数字的年份视为无效', () => {
    expect(readAbstractParams('?pub=NDSS&year=%202024%20')).toEqual({ pub: 'NDSS', year: '2024' });
    expect(readAbstractParams('?pub=NDSS&year=abc')).toBeNull();
  });
});

describe('abstractHref', () => {
  it('拼出带语言前缀的摘要页深链', () => {
    expect(abstractHref('zh', 'IEEE S&P', '2025')).toBe('/zh/abstract/?pub=IEEE+S%26P&year=2025');
    expect(abstractHref('en', 'USENIX Security', 2026)).toBe('/en/abstract/?pub=USENIX+Security&year=2026');
  });
});
