import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';

// 开发期把 /data/** 映射到 src/assets/data/**。
// 生产环境这些请求走 CDN（见 src/lib/cdn.js），所以这个中间件只在 serve 时挂载。
// 不能改用 public/ 软链：那会把 26MB 的 meta_json 复制进 dist。
const devDataMiddleware = {
  name: 'spc-dev-data',
  apply: 'serve',
  configureServer(server) {
    const root = path.resolve('src/assets/data');
    server.middlewares.use('/data', (req, res, next) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.join(root, rel);
      // 路径穿越防护：拼接后必须仍在 root 之内
      if (!file.startsWith(root + path.sep)) return next();
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      fs.createReadStream(file).pipe(res);
    });
  },
};

export default defineConfig({
  site: 'https://sec.c01dkit.com',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ i18n: { defaultLocale: 'zh', locales: { zh: 'zh-CN', en: 'en' } } })],
  vite: { plugins: [devDataMiddleware] },
});
