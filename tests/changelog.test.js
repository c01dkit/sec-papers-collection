import { describe, it, expect } from 'vitest';
import { CHANGELOG, SPONSORS, SUPPORT_LINKS } from '@/data/changelog.js';
import { SITES } from '@/data/sites.js';
import { collectKeys } from '@/i18n/index.js';
import zh from '@/i18n/zh.json';

describe('CHANGELOG', () => {
  it('两语都有', () => {
    expect(Object.keys(CHANGELOG).sort()).toEqual(['en', 'zh']);
  });

  it('两语条目数一致 —— 防止只加了中文', () => {
    expect(CHANGELOG.zh).toHaveLength(CHANGELOG.en.length);
  });

  // 上面那条只保证两语一样长，两边同时漏掉同一条它照样绿。搬运是 26 条手工
  // 转录，最可能的失手就是整条漏掉，所以把版本序列原样钉死。日期一并钉住，
  // 顺带防住「版本号对了但日期抄错行」。
  const EXPECTED = [
    ['v0.3.12', '2026-04-16'], ['v0.3.11', '2026-04-03'], ['v0.3.10', '2026-03-29'],
    ['v0.3.9', '2026-03-03'], ['v0.3.8', '2026-01-28'], ['v0.3.7', '2026-01-07'],
    ['v0.3.6', '2025-12-16'], ['v0.3.5', '2025-09-24'], ['v0.3.4', '2025-07-16'],
    ['v0.3.3', '2025-07-02'], ['v0.3.2', '2025-04-27'], ['v0.3.1', '2025-03-04'],
    ['v0.3.0', '2025-01-21'], ['v0.2.4', '2024-11-21'], ['v0.2.3', '2024-10-11'],
    ['v0.2.2', '2024-09-16'], ['v0.2.1', '2024-09-03'], ['v0.2.0', '2024-09-01'],
    ['v0.1.7', '2024-08-21'], ['v0.1.6', '2024-07-17'], ['v0.1.5', '2024-07-10'],
    ['v0.1.4', '2024-05-09'], ['v0.1.3', '2024-05-02'], ['v0.1.2', '2023-06-19'],
    ['v0.1.1', '2023-06-19'], ['v0.1.0', '2023-05-15'],
  ];

  it('26 条版本与日期逐条对得上源数据 —— 一条都不许漏', () => {
    expect(CHANGELOG.zh.map((e) => [e.version, e.date])).toEqual(EXPECTED);
    expect(CHANGELOG.en.map((e) => [e.version, e.date])).toEqual(EXPECTED);
  });

  it('每条都有非空 items', () => {
    for (const lang of ['zh', 'en']) {
      for (const e of CHANGELOG[lang]) {
        expect(e.items.length, `${lang} ${e.version}`).toBeGreaterThan(0);
      }
    }
  });

  it('两语的版本号与日期逐条对齐', () => {
    for (let i = 0; i < CHANGELOG.zh.length; i++) {
      expect(CHANGELOG.en[i].version, `第 ${i} 条版本号不一致`).toBe(CHANGELOG.zh[i].version);
      expect(CHANGELOG.en[i].date, `第 ${i} 条日期不一致`).toBe(CHANGELOG.zh[i].date);
    }
  });

  it('日期是 YYYY-MM-DD 且整体降序（最新在前）', () => {
    const dates = CHANGELOG.zh.map((e) => e.date);
    for (const d of dates) expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('每条都至少有一个变更项，且没有空字符串', () => {
    for (const lang of ['zh', 'en']) {
      for (const entry of CHANGELOG[lang]) {
        expect(entry.items.length, `${lang} ${entry.version}`).toBeGreaterThan(0);
        for (const item of entry.items) expect(item.trim()).not.toBe('');
      }
    }
  });

  it('版本号唯一', () => {
    const vs = CHANGELOG.zh.map((e) => e.version);
    expect(new Set(vs).size).toBe(vs.length);
  });
});

describe('SPONSORS', () => {
  it('每条都有名字与日期', () => {
    for (const s of SPONSORS) {
      expect(s.name.trim()).not.toBe('');
      expect(s.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('SITES', () => {
  it('每个站点的 URL 合法', () => {
    for (const s of SITES) expect(() => new URL(s.url)).not.toThrow();
  });

  it('每个站点的标题与描述在 i18n 里都有', () => {
    const keys = collectKeys(zh);
    for (const s of SITES) {
      expect(keys, s.key).toContain(`moreSites.list.${s.key}.title`);
      expect(keys, s.key).toContain(`moreSites.list.${s.key}.desc`);
    }
  });
});
