import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));

/**
 * 站点由本地构建后直传 Cloudflare Pages（Cloudflare 的 Git 联动构建拿不到被 git
 * 忽略的数据 JSON，见 CLAUDE.md）。直传什么就上线什么，所以两件事缺一则静默出错：
 *   1. predeploy 必须先 build —— 否则 `npm run deploy` 会把上一次的旧 dist/ 原样
 *      发出去，构建时写死的统计、下拉框、场次列表都停在旧数据上，且没有任何报错。
 *   2. deploy 直传的必须是 dist/，项目名不能丢。
 */
describe('Cloudflare Pages 部署', () => {
  it('predeploy 先构建，deploy 不会发布过期的 dist/', () => {
    expect(pkg.scripts.predeploy).toBe('npm run build');
  });

  it('deploy 用 wrangler 直传 dist/ 到 sec-papers-collection 项目', () => {
    expect(pkg.scripts.deploy).toMatch(/^wrangler pages deploy dist\s/);
    expect(pkg.scripts.deploy).toMatch(/--project-name[= ]sec-papers-collection(\s|$)/);
  });

  it('令牌从 .env 读取，不依赖 wrangler login', () => {
    expect(pkg.scripts.deploy).toMatch(/--env-file[= ]\.env(\s|$)/);
  });
});
