import { describe, it, expect } from 'vitest';
import { t, LOCALES, collectKeys } from '@/i18n/index.js';
import zh from '@/i18n/zh.json';
import en from '@/i18n/en.json';

describe('t()', () => {
  it('按点分路径取值', () => {
    expect(t('zh', 'menu.search')).toBe('标题检索');
    expect(t('en', 'menu.search')).toBe('Search by Title');
  });

  it('插值 {var}', () => {
    expect(t('zh', 'search.totalPapers', { count: 15600 })).toBe('共 15600 篇论文。');
  });

  it('缺失的插值变量原样留在文本里，不产出 undefined', () => {
    expect(t('zh', 'search.totalPapers', {})).toContain('{count}');
  });

  it('key 不存在时抛错，而不是返回裸 key', () => {
    expect(() => t('zh', 'nope.not.here')).toThrow(/missing key/);
  });

  it('未知语言回落到默认语言', () => {
    expect(t('fr', 'menu.search')).toBe(t('zh', 'menu.search'));
  });
});

describe('文案漂移守卫', () => {
  it('zh 与 en 的 key 集合完全一致', () => {
    const kz = collectKeys(zh).sort();
    const ke = collectKeys(en).sort();
    expect(kz.filter((k) => !ke.includes(k))).toEqual([]);   // zh 独有
    expect(ke.filter((k) => !kz.includes(k))).toEqual([]);   // en 独有
  });

  it('两语都没有空字符串文案', () => {
    for (const lang of LOCALES) {
      for (const key of collectKeys(lang === 'zh' ? zh : en)) {
        expect(t(lang, key), `${lang}:${key}`).not.toBe('');
      }
    }
  });
});
