import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

describe('依赖', () => {
  const all = { ...pkg.dependencies, ...pkg.devDependencies };

  it('不含任何 Vue / PrimeVue / Tailwind / Vite 依赖', () => {
    const banned = [
      'vue', 'vue-router', 'vue-i18n', '@vitejs/plugin-vue', 'unplugin-vue-components',
      'primevue', 'primeflex', 'primeicons', '@primevue/themes', '@primevue/forms',
      '@primevue/auto-import-resolver', 'primeblocks-vue',
      'tailwindcss', 'tailwindcss-primeui', 'postcss', 'autoprefixer',
      'vite', 'sass', 'eslint-plugin-vue',
    ];
    for (const name of banned) expect(Object.keys(all), name).not.toContain(name);
  });

  it('不含指向自身的坏依赖', () => {
    for (const [name, spec] of Object.entries(all)) {
      expect(spec, name).not.toBe('file:');
    }
  });

  it('运行时依赖只有 chart.js（其余都应是构建期或开发期）', () => {
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['@astrojs/sitemap', 'astro', 'chart.js']);
  });
});

describe('源码目录', () => {
  const files = walk(path.resolve('src'));

  it('没有 .vue / .scss 文件残留', () => {
    const leftovers = files.filter((f) => f.endsWith('.vue') || f.endsWith('.scss'));
    expect(leftovers).toEqual([]);
  });

  it('没有旧目录残留', () => {
    for (const dir of ['src/views', 'src/layout', 'src/router', 'src/locales', 'src/composables', 'src/service']) {
      expect(fs.existsSync(path.resolve(dir)), dir).toBe(false);
    }
  });

  it('没有文件再引用 PrimeVue 的 CSS 变量', () => {
    const offenders = files
      .filter((f) => /\.(js|css|astro|json)$/.test(f) && !f.includes('assets/data'))
      .filter((f) => fs.readFileSync(f, 'utf8').includes('--p-'));
    expect(offenders).toEqual([]);
  });

  it('DEV/PROD 判断只出现在 src/lib/cdn.js', () => {
    const offenders = files
      .filter((f) => /\.(js|astro)$/.test(f))
      .filter((f) => {
        const src = fs.readFileSync(f, 'utf8');
        return /import\.meta\.env\.(DEV|PROD)|process\.env\.NODE_ENV/.test(src);
      })
      .map((f) => path.relative(process.cwd(), f));
    expect(offenders).toEqual(['src/lib/cdn.js']);
  });
});

describe('配置文件', () => {
  it('旧构建配置已删除', () => {
    for (const f of ['vite.config.js', 'tailwind.config.js', 'postcss.config.js', 'vercel.json', 'index.html', 'public/404.html']) {
      expect(fs.existsSync(path.resolve(f)), f).toBe(false);
    }
  });

  it('数据目录仍在原位 —— Python 管道依赖这个路径', () => {
    expect(fs.existsSync(path.resolve('src/assets/data'))).toBe(true);
  });
});
