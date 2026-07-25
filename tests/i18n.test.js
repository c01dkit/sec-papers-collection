import { describe, it, expect } from 'vitest';
import { t, LOCALES, collectKeys } from '@/i18n/index.js';
import zh from '@/i18n/zh.json';
import en from '@/i18n/en.json';

describe('t()', () => {
  it('按点分路径取值', () => {
    // 期望值必须照抄 zh.json / en.json 的现有文案，不要凭中文含义反推英文 ——
    // zh 是「标题检索」，但 en 一直是简短的 "Search"，不是 "Search by Title"
    expect(t('zh', 'menu.search')).toBe('标题检索');
    expect(t('en', 'menu.search')).toBe('Search');
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

  it('未知语言码整体回落到默认语言的文案树', () => {
    expect(t('fr', 'menu.search')).toBe(t('zh', 'menu.search'));
  });

  it('已知语言里查不到的 key 一律抛错，不跨语言借文案', () => {
    // 这一条守的是「en 缺 key 时不能悄悄返回中文」。
    // 注意：因为下面的漂移守卫保证两语 key 集合恒等，单测里无法构造出
    // 「zh 有、en 无」的真实情形，所以这里只能验证不存在的 key 会抛错。
    // 真正兜住不对称回退的是两道防线：漂移守卫（npm test）+ astro build 本身
    // ——每个页面都会对两种语言各调一次 t()，任一语言漏 key 都会让构建失败。
    expect(() => t('en', 'menu.__nonexistent__')).toThrow(/missing key/);
    expect(() => t('zh', 'menu.__nonexistent__')).toThrow(/missing key/);
  });
});

describe('文案漂移守卫', () => {
  it('zh 与 en 的 key 集合完全一致', () => {
    // 这条一红意味着 astro build 也会红：t() 不做跨语言回退，
    // 漏掉的那一侧会在预渲染时抛错。
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
