// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { initNav } from '@/scripts/nav.js';

describe('nav：语言切换保留查询串', () => {
  it('点击时把当前 location.search 接到 href 上', () => {
    history.replaceState(null, '', '/zh/search/?topic=32&type=6');
    document.body.innerHTML = `<header id="siteHeader"><button id="navToggle" aria-expanded="false"></button>
      <nav id="primaryNav"></nav><div id="miscGroup"><button class="misc-btn"></button><div class="misc-menu"></div></div>
      <a data-lang-target="en" href="/en/search/">EN</a></header>`;
    initNav();
    const a = document.querySelector('a[data-lang-target]');
    a.addEventListener('click', (e) => e.preventDefault());   // 不真的导航
    a.click();
    expect(a.search).toBe('?topic=32&type=6');
    expect(a.pathname).toBe('/en/search/');
  });
});
