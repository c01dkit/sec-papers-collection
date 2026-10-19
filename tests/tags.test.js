import { describe, it, expect } from 'vitest';
import {
  parseTag, localName, topicLabel, typeLabel, topicOptions, typeOptions, buildTopicIndex, SENTINEL_TOPICS,
  codeNames,
} from '@/lib/tags.js';
import realTaxonomy from '@/assets/data/topics.json';
import realStats from '@/assets/data/data-statistics.json';

// 缩小版码表：两个段、三个分组、六个主题。真码表 198 项，用它测分段 / 分组逻辑看不出错在哪。
const TAX = {
  bands: [
    { key: 'security', lo: '01', hi: '7F', en: 'Security', zh: '安全' },
    { key: 'system', lo: 'C0', hi: 'EF', en: 'Systems', zh: '系统' },
  ],
  groups: [
    { lo: '01', hi: '0F', band: 'security', en: 'Infra', zh: '基础设施' },
    { lo: '10', hi: '1F', band: 'security', en: 'Network', zh: '网络' },
    { lo: 'C0', hi: 'CF', band: 'system', en: 'OS', zh: '操作系统' },
  ],
  topics: {
    '00': { en: 'Unclassified', zh: '未分类' },
    '01': { en: 'System security', zh: '系统安全' },
    '02': { en: 'OS security', zh: '操作系统安全' },
    '10': { en: 'Network security', zh: '网络安全' },
    C0: { en: 'OS design', zh: '操作系统设计' },
    FF: { en: 'Other', zh: '其他' },
  },
  types: {
    '0': { en: 'Unanalyzed', zh: '待分析' },
    '1': { en: 'Method design', zh: '方法设计' },
    '6': { en: 'SoK', zh: 'SoK' },
  },
};
const STATS = {
  total: 12,
  byTopic: { '00': 1, '01': 5, '10': 2, C0: 1, FF: 3 },   // '02' 没出现 -> 0 篇
  byType: { '1': 9, '6': 3 },
};

describe('parseTag', () => {
  it('拆出类型 / 主题 / 奖项', () => {
    expect(parseTag('1A3N')).toEqual({ type: '1', topic: 'A3', award: 'N' });
    expect(parseTag('6FFD')).toEqual({ type: '6', topic: 'FF', award: 'D' });
  });

  it('缺失或畸形的 tag 回落默认值，而不是 undefined', () => {
    const dflt = { type: '0', topic: '00', award: 'N' };
    expect(parseTag(undefined)).toEqual(dflt);
    expect(parseTag(null)).toEqual(dflt);
    expect(parseTag('')).toEqual(dflt);
    expect(parseTag('abc')).toEqual(dflt);
    expect(parseTag('1a3N')).toEqual(dflt);   // 小写 hex 不合法
    expect(parseTag(1234)).toEqual(dflt);
  });

  it('每次返回新对象，改返回值不会污染后续调用', () => {
    const a = parseTag(undefined);
    a.topic = '99';
    expect(parseTag(undefined).topic).toBe('00');
  });
});

describe('标签查表', () => {
  it('按语言取名，zh 缺时退回 en', () => {
    expect(localName({ en: 'Side channels', zh: '侧信道' }, 'zh')).toBe('侧信道');
    expect(localName({ en: 'Side channels', zh: '侧信道' }, 'en')).toBe('Side channels');
    expect(localName({ en: 'Only en' }, 'zh')).toBe('Only en');
  });

  it('查不到的码返回码本身，绝不返回 undefined', () => {
    expect(topicLabel(TAX, '01', 'zh')).toBe('系统安全');
    expect(topicLabel(TAX, 'ZZ', 'zh')).toBe('ZZ');
    expect(typeLabel(TAX, '6', 'en')).toBe('SoK');
    expect(typeLabel(TAX, '8', 'en')).toBe('8');
    expect(topicLabel(undefined, '01', 'zh')).toBe('01');
  });
});

describe('codeNames', () => {
  it('把码表压成当前语言的 码 -> 名（类型与主题各一张），供页面内嵌给脚本', () => {
    expect(codeNames(TAX, 'zh')).toEqual({
      types: { 0: '待分析', 1: '方法设计', 6: 'SoK' },
      topics: { '00': '未分类', '01': '系统安全', '02': '操作系统安全', 10: '网络安全', C0: '操作系统设计', FF: '其他' },
    });
    expect(codeNames(TAX, 'en').topics.C0).toBe('OS design');
  });

  it('zh 缺名时退回 en', () => {
    const tax = { ...TAX, topics: { '01': { en: 'Only en' } }, types: {} };
    expect(codeNames(tax, 'zh')).toEqual({ types: {}, topics: { '01': 'Only en' } });
  });
});

