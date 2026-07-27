import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));

/**
 * GitHub Pages 的 legacy 构建管线会把产物过一遍 Jekyll，而 Jekyll 默认丢弃
 * 所有以 `_` 开头的文件和目录 —— Astro 的全部 JS/CSS 都在 `_astro/` 下。
 * 结果是 HTML 正常 200、每个 `/_astro/*` 全部 404，页面裸奔且无脚本。
 * 关掉 Jekyll 需要两件事同时成立，缺一则线上静默失效：
 *   1. 站点根目录有 `.nojekyll`（由 public/ 复制进 dist/）
 *   2. gh-pages 带 --dotfiles，否则它的默认 glob 根本不匹配点文件
 */
describe('GitHub Pages 部署', () => {
  it('public/.nojekyll 存在，构建后落到站点根目录', () => {
    expect(fs.existsSync(path.resolve('public/.nojekyll'))).toBe(true);
  });

  it('deploy 脚本带 --dotfiles，否则 .nojekyll 不会被发布', () => {
    expect(pkg.scripts.deploy).toMatch(/(^|\s)(--dotfiles|-t)(\s|$)/);
  });

  it('deploy 脚本仍然带 CNAME（自定义域名靠它保留）', () => {
    expect(pkg.scripts.deploy).toMatch(/--cname\s+sec\.c01dkit\.com/);
  });
});
