import { describe, it, expect } from 'vitest';
import { swapLangInPath, resolveLang, localizedHref } from '@/i18n/paths.js';

describe('swapLangInPath', () => {
  it('换掉语言段，保留其余路径', () => {
    expect(swapLangInPath('/zh/search/', 'en')).toBe('/en/search/');
    expect(swapLangInPath('/en/awards/', 'zh')).toBe('/zh/awards/');
  });

  it('语言首页互换', () => {
    expect(swapLangInPath('/zh/', 'en')).toBe('/en/');
  });

  it('缺尾斜杠也能处理', () => {
    expect(swapLangInPath('/zh', 'en')).toBe('/en/');
  });

  it('无语言前缀的路径退回目标语言首页', () => {
    expect(swapLangInPath('/', 'en')).toBe('/en/');
    expect(swapLangInPath('/paper/search/', 'en')).toBe('/en/');
  });
});

describe('resolveLang', () => {
  it('已存的合法值优先于浏览器语言', () => {
    expect(resolveLang('en', 'zh-CN')).toBe('en');
    expect(resolveLang('zh', 'en-US')).toBe('zh');
  });

  it('脏值一律视为无记录，转看浏览器语言', () => {
    expect(resolveLang('EN', 'zh-CN')).toBe('zh');
    expect(resolveLang('fr', 'zh-CN')).toBe('zh');
    expect(resolveLang('', 'en-US')).toBe('en');
  });

  it('无记录时按浏览器语言，zh 前缀归 zh，其余归 en', () => {
    expect(resolveLang(null, 'zh-TW')).toBe('zh');
    expect(resolveLang(null, 'ZH')).toBe('zh');
    expect(resolveLang(null, 'de-DE')).toBe('en');
  });

  it('浏览器语言也拿不到时归 en', () => {
    expect(resolveLang(null, undefined)).toBe('en');
  });
});

describe('localizedHref', () => {
  it('拼出带尾斜杠的语言路径', () => {
    expect(localizedHref('zh', 'search')).toBe('/zh/search/');
    expect(localizedHref('en', '')).toBe('/en/');
  });
});