describe('topicOptions', () => {
  const groups = topicOptions(TAX, STATS, 'zh', '未分类与其他');

  it('按分组给出选项，只含篇数 > 0 的主题，空组不出现', () => {
    expect(groups.map((g) => g.label)).toEqual(['基础设施', '网络', '操作系统', '未分类与其他']);
    expect(groups[0].options).toEqual([{ value: '01', label: '系统安全', count: 5 }]);   // '02' 是 0 篇
    expect(groups[1].options).toEqual([{ value: '10', label: '网络安全', count: 2 }]);
  });

  it('哨兵码收在末尾一组，标签由调用方给', () => {
    expect(groups.at(-1).options).toEqual([
      { value: '00', label: '未分类', count: 1 },
      { value: 'FF', label: '其他', count: 3 },
    ]);
  });

  it('哨兵都是 0 篇时没有末尾那组', () => {
    const out = topicOptions(TAX, { ...STATS, byTopic: { '01': 1 } }, 'en', 'tail');
    expect(out.map((g) => g.label)).toEqual(['Infra']);
  });

  it('stats 缺 byTopic 时给空数组而不是崩', () => {
    expect(topicOptions(TAX, {}, 'zh', 'x')).toEqual([]);
  });
});

describe('typeOptions', () => {
  it('只含出现过的类型，按码排序', () => {
    expect(typeOptions(TAX, STATS, 'en')).toEqual([
      { value: '1', label: 'Method design', count: 9 },
      { value: '6', label: 'SoK', count: 3 },
    ]);
  });
});

describe('buildTopicIndex', () => {
  const index = buildTopicIndex(TAX, STATS, 'zh');

  it('段 -> 组 -> 主题，含 0 篇的主题', () => {
    expect(index.bands.map((b) => b.key)).toEqual(['security', 'system']);
    const sec = index.bands[0];
    expect(sec.label).toBe('安全');
    expect(sec.total).toBe(7);
    expect(sec.max).toBe(5);
    expect(sec.groups.map((g) => g.label)).toEqual(['基础设施', '网络']);
    expect(sec.groups[0].topics).toEqual([
      { code: '01', label: '系统安全', count: 5 },
      { code: '02', label: '操作系统安全', count: 0 },
    ]);
    expect(sec.groups[0].total).toBe(5);
  });

  it('哨兵、类型、合计与已分类数', () => {
    expect(index.sentinels).toEqual([
      { code: '00', label: '未分类', count: 1 },
      { code: 'FF', label: '其他', count: 3 },
    ]);
    expect(index.types).toEqual([
      { code: '0', label: '待分析', count: 0 },
      { code: '1', label: '方法设计', count: 9 },
      { code: '6', label: 'SoK', count: 3 },
    ]);
    expect(index.total).toBe(12);
    expect(index.classified).toBe(11);
  });

  it('段内没有任何篇数时 max 为 0，而不是 -Infinity', () => {
    const out = buildTopicIndex(TAX, { total: 0, byTopic: {}, byType: {} }, 'en');
    expect(out.bands[1].max).toBe(0);
    expect(out.classified).toBe(0);
  });

  it('data-statistics.json 过期（缺 byTopic）时抛错，让构建失败而不是渲染全零', () => {
    expect(() => buildTopicIndex(TAX, { total: 1 }, 'zh')).toThrow(/--analyze/);
    expect(() => buildTopicIndex(TAX, undefined, 'zh')).toThrow(/--analyze/);
  });

  it('SENTINEL_TOPICS 就是 00 与 FF', () => {
    expect(SENTINEL_TOPICS).toEqual(['00', 'FF']);
  });
});

describe('与真实数据对接', () => {
  it('data-statistics.json 里出现的每个 topic / type 码在 topics.json 里都有名字', () => {
    for (const code of Object.keys(realStats.byTopic)) expect(realTaxonomy.topics[code], code).toBeTruthy();
    for (const code of Object.keys(realStats.byType)) expect(realTaxonomy.types[code], code).toBeTruthy();
  });

  it('真码表能建出 3 段 15 组、每段都有主题', () => {
    const index = buildTopicIndex(realTaxonomy, realStats, 'en');
    expect(index.bands).toHaveLength(3);
    expect(index.bands.flatMap((b) => b.groups)).toHaveLength(15);
    for (const b of index.bands) expect(b.groups.every((g) => g.topics.length > 0)).toBe(true);
    expect(index.classified + index.sentinels[0].count).toBe(index.total);
  });
});
