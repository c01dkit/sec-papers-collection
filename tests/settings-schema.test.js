import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS, migrateSettings, ACCENTS, THEMES } from '@/lib/settings-schema.js';

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

  it('不含已废弃的 LLM 字段', () => {
    const d = DEFAULT_SETTINGS();
    expect(d).not.toHaveProperty('llmEndpoint');
    expect(d).not.toHaveProperty('llmApiKey');
  });
});

describe('migrateSettings', () => {
  it('null / undefined 得到全套默认值', () => {
    expect(migrateSettings(null)).toEqual(DEFAULT_SETTINGS());
    expect(migrateSettings(undefined)).toEqual(DEFAULT_SETTINGS());
  });

  it('保留已知字段', () => {
    const out = migrateSettings({ keywords: ['fuzz'], showStatusDots: true });
    expect(out.keywords).toEqual(['fuzz']);
    expect(out.showStatusDots).toBe(true);
  });

  it('theme 语义从 PrimeVue 预设名变成强调色 slug', () => {
    // 旧值恰好也是新 slug 的，平滑保留
    expect(migrateSettings({ theme: 'indigo' }).theme).toBe('indigo');
    // 旧 PrimeVue 预设名不在新列表里，回落默认
    expect(migrateSettings({ theme: 'green' }).theme).toBe('slate');
    expect(migrateSettings({ theme: 'teal' }).theme).toBe('slate');
    expect(migrateSettings({ theme: undefined }).theme).toBe('slate');
  });

  it('删掉已废弃的 LLM 字段', () => {
    const out = migrateSettings({ llmEndpoint: 'http://x', llmApiKey: 'sk-1' });
    expect(out).not.toHaveProperty('llmEndpoint');
    expect(out).not.toHaveProperty('llmApiKey');
  });

  it('language 脏值回落到 en', () => {
    expect(migrateSettings({ language: 'zh' }).language).toBe('zh');
    expect(migrateSettings({ language: 'fr' }).language).toBe('en');
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
});
