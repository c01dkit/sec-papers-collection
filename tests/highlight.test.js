import { describe, it, expect } from 'vitest';
import { highlightSegments } from '@/lib/highlight.js';

const text = (segs) => segs.map((s) => s.text).join('');
const hits = (segs) => segs.filter((s) => s.hit).map((s) => s.text);

describe('highlightSegments', () => {
  it('没有 pattern 时整段返回，标记为未命中', () => {
    const segs = highlightSegments('Hello world', []);
    expect(segs).toEqual([{ text: 'Hello world', hit: false, cls: '' }]);
  });

  it('切段后拼回原文，一个字符不多不少', () => {
    const segs = highlightSegments('a fuzz b fuzz c', [{ text: 'fuzz' }]);
    expect(text(segs)).toBe('a fuzz b fuzz c');
    // 两半都得断言：只验「拼回原文」的话，一个永不切段的实现也会绿。
    // 这条守的是「切归切，字符不许变」，缺了下面这句就只剩后半句。
    expect(segs.length).toBeGreaterThan(1);
  });

  it('命中多处', () => {
    expect(hits(highlightSegments('fuzz and fuzz', [{ text: 'fuzz' }]))).toEqual(['fuzz', 'fuzz']);
  });

  it('大小写不敏感，但保留原文大小写', () => {
    expect(hits(highlightSegments('Fuzzing FUZZ fuzz', [{ text: 'fuzz' }]))).toEqual(['Fuzz', 'FUZZ', 'fuzz']);
  });

  it('长 pattern 优先于短 pattern', () => {
    const segs = highlightSegments('a fuzzing tool here', [{ text: 'fuzz' }, { text: 'fuzzing tool' }]);
    expect(hits(segs)).toEqual(['fuzzing tool']);
  });

  it('关键词含正则特殊字符时按字面匹配，不抛错', () => {
    for (const k of ['C++', '(', ')', '[', ']', '\\', '.*', '$^', 'a|b', '?']) {
      expect(() => highlightSegments(`x ${k} y`, [{ text: k }]), k).not.toThrow();
      expect(hits(highlightSegments(`x ${k} y`, [{ text: k }])), k).toEqual([k]);
    }
  });

  it('C++ 不会被当成「C 后面跟一个或多个 +」', () => {
    expect(hits(highlightSegments('C++ and C', [{ text: 'C++' }]))).toEqual(['C++']);
  });

  it('每个 pattern 可带自己的 cls', () => {
    const segs = highlightSegments('search term here', [
      { text: 'search', cls: 'q' },
      { text: 'term', cls: 'kw' },
    ]);
    expect(segs.find((s) => s.text === 'search').cls).toBe('q');
    expect(segs.find((s) => s.text === 'term').cls).toBe('kw');
  });

  it('未指定 cls 时给默认值 hl', () => {
    const segs = highlightSegments('abc', [{ text: 'b' }]);
    expect(segs.find((s) => s.hit).cls).toBe('hl');
  });

  it('空文本与空值安全', () => {
    expect(highlightSegments('', [{ text: 'x' }])).toEqual([{ text: '', hit: false, cls: '' }]);
    expect(highlightSegments(null, [{ text: 'x' }])).toEqual([{ text: '', hit: false, cls: '' }]);
    expect(highlightSegments(undefined, undefined)).toEqual([{ text: '', hit: false, cls: '' }]);
  });

  it('pattern 里的空字符串被忽略，不产生零宽死循环', () => {
    const segs = highlightSegments('abc', [{ text: '' }, { text: null }, { text: 'b' }]);
    expect(text(segs)).toBe('abc');
    expect(hits(segs)).toEqual(['b']);
  });

  it('整段命中时不产生空的前后段', () => {
    const segs = highlightSegments('fuzz', [{ text: 'fuzz' }]);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ text: 'fuzz', hit: true, cls: 'hl' });
  });

  it('相邻命中之间不插入空段', () => {
    const segs = highlightSegments('ab', [{ text: 'a' }, { text: 'b' }]);
    expect(segs.every((s) => s.text.length > 0)).toBe(true);
    expect(text(segs)).toBe('ab');
    // 同上：不切段的实现同样「没有空段」。断言它确实切成了两段，
    // 这条才不必依赖别的用例存在才有意义。
    expect(segs).toHaveLength(2);
  });
});
