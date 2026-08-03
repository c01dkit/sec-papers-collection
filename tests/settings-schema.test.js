import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, migrateSettings, ACCENTS, THEMES, FONT_SIZES, PAGE_WIDTHS } from '@/lib/settings-schema.js';

describe('DEFAULT_SETTINGS', () => {
  it('每次返回新对象，避免调用方互相污染', () => {
    const a = DEFAULT_SETTINGS();
    const b = DEFAULT_SETTINGS();
    expect(a).not.toBe(b);
    a.keywords.push('x');
    expect(b.keywords).toEqual([]);
  });

  it('默认强调色是 slate，默认浅色', () => {
    expect(DEFAULT_SETTINGS().theme).toBe('slate');
    expect(DEFAULT_SETTINGS().darkTheme).toBe(false);
  });

  it('默认字号是 large，默认版心是 medium', () => {
    expect(DEFAULT_SETTINGS().fontSize).toBe('large');
    expect(DEFAULT_SETTINGS().pageWidth).toBe('medium');
  });

  it('不含已废弃的 LLM 字段', () => {
    const d = DEFAULT_SETTINGS();
    expect(d).not.toHaveProperty('llmEndpoint');
    expect(d).not.toHaveProperty('llmApiKey');
  });

  it('不含已移除的 language / showStatusDots 字段', () => {
    // language 从来没有写手（没有任何 patchSettings 调用带过它），永远停在
    // 默认值 'en'，却会被 mirror() 用来覆盖 nav.js 刚写好的真实 spc-lang ——
    // 于是整体删掉。showStatusDots 唯一消费方 PaperStats.vue 已随旧 Vue 应用
    // 一起删除，同样归为死字段。
    const d = DEFAULT_SETTINGS();
    expect(d).not.toHaveProperty('language');
    expect(d).not.toHaveProperty('showStatusDots');
  });
});

describe('migrateSettings', () => {
  it('null / undefined 得到全套默认值', () => {
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS());
    expect(migrateSettings(undefined)).toEqual(DEFAULT_SETTINGS());
  });

  it('保留已知字段', () => {
    const out = migrateSettings({ keywords: ['fuzz'], rememberTheme: true });
    expect(out.keywords).toEqual(['fuzz']);
    expect(out.rememberTheme).toBe(true);
  });

  it('theme 语义从 PrimeVue 预设名变成强调色 slug', () => {
    // 旧值恰好也是新 slug 的，平滑保留
    expect(migrateSettings({ theme: 'indigo' }).theme).toBe('indigo');
    // 旧 PrimeVue 预设名不在新列表里，回落默认
    expect(migrateSettings({ theme: 'green' }).theme).toBe('slate');
    expect(migrateSettings({ theme: 'teal' }).theme).toBe('slate');
    expect(migrateSettings({ theme: undefined }).theme).toBe('slate');
  });

  it('pageWidth 只认四档，脏值回落默认档 medium', () => {
    expect(migrateSettings({ pageWidth: 'narrow' }).pageWidth).toBe('narrow');
    expect(migrateSettings({ pageWidth: 'wide' }).pageWidth).toBe('wide');
    expect(migrateSettings({ pageWidth: 'full' }).pageWidth).toBe('full');
    expect(migrateSettings({ pageWidth: '1120px' }).pageWidth).toBe('medium');
    expect(migrateSettings({ pageWidth: undefined }).pageWidth).toBe('medium');
  });

  it('fontSize 只认三档，脏值回落默认档 large', () => {
    expect(migrateSettings({ fontSize: 'small' }).fontSize).toBe('small');
    expect(migrateSettings({ fontSize: 'medium' }).fontSize).toBe('medium');
    expect(migrateSettings({ fontSize: 'huge' }).fontSize).toBe('large');
    expect(migrateSettings({ fontSize: undefined }).fontSize).toBe('large');
  });

  it('删掉已废弃的 LLM 字段', () => {
    const out = migrateSettings({ llmEndpoint: 'http://x', llmApiKey: 'sk-1' });
    expect(out).not.toHaveProperty('llmEndpoint');
    expect(out).not.toHaveProperty('llmApiKey');
  });

  it('language 字段已整体移除 —— 真正的语言记忆由 nav.js 直接写 spc-lang，不经过这里', () => {
    const out = migrateSettings({ language: 'zh' });
    expect(out).not.toHaveProperty('language');
  });

  it('删掉已移除的 showStatusDots 字段', () => {
    const out = migrateSettings({ showStatusDots: true });
    expect(out).not.toHaveProperty('showStatusDots');
  });

  it('keywords 不是数组时归零，元素强制成非空字符串', () => {
    expect(migrateSettings({ keywords: 'fuzz' }).keywords).toEqual([]);
    expect(migrateSettings({ keywords: ['a', '', null, 'b', 42] }).keywords).toEqual(['a', 'b', '42']);
  });

  it('布尔字段被脏值污染时强制成布尔', () => {
    expect(migrateSettings({ darkTheme: 'yes' }).darkTheme).toBe(true);
    expect(migrateSettings({ darkTheme: 0 }).darkTheme).toBe(false);
  });

  it('丢掉不认识的多余字段，避免无限累积', () => {
    const out = migrateSettings({ someOldFlag: true });
    expect(out).not.toHaveProperty('someOldFlag');
  });

  it('输出的键集合恒等于默认值的键集合', () => {
    const keys = Object.keys(DEFAULT_SETTINGS()).sort();
    expect(Object.keys(migrateSettings({ junk: 1 })).sort()).toEqual(keys);
    expect(Object.keys(migrateSettings(null)).sort()).toEqual(keys);
  });
});

describe('常量', () => {
  it('4 个强调色，slate 在首位', () => {
    expect(ACCENTS).toEqual(['slate', 'indigo', 'oxblood', 'pine']);
  });

  it('2 个主题', () => {
    expect(THEMES).toEqual(['light', 'dark']);
  });

  it('3 档字号，从小到大排列', () => {
    expect(FONT_SIZES).toEqual(['small', 'medium', 'large']);
  });

  it('4 档版心宽度，从窄到宽排列', () => {
    expect(PAGE_WIDTHS).toEqual(['narrow', 'medium', 'wide', 'full']);
  });
});
