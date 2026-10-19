import { describe, it, expect } from 'vitest';
import { readSearchParams, writeSearchParams } from '@/lib/search-url.js';

const VALID = {
  publications: new Set(['IEEE S&P', 'NDSS']),
  years: new Set(['2025', '2024']),
  topics: new Set(['23', '32', 'FF']),
  types: new Set(['1', '6']),
};

describe('readSearchParams', () => {
  it('多值用重复参数，读成数组', () => {
    const out = readSearchParams('?q=fuzz&pub=IEEE+S%26P&pub=NDSS&year=2025&topic=23&topic=32&type=6', VALID);
    expect(out).toEqual({
      query: 'fuzz', regex: false, publications: ['IEEE S&P', 'NDSS'], years: ['2025'], topics: ['23', '32'], types: ['6'],
    });
  });

  it('未知的会议 / 年份 / 码值直接丢弃，不报错', () => {
    const out = readSearchParams('?pub=Nope&year=1999&topic=ZZ&type=8&topic=FF', VALID);
    expect(out).toEqual({ query: '', regex: false, publications: [], years: [], topics: ['FF'], types: [] });
  });

  it('valid 缺某一维时那一维不校验', () => {
    const out = readSearchParams('?topic=ZZ', { publications: new Set() });
    expect(out.topics).toEqual(['ZZ']);
    expect(out.publications).toEqual([]);
  });

  it('查询词去首尾空白；空串、undefined、不带问号都能读', () => {
    expect(readSearchParams('?q=%20fuzz%20', VALID).query).toBe('fuzz');
    expect(readSearchParams('', VALID)).toEqual({ query: '', regex: false, publications: [], years: [], topics: [], types: [] });
    expect(readSearchParams(undefined, VALID).query).toBe('');
    expect(readSearchParams('q=x', VALID).query).toBe('x');
  });
});

describe('readSearchParams: 正则模式', () => {
  it('re=1 读成 regex: true，其他值或缺省都是 false', () => {
    expect(readSearchParams('?q=%5Efuzz&re=1', VALID)).toMatchObject({ query: '^fuzz', regex: true });
    expect(readSearchParams('?q=fuzz&re=0', VALID).regex).toBe(false);
    expect(readSearchParams('?q=fuzz&re=yes', VALID).regex).toBe(false);
    expect(readSearchParams('?q=fuzz', VALID).regex).toBe(false);
  });

  it('没有查询词时 re=1 无意义，读成 false', () => {
    expect(readSearchParams('?re=1', VALID).regex).toBe(false);
  });
});

describe('writeSearchParams', () => {
  it('全空返回空串，而不是一个孤零零的问号', () => {
    expect(writeSearchParams({})).toBe('');
    expect(writeSearchParams({ query: '   ', publications: [], years: [], topics: [], types: [] })).toBe('');
  });

  it('参数顺序固定 q, pub, year, topic, type，与输入顺序无关', () => {
    const s = writeSearchParams({ types: ['6'], topics: ['32', '23'], years: ['2025'], publications: ['NDSS'], query: 'x' });
    expect(s).toBe('?q=x&pub=NDSS&year=2025&topic=32&topic=23&type=6');
  });

  it('与 readSearchParams 往返一致，含空格与 & 的会议名不丢', () => {
    const state = { query: 'C++ fuzz', regex: false, publications: ['IEEE S&P', 'NDSS'], years: ['2025'], topics: ['23'], types: ['1'] };
    expect(readSearchParams(writeSearchParams(state), VALID)).toEqual(state);
  });

  it('正则模式写 re=1，紧跟在 q 后面', () => {
    expect(writeSearchParams({ query: '^fuzz', regex: true, years: ['2025'] })).toBe('?q=%5Efuzz&re=1&year=2025');
  });

  it('没有查询词时不写 re，避免地址栏里挂一个空转的 ?re=1', () => {
    expect(writeSearchParams({ query: '  ', regex: true })).toBe('');
    expect(writeSearchParams({ regex: true, years: ['2025'] })).toBe('?year=2025');
  });

  it('正则模式与 readSearchParams 往返一致，反斜杠与元字符不丢', () => {
    const state = { query: '\\b(fuzz|taint)\\w*$', regex: true, publications: ['IEEE S&P'], years: [], topics: [], types: [] };
    expect(readSearchParams(writeSearchParams(state), VALID)).toEqual(state);
  });

  it('年份是数字也能写', () => {
    expect(writeSearchParams({ years: [2025] })).toBe('?year=2025');
  });
});
