import { describe, it, expect } from 'vitest';
import { compileTitleQuery } from '@/lib/title-query.js';

describe('compileTitleQuery', () => {
  it('空查询（含纯空白）不筛选，也不高亮', () => {
    for (const q of ['', '   ', undefined, null]) {
      for (const regex of [false, true]) {
        const c = compileTitleQuery(q, regex);
        expect(c.match, `${q}/${regex}`).toBeNull();
        expect(c.highlight).toBeNull();
        expect(c.error).toBe(false);
      }
    }
  });

  it('子串模式：大小写不敏感的字面匹配，正则元字符不起作用', () => {
    const c = compileTitleQuery('c++', false);
    expect(c.match('A Study of C++ Templates')).toBe(true);
    expect(c.match('A Study of C Templates')).toBe(false);
    expect(c.highlight).toEqual({ text: 'c++' });
    expect(c.error).toBe(false);
  });

  it('子串模式下输入 ( 也不报错', () => {
    const c = compileTitleQuery('(', false);
    expect(c.error).toBe(false);
    expect(c.match('a (b)')).toBe(true);
  });

  it('正则模式：按正则匹配，大小写不敏感', () => {
    const c = compileTitleQuery('^(fuzz|taint)', true);
    expect(c.match('Fuzzing the Kernel')).toBe(true);
    expect(c.match('TAINT tracking')).toBe(true);
    expect(c.match('Directed Fuzzing')).toBe(false);
    expect(c.error).toBe(false);
  });

  it('正则模式支持反向引用等完整语法', () => {
    const c = compileTitleQuery('\\b(\\w)\\1', true);
    expect(c.match('a llama')).toBe(true);
    expect(c.match('a lama')).toBe(false);
  });

  it('正则模式给出 RegExp 形式的高亮 pattern', () => {
    const c = compileTitleQuery('fuzz\\w*', true);
    expect(c.highlight.re).toBeInstanceOf(RegExp);
    expect(c.highlight.re.source).toBe('fuzz\\w*');
    expect(c.highlight.re.flags).toContain('i');
  });

  it('match 可反复调用，结果不受上一次调用影响（不能带 g 标志的 lastIndex 状态）', () => {
    const c = compileTitleQuery('fuzz', true);
    expect(c.match('fuzz')).toBe(true);
    expect(c.match('fuzz')).toBe(true);
  });

  it('无效正则：error 为 true，且不筛选、不高亮，而不是抛错', () => {
    for (const q of ['(fuzz', '[a-', '*x', 'a{2,1}']) {
      let c;
      expect(() => (c = compileTitleQuery(q, true)), q).not.toThrow();
      expect(c.error, q).toBe(true);
      expect(c.match, q).toBeNull();
      expect(c.highlight, q).toBeNull();
    }
  });

  it('查询词去首尾空白（与 URL 读写一致）', () => {
    expect(compileTitleQuery('  fuzz  ', true).highlight.re.source).toBe('fuzz');
    expect(compileTitleQuery('  fuzz  ', false).highlight).toEqual({ text: 'fuzz' });
  });
});
