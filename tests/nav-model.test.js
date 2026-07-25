import { describe, it, expect } from 'vitest';
import { CORE_NAV, MISC_NAV, isActive } from '@/lib/nav-model.js';
import { t } from '@/i18n/index.js';

describe('导航模型', () => {
  it('核心 5 项平铺，顺序为检索/趋势/摘要/时间线/获奖', () => {
    expect(CORE_NAV.map((n) => n.slug)).toEqual(['search', 'trends', 'abstract', 'timeline', 'awards']);
  });

  it('其他 3 项：更多网站/关于/设置', () => {
    expect(MISC_NAV.map((n) => n.slug)).toEqual(['sites', 'about', 'settings']);
  });

  it('每一项的文案 key 在两语里都存在', () => {
    for (const item of [...CORE_NAV, ...MISC_NAV]) {
      expect(() => t('zh', item.key)).not.toThrow();
      expect(() => t('en', item.key)).not.toThrow();
    }
  });
});

describe('isActive', () => {
  it('精确匹配当前 slug', () => {
    expect(isActive('/zh/search/', 'zh', 'search')).toBe(true);
    expect(isActive('/zh/trends/', 'zh', 'search')).toBe(false);
  });

  it('不受尾斜杠有无影响', () => {
    expect(isActive('/zh/search', 'zh', 'search')).toBe(true);
  });

  it('不同语言下的同名路径同样算激活', () => {
    expect(isActive('/en/awards/', 'en', 'awards')).toBe(true);
  });

  it('语言首页不会点亮任何核心项', () => {
    for (const item of CORE_NAV) {
      expect(isActive('/zh/', 'zh', item.slug)).toBe(false);
    }
  });
});
