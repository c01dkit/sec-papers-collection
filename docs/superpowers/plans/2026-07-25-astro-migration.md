# Astro 迁移实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 sec.c01dkit.com 从 Vue 3 SPA 重构为 Astro 静态站，交付顶部导航栏、滚动淡入的落地式首页、页面淡入淡出转场，并把 4 个 PrimeVue 重交互视图重写为原生 JS。

**Architecture:** Astro 7 静态输出（`output:'static'`，无 adapter），部署仍为 GitHub Pages。i18n 用 `[lang]` 动态路由在构建时预渲染 `/zh/` 与 `/en/` 两套，`/` 由客户端脚本分发。数据按体积劈分：小文件（统计/获奖/时间线）构建时读入直接渲染成 HTML，大文件（`data.json`、`meta_json`）运行时从 CDN 拉。浏览器端全部原生 ESM，纯数据逻辑（筛选/分页/高亮/时间线规则）与 DOM 渲染分离，前者单测覆盖。

**Tech Stack:** Astro 7 · 手写 CSS（tokens + global，无 Tailwind）· Chart.js 4（仅趋势页）· vitest + jsdom · gh-pages

**Spec:** `docs/superpowers/specs/2026-07-25-astro-refactor-design.md`

**分支:** 已在 `feat/astro`。全部任务在此分支上完成后再合 main。

---

## Global Constraints

以下是项目级约束，**每个任务的要求都隐含包含本节**：

- **Astro 配置固定值**：`output: 'static'`、`site: 'https://sec.c01dkit.com'`、`base: '/'`、`trailingSlash: 'always'`。不使用任何 adapter。
- **不引入 UI 框架**：不装 Vue、React、Svelte，不装 PrimeVue，不装 Tailwind/PostCSS/autoprefixer。唯一允许的运行时第三方库是 `chart.js`（仅趋势页使用）。
- **视觉三条纪律**：
  1. **任何地方不使用 `box-shadow`** —— 无例外。
  2. **层次只靠发丝线（`--hairline`）和底色深浅（`--bg` / `--band`）**。
  3. **面板、卡片、按钮、输入框、徽章的圆角最大 `2px`**（用 `var(--radius)`）。唯一例外是**形状即语义**的表单控件：开关轨道的药丸形、圆形滑块的 `50%`。这类控件的圆角是它的可识别性本身，不属于「用圆角制造层次」。除此之外不得出现更大的圆角。
- **`src/assets/data/` 目录禁止改动**：Python 管道（`main.py --analyze/--upload`）写入此处，路径必须保持不变。
- **IndexedDB схема 禁止改动**：库名 `spc-settings`、object store `config`、key `app` 与 `favorites`、`DB_VERSION = 1`。现有用户的收藏与关键词不能丢。
- **强调色 slug 固定 4 个**：`slate`（默认）、`indigo`、`oxblood`、`pine`。
- **语言 code 固定 2 个**：`zh`、`en`。默认 `zh`。
- **运行时数据基址只有一处**：`src/lib/cdn.js` 导出的 `DATA_BASE`。任何其他文件不得自行判断 DEV/PROD。
- **CDN 基址**：`https://cdn.c01dkit.com/sec-papers`（沿用现有 `src/service/cdn.js` 的值，实现时以该文件实际内容为准）。
- **所有 `init()` 必须幂等**：用 `el.dataset.bound = '1'` 守卫，因为 `astro:page-load` 在每次软导航后都会触发。
- **测试命令**：`npm test`（= `vitest run`）。单文件：`npx vitest run tests/<file> -t '<name>'`。
- **构建门禁**：`npm run build` 必须零报错零警告。
- **数产物里的出现次数一律用 `grep -o … | wc -l`，不要用 `grep -c`。**Astro 产出的 HTML 是压缩成一行的，而 `grep -c` 数的是**匹配行数**不是出现次数 —— 同一份文件里 `grep -c 'data-reveal'` 得 2、`grep -o … | wc -l` 得 9。用 `-c` 会让本该验证数量的检查悄悄通过或悄悄失败。

---

## 文件结构

实现前先明确每个文件的职责边界。

### 配置与入口

| 文件 | 职责 |
|---|---|
| `package.json` | 依赖与脚本；移除全部 vue/vite/primevue/tailwind 相关项 |
| `astro.config.mjs` | Astro 配置 + sitemap 集成 + 开发期数据中间件 |
| `vitest.config.js` | 测试配置（默认 node 环境） |
| `jsconfig.json` | `@/*` → `src/*` 路径别名 |

### 纯逻辑（无 DOM，全部单测覆盖）

| 文件 | 职责 | 关键导出 |
|---|---|---|
| `src/i18n/index.js` | 文案查表与插值；缺 key 时**抛错**（让构建失败而非线上出裸 key） | `t(lang, key, vars)` `LOCALES` `collectKeys(tree)` |
| `src/i18n/paths.js` | 语言相关的路径计算 | `swapLangInPath(pathname, toLang)` `resolveLang(stored, navLang)` `localizedHref(lang, slug)` |
| `src/lib/cdn.js` | 运行时数据基址**唯一**来源 | `DATA_BASE` `CDN_DATA_BASE` |
| `src/lib/papers.js` | 论文筛选 / 排序 / 分页 / 加载 | `applyFilters` `sortRows` `paginate` `loadPapers` |
| `src/lib/highlight.js` | 关键词切段（从 `composables/useHighlight.js` 移植，去掉全局单例依赖） | `highlightSegments(text, patterns)` |
| `src/lib/coverage.js` | 首页覆盖矩阵数据 | `buildCoverageMatrix(stats)` `TOP_TIER` `SE_SYS` `MATRIX_YEARS` |
| `src/lib/sparkline.js` | 手写 SVG 折线坐标计算 | `buildTotalTrend(stats, years)` `toSparkline(points, opts)` |
| `src/lib/deadlines.js` | 投稿截止日展开与「未来优先」规则 | `flattenDeadlines` `pickUpcomingDeadlines(timeline, today, want)` |
| `src/lib/awards-model.js` | 获奖数据分组 | `groupByAward(conf)` `groupByYear(conf)` `totalPapers(conf)` `pickHighlights(awards, n)` |
| `src/lib/settings-schema.js` | 设置项默认值与迁移（不碰 IndexedDB，纯函数） | `DEFAULT_SETTINGS()` `migrateSettings(raw)` `ACCENTS` |
| `src/lib/chart-palette.js` | 趋势页系列配色（每张图最多 4 条线） | `SERIES(themeIsDark)` |

### 浏览器副作用层

| 文件 | 职责 |
|---|---|
| `src/scripts/boot.js` | 唯一启动点；按 `<main data-page>` 分派；绑 `astro:page-load` |
| `src/scripts/settings-store.js` | **全站唯一**碰 IndexedDB 的文件；同时把 theme/accent/lang 镜像到 localStorage 供预绘制读取 |
| `src/scripts/theme.js` | 明暗与强调色切换 |
| `src/scripts/reveal.js` | 滚动淡入 |
| `src/scripts/nav.js` | 汉堡菜单 + `其他 ▾` 下拉 |
| `src/scripts/paper-table.js` | 检索页渲染 |
| `src/scripts/abstract-view.js` | 摘要页渲染 |
| `src/scripts/trends-chart.js` | 趋势页 Chart.js 封装 |
| `src/scripts/timeline.js` | 时间线页 + 首页倒计时天数 |
| `src/scripts/awards-view.js` | 获奖页交互 |
| `src/scripts/settings-form.js` | 设置页表单 |

### 布局与组件

`src/layouts/BaseLayout.astro`（head + ClientRouter + TopNav + Footer + slot）、`src/layouts/PageLayout.astro`（内容页统一页头，首页与 404 不用）、`src/components/{TopNav,Footer,LangSwitch,ThemeToggle,LangDispatch}.astro`、`src/components/home/{Hero,CoverageMatrix,FeatureBlock,ClosingBand}.astro`。

`FeatureBlock.astro` 做成**一个**带 `flip` prop 的通用组件，5 个功能块传不同 slot 内容 —— 5 个块的骨架完全一致，复制 5 份是 DRY 违规。

### 样式

`src/styles/tokens.css`（语义变量 + 明暗 + 4 强调色）、`src/styles/global.css`（元素基线 + 版式 + 布局工具类）。

### 内容数据

`src/data/changelog.js`（从 `AboutService.js` 抽出）、`src/data/sites.js`（从 `MoreSites.vue` 抽出）、`src/data/sponsors.js`（从 `AboutService.js` 抽出）。

---

## 任务总览

| # | 任务 | 交付物 |
|---|---|---|
| 1 | Astro 骨架与构建管线 | `npm run build` 与 `npm test` 双双通过 |
| 2 | i18n 内核与路径工具 | `t()` / `swapLangInPath` / `resolveLang` + 文案漂移守卫 |
| 3 | 设计系统 tokens | `tokens.css` + `global.css` + 变量完备性测试 |
| 4 | BaseLayout / 转场 / 主题 / 淡入 | 两个页面之间能淡入淡出切换且主题不闪回 |
| 5 | TopNav / Footer / LangSwitch | 顶栏 5 项平铺 + 其他▾ 靠右 + 移动端汉堡 |
| 6 | 语言分发与旧链接 | `/`、`/404`、8 个旧路径全部正确跳转 |
| 7 | 首页数据层 | 覆盖矩阵 / 趋势 / 倒计时 / 获奖精选四组纯函数 |
| 8 | 首页：Hero + 覆盖矩阵 | 首屏与矩阵上线，滚动淡入生效 |
| 9 | 首页：5 个功能块 + 收尾块 | 首页完整 |
| 10 | `settings-schema` + `settings-store` | 设置读写与迁移，IndexedDB 降级不抛错 |
| 11 | `papers.js` 纯数据核心 | 筛选/排序/分页全边界覆盖 |
| 12 | `highlight.js` 移植 | 含正则特殊字符的关键词不再炸 |
| 13 | 检索页 | 预渲染 30 行 + 全量替换 + 收藏 + CDN 失败降级 |
| 14 | 摘要页 | 会议年份选择器 + 摘要加载 + 关键词高亮 |
| 15 | 趋势页 | 3 张 Chart.js 折线图 + 明暗配色跟随 |
| 16 | 时间线页 | 4 个会议完整周期 + 临近高亮 |
| 17 | 获奖页 | 会议卡片 + 按年份/奖项切换 |
| 18 | 关于页 + 更多网站页 | 更新日志、赞助者、外链卡片 |
| 19 | 设置页 | 明暗/强调色/语言/关键词/收藏清理 |
| 20 | 清理、文档、版本 | 旧文件删净，`CLAUDE.md`/README 更新，版本 0.4.0 |

---

### Task 1: Astro 骨架与构建管线

**Files:**
- Modify: `package.json`
- Create: `astro.config.mjs`
- Create: `vitest.config.js`
- Modify: `jsconfig.json`
- Create: `src/pages/index.astro`（临时最小页，Task 6 会替换成语言分发）
- Create: `tests/sanity.test.js`
- Delete: `vite.config.js`、`tailwind.config.js`、`postcss.config.js`、`.eslintrc.cjs`、`vercel.json`、`index.html`

**Interfaces:**
- Consumes: 无
- Produces: 可运行的 `npm run dev` / `npm run build` / `npm test`；`@/*` 别名解析到 `src/*`

- [ ] **Step 1: 装依赖、卸旧依赖**

```bash
npm uninstall vue vue-router vue-i18n primevue primeflex primeicons \
  @primevue/themes @primevue/forms @primevue/auto-import-resolver \
  primeblocks-vue sec-papers-collection-new prismjs quill quill-delta \
  socket.io-client zod tailwindcss tailwindcss-primeui postcss autoprefixer \
  sass vite @vitejs/plugin-vue unplugin-vue-components \
  eslint eslint-plugin-vue @vue/eslint-config-prettier @rushstack/eslint-patch

npm install astro@^7 @astrojs/sitemap chart.js
npm install -D vitest jsdom
```

`primeblocks-vue` 与 `sec-papers-collection-name` 这两条 `"file:"` 依赖是指向仓库自身的坏条目，`npm uninstall` 若报错就直接从 `package.json` 手删。

- [ ] **Step 2: 改写 package.json 的 scripts**

```json
{
  "name": "sec-papers-collection",
  "version": "0.3.12",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run",
    "test:watch": "vitest",
    "deploy": "gh-pages -d dist -f --cname sec.c01dkit.com",
    "deploy:build": "npm run build && npm run deploy"
  }
}
```

版本号留在 `0.3.12`，Task 20 统一推到 `0.4.0`。

- [ ] **Step 3: 写 astro.config.mjs**

`devDataMiddleware` 是开发期把 `/data/**` 映射到 `src/assets/data/**` 的 Vite 中间件。`apply: 'serve'` 保证它不进构建产物 —— 否则 26MB 的 `meta_json` 会被打进 `dist`。`file.startsWith(root)` 那行是路径穿越防护，不能省。

```js
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
```

- [ ] **Step 4: 写 vitest.config.js 与 jsconfig.json**

```js
// vitest.config.js
import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node',        // 需要 DOM 的文件用文件顶部 // @vitest-environment jsdom
    include: ['tests/**/*.test.js'],
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
```

```json
// jsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ESNext",
    "checkJs": false
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: 写最小页面与 sanity 测试**

```astro
---
// src/pages/index.astro —— Task 6 会替换成语言分发页
---
<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8" /><title>build ok</title></head>
<body><p>build ok</p></body></html>
```

```js
// tests/sanity.test.js
import { describe, it, expect } from 'vitest';

describe('测试管线', () => {
  it('能跑起来', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: 删掉旧构建配置**

```bash
git rm -f vite.config.js tailwind.config.js postcss.config.js .eslintrc.cjs vercel.json index.html
```

`vercel.json` 把所有路径 rewrite 到 `index.html`，与 MPA 直接冲突，必须删。

- [ ] **Step 7: 验证两条命令都通**

Run: `npm test`
Expected: PASS，1 passed

Run: `npm run build`
Expected: 构建成功，`dist/index.html` 存在，无警告

Run: `ls dist/index.html && ! ls dist/data 2>/dev/null && echo "✓ 数据未被打进产物"`
Expected: 打印 `✓ 数据未被打进产物`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "build: 用 Astro 替换 Vite/Vue 构建管线

移除 vue/vite/primevue/tailwind 全部依赖，改为 astro + chart.js + vitest。
astro.config.mjs 内置开发期数据中间件，把 /data/** 映射到 src/assets/data/**，
仅 serve 时挂载，避免 26MB meta_json 进入构建产物。
删除与 MPA 冲突的 vercel.json SPA rewrite。"
```

---

### Task 2: i18n 内核与路径工具

**Files:**
- Create: `src/i18n/zh.json`（`git mv src/locales/zh.json`）
- Create: `src/i18n/en.json`（`git mv src/locales/en.json`）
- Create: `src/i18n/index.js`
- Create: `src/i18n/paths.js`
- Create: `tests/i18n.test.js`
- Create: `tests/paths.test.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `t(lang: 'zh'|'en', key: string, vars?: Record<string, string|number>) => string` —— key 不存在时 **throw**
  - `LOCALES: ['zh','en']`、`DEFAULT_LOCALE: 'zh'`
  - `collectKeys(tree: object) => string[]` —— 扁平点分 key 列表
  - `swapLangInPath(pathname: string, toLang: string) => string`
  - `resolveLang(stored: string|null, navLang: string|undefined) => 'zh'|'en'`
  - `localizedHref(lang: string, slug: string) => string` —— `('zh','search') => '/zh/search/'`，`('zh','') => '/zh/'`

- [ ] **Step 1: 写失败的测试**

```js
// tests/i18n.test.js
import { describe, it, expect } from 'vitest';
import { t, LOCALES, collectKeys } from '@/i18n/index.js';
import zh from '@/i18n/zh.json';
import en from '@/i18n/en.json';

describe('t()', () => {
  it('按点分路径取值', () => {
    // 期望值必须照抄 zh.json / en.json 的现有文案，不要凭中文含义反推英文 ——
    // zh 是「标题检索」，但 en 一直是简短的 "Search"，不是 "Search by Title"
    expect(t('zh', 'menu.search')).toBe('标题检索');
    expect(t('en', 'menu.search')).toBe('Search');
  });

  it('插值 {var}', () => {
    expect(t('zh', 'search.totalPapers', { count: 15600 })).toBe('共 15600 篇论文。');
  });

  it('缺失的插值变量原样留在文本里，不产出 undefined', () => {
    expect(t('zh', 'search.totalPapers', {})).toContain('{count}');
  });

  it('key 不存在时抛错，而不是返回裸 key', () => {
    expect(() => t('zh', 'nope.not.here')).toThrow(/missing key/);
  });

  it('未知语言码整体回落到默认语言的文案树', () => {
    expect(t('fr', 'menu.search')).toBe(t('zh', 'menu.search'));
  });

  it('已知语言里查不到的 key 一律抛错，不跨语言借文案', () => {
    // 这一条守的是「en 缺 key 时不能悄悄返回中文」。
    // 注意：因为下面的漂移守卫保证两语 key 集合恒等，单测里无法构造出
    // 「zh 有、en 无」的真实情形，所以这里只能验证不存在的 key 会抛错。
    // 真正兜住不对称回退的是两道防线：漂移守卫（npm test）+ astro build 本身
    // ——每个页面都会对两种语言各调一次 t()，任一语言漏 key 都会让构建失败。
    expect(() => t('en', 'menu.__nonexistent__')).toThrow(/missing key/);
    expect(() => t('zh', 'menu.__nonexistent__')).toThrow(/missing key/);
  });
});

describe('文案漂移守卫', () => {
  it('zh 与 en 的 key 集合完全一致', () => {
    // 这条一红意味着 astro build 也会红：t() 不做跨语言回退，
    // 漏掉的那一侧会在预渲染时抛错。
    const kz = collectKeys(zh).sort();
    const ke = collectKeys(en).sort();
    expect(kz.filter((k) => !ke.includes(k))).toEqual([]);   // zh 独有
    expect(ke.filter((k) => !kz.includes(k))).toEqual([]);   // en 独有
  });

  it('两语都没有空字符串文案', () => {
    for (const lang of LOCALES) {
      for (const key of collectKeys(lang === 'zh' ? zh : en)) {
        expect(t(lang, key), `${lang}:${key}`).not.toBe('');
      }
    }
  });
});

describe('文案之间的依赖关系', () => {
  it('home.headlineAccent 必须是 home.headline 的子串', () => {
    // Hero 靠 indexOf 把这个短语从标题里切出来上斜体。两者一旦对不上，
    // idx 变成 -1，标题会降级成纯文本（Hero 里有 found 判断兜住），
    // 但强调效果就静默消失了 —— 而这是首屏最显眼的一处排版。
    // 改写任一语言的标题时，这条会立刻提醒你同步改 accent。
    for (const lang of LOCALES) {
      const headline = t(lang, 'home.headline');
      const accent = t(lang, 'home.headlineAccent');
      expect(headline, `${lang}: headline 里找不到 accent「${accent}」`).toContain(accent);
    }
  });
});
```

```js
// tests/paths.test.js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/i18n.test.js tests/paths.test.js`
Expected: FAIL，报 `Cannot find module '@/i18n/index.js'`

- [ ] **Step 3: 搬文案文件**

```bash
mkdir -p src/i18n
git mv src/locales/zh.json src/i18n/zh.json
git mv src/locales/en.json src/i18n/en.json
```

- [ ] **Step 4: 实现 src/i18n/index.js**

`t()` 在 key 缺失时抛错是刻意的：文案在构建时填入，抛错会让 `astro build` 失败，而返回裸 key 会让 `menu.search` 这种字符串出现在线上页面上。

```js
import zh from './zh.json';
import en from './en.json';

export const LOCALES = ['zh', 'en'];
export const DEFAULT_LOCALE = 'zh';

const MESSAGES = { zh, en };

function lookup(tree, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), tree);
}

function interpolate(msg, vars) {
  return msg.replace(/\{(\w+)\}/g, (whole, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole
  );
}

export function t(lang, key, vars) {
  // 未知语言码（不是 zh/en）整体回退到默认语言的文案树。
  //
  // 但**已知语言缺 key 时绝不跨语言回退**：en 漏一条文案就抛错、让 astro build
  // 当场失败。曾经这里多一行 `?? lookup(MESSAGES[DEFAULT_LOCALE], key)`，
  // 后果是 en 缺 key 时静默返回中文 —— 英文页面渲染出中文散文，构建照样通过。
  // 那比渲染出裸 key 更糟，也更难被发现。
  const tree = MESSAGES[lang] ?? MESSAGES[DEFAULT_LOCALE];
  const msg = lookup(tree, key);
  if (typeof msg !== 'string') {
    throw new Error(`i18n: missing key "${key}" (lang=${lang})`);
  }
  return vars ? interpolate(msg, vars) : msg;
}

export function collectKeys(tree, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) out.push(...collectKeys(v, key));
    else out.push(key);
  }
  return out;
}
```

- [ ] **Step 5: 实现 src/i18n/paths.js**

```js
import { LOCALES, DEFAULT_LOCALE } from './index.js';

const LANG_PREFIX = new RegExp(`^/(${LOCALES.join('|')})(/.*)?$`);

export function swapLangInPath(pathname, toLang) {
  const m = String(pathname || '').match(LANG_PREFIX);
  if (!m) return `/${toLang}/`;
  return `/${toLang}${m[2] || '/'}`;
}

export function resolveLang(stored, navLang) {
  if (LOCALES.includes(stored)) return stored;
  return String(navLang || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function localizedHref(lang, slug) {
  return slug ? `/${lang}/${slug}/` : `/${lang}/`;
}

export { LOCALES, DEFAULT_LOCALE };
```

- [ ] **Step 6: 跑测试确认通过**

Run: `npx vitest run tests/i18n.test.js tests/paths.test.js`
Expected: PASS，全部通过

若「两语都没有空字符串文案」一条失败，说明现有文案表里确实有空值 —— 修文案而不是改测试。

- [ ] **Step 7: 删掉旧 locales 目录**

```bash
git rm -f src/locales/index.js
rmdir src/locales 2>/dev/null || true
```

`src/locales/index.js` 里的 `languageEmitter` 是运行时切换语言用的，路由分语言后不再需要。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(i18n): 构建时文案查表与语言路径工具

t() 在 key 缺失时抛错，让 astro build 失败而非线上出现裸 key。
补文案漂移守卫测试：断言 zh/en key 集合一致且无空文案。
移除 vue-i18n 的 languageEmitter（路由分语言后不需要运行时切换）。"
```

---

### Task 3: 设计系统 tokens

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `tests/tokens.test.js`

**Interfaces:**
- Consumes: 无
- Produces: CSS 自定义属性契约 —— `--bg` `--band` `--panel` `--ink` `--muted` `--faint` `--hairline` `--hairline-soft` `--accent` `--accent-soft` `--hl-bg` `--gold`；由 `html[data-theme="light"|"dark"]` × `html[data-accent="slate"|"indigo"|"oxblood"|"pine"]` 组合决定取值。工具类 `.wrap` `.band` `.panel` `.kicker` `.srf` `[data-reveal]`。

- [ ] **Step 1: 写失败的测试**

这个测试解析 CSS 文本，断言 4 个强调色 × 明暗两套共 8 组取值都存在，且全文件没有 `box-shadow`。纯文本断言，不需要浏览器。

```js
// tests/tokens.test.js
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const tokens = fs.readFileSync(path.resolve('src/styles/tokens.css'), 'utf8');
const global = fs.readFileSync(path.resolve('src/styles/global.css'), 'utf8');

const ACCENTS = ['slate', 'indigo', 'oxblood', 'pine'];
const THEMES = ['light', 'dark'];

describe('tokens.css', () => {
  it('明暗两套语义色都定义齐全', () => {
    const vars = ['--bg', '--band', '--panel', '--ink', '--muted', '--faint', '--hairline', '--hairline-soft', '--hl-bg'];
    for (const theme of THEMES) {
      const block = tokens.match(new RegExp(`\\[data-theme=['"]?${theme}['"]?\\]\\s*\\{([^}]*)\\}`));
      expect(block, `缺少 data-theme=${theme} 区块`).toBeTruthy();
      for (const v of vars) {
        expect(block[1], `${theme} 缺少 ${v}`).toContain(v + ':');
      }
    }
  });

  it('4 个强调色在明暗下各有一组 --accent / --accent-soft', () => {
    for (const theme of THEMES) {
      for (const accent of ACCENTS) {
        const re = new RegExp(
          `\\[data-theme=['"]?${theme}['"]?\\]\\[data-accent=['"]?${accent}['"]?\\]\\s*\\{([^}]*)\\}`
        );
        const block = tokens.match(re);
        expect(block, `缺少 ${theme}/${accent} 组合`).toBeTruthy();
        expect(block[1]).toContain('--accent:');
        expect(block[1]).toContain('--accent-soft:');
      }
    }
  });
});

// 这两条纪律要覆盖整个 src/，不能只查 tokens.css 与 global.css ——
// 违规最可能出现的地方是后续任务里 .astro 组件内的 <style> 块。
// 现在 src/ 下还没有 .astro 组件，这个守卫先立在这里，随组件到位自动开始生效。
function styleSources() {
  const out = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(astro|css)$/.test(e.name)) out.push(p);
    }
  };
  walk(path.resolve('src'));
  return out;
}

describe('视觉纪律', () => {
  it('src/ 下任何样式都不使用 box-shadow', () => {
    const offenders = styleSources().filter((f) => /box-shadow/.test(fs.readFileSync(f, 'utf8')));
    expect(offenders.map((f) => path.relative(process.cwd(), f))).toEqual([]);
  });

  it('.astro 模板里不写 HTML 注释（会被原样输出到产物）', () => {
    // Astro 把模板区的 <!-- --> 原样输出到产物，frontmatter 里的 // 注释不会。
    // 开发者备注属于后者。这条守卫存在的原因很朴素：同一个错我在这个项目里犯了
    // 三次 —— FeatureBlock、DeadlineDemo、TopNav，其中 TopNav 那处在线上待了
    // 好几个任务才被发现。而且组件会渲染多次，注释就跟着重复多次。
    const offenders = [];
    for (const file of styleSources().filter((f) => f.endsWith('.astro'))) {
      const src = fs.readFileSync(file, 'utf8');
      // 只看 frontmatter 之后的模板区
      const m = src.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
      const template = m ? m[1] : src;
      if (/<!--/.test(template)) {
        offenders.push(path.relative(process.cwd(), file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('px 字面量圆角不超过 2px', () => {
    // 只查 px 字面量。药丸形开关轨道（rem）与圆形滑块（50%）是「形状即语义」的
    // 表单控件，按 Global Constraints 第 3 条豁免，所以不查 rem/%。
    // 这是一道绊线而非证明：它拦住「随手写个 8px 圆角」这类最常见的破例。
    const offenders = [];
    for (const f of styleSources()) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/border-radius:\s*([\d.]+)px/g)) {
        if (Number(m[1]) > 2) offenders.push(`${path.relative(process.cwd(), f)}: ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/tokens.test.js`
Expected: FAIL，`ENOENT: no such file or directory ... tokens.css`

- [ ] **Step 3: 实现 src/styles/tokens.css**

```css
/* ── 语义色：明 ───────────────────────────────────────────── */
html[data-theme='light'] {
  --bg: #fbfaf8;
  --band: #f5f2eb;
  --panel: #fbfaf8;
  --ink: #17150f;
  --muted: #5d5648;
  --faint: #8c7f66;
  --hairline: #e3ded4;
  --hairline-soft: #f0ece3;
  --hl-bg: #e8dfc8;
  --gold: #b8973f;
  --inverse-bg: #17150f;
  --inverse-ink: #f5f2eb;
  --inverse-muted: #a89d86;
  --inverse-hairline: #332f26;
}

/* ── 语义色：暗（暖墨黑，不是纯黑，才接得住纸感）─────────── */
html[data-theme='dark'] {
  --bg: #14120f;
  --band: #1b1815;
  --panel: #191614;
  --ink: #f0ebe2;
  --muted: #b3a898;
  --faint: #857a69;
  --hairline: #302b24;
  --hairline-soft: #221e19;
  --hl-bg: #4a3f20;
  --gold: #cfae5c;
  --inverse-bg: #f0ebe2;
  --inverse-ink: #17150f;
  --inverse-muted: #5d5648;
  --inverse-hairline: #d6cfc2;
}

/* ── 强调色：4 组 × 明暗。深色底上需要更亮的一版才不糊 ───── */
html[data-theme='light'][data-accent='slate']   { --accent: #2f4858; --accent-soft: #a8bcc7; }
html[data-theme='light'][data-accent='indigo']  { --accent: #3a3f7a; --accent-soft: #b0b3d8; }
html[data-theme='light'][data-accent='oxblood'] { --accent: #7d3038; --accent-soft: #d3aaae; }
html[data-theme='light'][data-accent='pine']    { --accent: #2f5744; --accent-soft: #a6c4b5; }

html[data-theme='dark'][data-accent='slate']    { --accent: #7fa8bd; --accent-soft: #3d5b6d; }
html[data-theme='dark'][data-accent='indigo']   { --accent: #9aa0dd; --accent-soft: #464a80; }
html[data-theme='dark'][data-accent='oxblood']  { --accent: #d9868f; --accent-soft: #7a3f46; }
html[data-theme='dark'][data-accent='pine']     { --accent: #83bda1; --accent-soft: #3a6350; }

/* ── 版式与间距 ──────────────────────────────────────────── */
:root {
  --font-sans: 'Inter var', ui-sans-serif, system-ui, -apple-system, 'Noto Sans SC', sans-serif;
  --font-serif: Georgia, 'Times New Roman', 'Songti SC', 'Noto Serif SC', serif;

  --fs-display: clamp(2rem, 1.4rem + 2.6vw, 2.85rem);
  --fs-h1: clamp(1.5rem, 1.2rem + 1.2vw, 1.95rem);
  --fs-h2: 1.5rem;
  --fs-h3: 1.125rem;
  --fs-body: 0.9375rem;
  --fs-small: 0.8125rem;
  --fs-kicker: 0.6875rem;

  --wrap-max: 1120px;
  --wrap-pad: clamp(1.1rem, 3vw, 2.15rem);
  --sp-band: clamp(2.6rem, 5vw, 3.5rem);
  --sp-gap: clamp(1.8rem, 4vw, 2.9rem);

  --radius: 2px;
  --dur: 0.22s;
  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
}

/* 主题切换时的短暂过渡；不加在 * 上以免拖慢首绘 */
html.theme-anim,
html.theme-anim body {
  transition: background-color 0.45s var(--ease), color 0.45s var(--ease);
}
```

- [ ] **Step 4: 实现 src/styles/global.css**

```css
@font-face {
  font-family: 'Inter var';
  font-weight: 100 900;
  font-display: swap;
  font-style: normal;
  src: url('/fonts/Inter-roman.var.woff2') format('woff2');
}

*, *::before, *::after { box-sizing: border-box; }

/* 作者样式里的任何 display 都会盖过 UA 样式对 [hidden] 的 display:none。
   本项目有多处「平时 hidden、需要时用脚本显示」的元素（检索页的提示条、
   摘要页的结果区、获奖页的分组面板、设置页的降级警告），只要它们的类上写了
   display，hidden 就会失效 —— 表现为页面上常驻一条空白条，看起来像布局错乱
   而不像 bug，很难往这上面想。所以在全局兜一次。 */
[hidden] { display: none !important; }

html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-sans);
  font-size: var(--fs-body);
  line-height: 1.78;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 { font-family: var(--font-serif); font-weight: 400; letter-spacing: -0.02em; margin: 0; }
h1 { font-size: var(--fs-h1); line-height: 1.18; }
h2 { font-size: var(--fs-h2); line-height: 1.24; }
h3 { font-size: var(--fs-h3); line-height: 1.3; }

p { margin: 0 0 1em; }
p:last-child { margin-bottom: 0; }

a { color: inherit; text-decoration: none; }

/* 正文链接：发丝下划线，不用颜色块 */
a.lnk {
  color: var(--accent);
  border-bottom: 1px solid var(--accent-soft);
  padding-bottom: 1px;
  transition: border-color var(--dur) var(--ease);
}
a.lnk:hover { border-bottom-color: var(--accent); }

:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ── 布局 ────────────────────────────────────────────────── */
.wrap { max-width: var(--wrap-max); margin-inline: auto; padding-inline: var(--wrap-pad); }
.band { padding-block: var(--sp-band); border-top: 1px solid var(--hairline); }
.band--tint { background: var(--band); }
.band--inverse { background: var(--inverse-bg); color: var(--inverse-ink); }

.panel { background: var(--panel); border: 1px solid var(--hairline); border-radius: var(--radius); }

.srf { font-family: var(--font-serif); }

.kicker {
  font-size: var(--fs-kicker);
  letter-spacing: 0.17em;
  text-transform: uppercase;
  color: var(--faint);
}

.hl { background: var(--hl-bg); color: var(--ink); }

/* ── 滚动淡入 ────────────────────────────────────────────
   opacity:0 只在 html.reveal-on 下生效，而 reveal-on 由 <head>
   内联脚本在「允许动效」时才添加。这样无 JS 或开启减少动效时，
   内容默认可见。反过来写会让无 JS 用户看到白页。            */
html.reveal-on [data-reveal] {
  opacity: 0;
  transform: translateY(22px);
  transition: opacity 0.7s var(--ease), transform 0.7s var(--ease);
}
html.reveal-on [data-reveal].in { opacity: 1; transform: none; }

/* ── 页面转场：整文档淡入淡出 ───────────────────────────── */
@keyframes spc-fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes spc-fade-out { from { opacity: 1; } to { opacity: 0; } }

::view-transition-old(root) { animation: spc-fade-out var(--dur) var(--ease) both; }
::view-transition-new(root) { animation: spc-fade-in var(--dur) var(--ease) both; }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root), ::view-transition-new(root) { animation: none; }
}
```

- [ ] **Step 5: 把字体搬到 public/fonts 并删掉斜体那份**

`@font-face` 的 `src` 指向 `/fonts/...`，所以字体必须在 `public/` 下而不是 `src/assets/fonts/`。

```bash
mkdir -p public/fonts
git mv src/assets/fonts/Inter-roman.var.woff2 public/fonts/Inter-roman.var.woff2
git rm -f src/assets/fonts/Inter-italic.var.woff2       # 245KB，标题斜体由系统衬线提供
git rm -f src/assets/fonts/LXGWWenKaiScreen.ttf         # 0 字节空文件，从来没生效过
rmdir src/assets/fonts 2>/dev/null || true
```

- [ ] **Step 6: 跑测试确认通过**

Run: `npx vitest run tests/tokens.test.js`
Expected: PASS，4 个测试全通过

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(styles): 学术编辑风设计系统 tokens

明暗两套语义色 + 4 个强调色各带明暗两版（深色底上需要更亮的一版才不糊）。
关键词高亮底色独立于强调色，避免换色时打架。
滚动淡入的 opacity:0 挂在 html.reveal-on 下，由内联脚本按动效偏好添加，
保证无 JS 时内容默认可见。
测试断言 8 组强调色取值齐全、全站无 box-shadow、圆角不超过 2px。
删除 245KB 的 Inter 斜体（标题斜体走系统衬线）与 0 字节的 LXGWWenKai 空文件。"
```

---

### Task 4: BaseLayout、转场、主题与滚动淡入

> **执行顺序：本任务在 Task 5 之后做。** `BaseLayout.astro` 要 import `TopNav` 与
> `Footer`，`boot.js` 要 import `nav.js` —— 这三个文件由 Task 5 创建，所以按 4→5
> 的顺序做的话 Task 4 过不了自己的构建门禁。依赖是单向的（Task 5 不需要 Task 4 的
> 任何产物），因此只需调换执行顺序，编号不动。
>
> 本任务的人工验收同时覆盖 Task 5 的顶栏视觉检查 —— 顶栏要有页面渲染才看得见，
> 而第一个渲染它的页面就是这里的 BaseLayout。

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/layouts/PageLayout.astro`
- Create: `src/scripts/boot.js`
- Create: `src/scripts/theme.js`
- Create: `src/scripts/reveal.js`
- Create: `src/pages/[lang]/index.astro`（临时占位，Task 8–9 替换为真首页）
- Create: `src/pages/[lang]/about.astro`（临时占位，Task 18 替换）
- Create: `tests/theme.test.js`
- Create: `tests/boot.test.js`
- Delete: `src/pages/index.astro`（Task 1 的临时页）

**Interfaces:**
- Consumes: `t` / `LOCALES`（Task 2）、`tokens.css` / `global.css`（Task 3）
- Produces:
  - `BaseLayout` props：`{ lang: 'zh'|'en', title: string, description?: string, page: string, wide?: boolean }`。`page` 会渲染成 `<main data-page={page}>`，`boot.js` 靠它分派。
  - `PageLayout` props：`{ lang, title, description?, page, kicker?: string, lead?: string }`
  - `nextTheme(cur: string) => 'light'|'dark'`
  - `cycleAccent(cur: string, dir?: 1|-1) => string`
  - `registerPage(name: string, initFn: () => void)` —— 各页面脚本用它注册自己的 `init`
  - `initReveal() => void`（幂等）

- [ ] **Step 1: 写失败的测试**

主题的纯逻辑部分（下一个主题是什么、强调色怎么轮转）能单测；DOM 部分靠 Task 4 末尾的人工验收。

```js
// tests/theme.test.js
import { describe, it, expect } from 'vitest';
import { nextTheme, cycleAccent } from '@/scripts/theme.js';
import { ACCENTS } from '@/lib/settings-schema.js';

describe('nextTheme', () => {
  it('明暗互换', () => {
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('light');
  });

  it('脏值一律当作 light，切到 dark', () => {
    expect(nextTheme(undefined)).toBe('dark');
    expect(nextTheme('sepia')).toBe('dark');
  });
});

describe('cycleAccent', () => {
  it('按固定顺序向前轮转', () => {
    expect(cycleAccent('slate')).toBe('indigo');
    expect(cycleAccent('pine')).toBe('slate');       // 末尾回到开头
  });

  it('能反向轮转', () => {
    expect(cycleAccent('slate', -1)).toBe('pine');
  });

  it('脏值从第一个开始', () => {
    expect(cycleAccent('purple')).toBe(ACCENTS[0]);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/theme.test.js`
Expected: FAIL，`Cannot find module '@/scripts/theme.js'`

- [ ] **Step 3: 先建 settings-schema 里的 ACCENTS 常量**

Task 10 会把这个文件补全，现在只需要它导出 `ACCENTS`，避免 Task 4 与 Task 10 循环依赖。

```js
// src/lib/settings-schema.js
export const ACCENTS = ['slate', 'indigo', 'oxblood', 'pine'];
export const THEMES = ['light', 'dark'];
```

- [ ] **Step 4: 实现 src/scripts/theme.js**

localStorage 是**预绘制缓存**（同步可读），IndexedDB 是持久存储（异步）。首绘前必须读到主题，所以两处都写。这个双写关系要记住 —— 只写 IndexedDB 会导致每次首绘闪一下默认主题。

```js
import { ACCENTS, THEMES } from '@/lib/settings-schema.js';

export const LS_THEME = 'spc-theme';
export const LS_ACCENT = 'spc-accent';

export function nextTheme(cur) {
  return cur === 'dark' ? 'light' : 'dark';
}

export function cycleAccent(cur, dir = 1) {
  const i = ACCENTS.indexOf(cur);
  if (i < 0) return ACCENTS[0];
  return ACCENTS[(i + dir + ACCENTS.length) % ACCENTS.length];
}

function apply(theme, accent) {
  const el = document.documentElement;
  el.classList.add('theme-anim');
  if (THEMES.includes(theme)) el.dataset.theme = theme;
  if (ACCENTS.includes(accent)) el.dataset.accent = accent;
  clearTimeout(window.__spcThemeTimer);
  window.__spcThemeTimer = setTimeout(() => el.classList.remove('theme-anim'), 500);
}

// 持久化：localStorage 供下次首绘同步读取，IndexedDB 供设置页读取。
// settings-store 在 Task 10 补上；此处动态引入以免它还不存在时报错。
async function persist(patch) {
  try {
    if (patch.theme) localStorage.setItem(LS_THEME, patch.theme);
    if (patch.accent) localStorage.setItem(LS_ACCENT, patch.accent);
  } catch {
    /* 隐私模式下 localStorage 可能抛错，忽略 */
  }
  try {
    // settings-store.js 在 Task 10 之前不存在于磁盘上，这个动态 import 注定失败，
    // 要靠下面的 catch 接住。但字面量路径会被静态分析提前解析，而两条流水线的
    // 行为并不一致（本仓库实测）：
    //   - astro build（Rolldown 生产打包）：字面量且无 @vite-ignore 时直接
    //     UNRESOLVED_IMPORT 构建失败 —— 发生在 try/catch 起作用之前；
    //     加 /* @vite-ignore */ 可跳过静态解析、留到运行时。
    //   - vitest 的 jsdom environment（本文件被 tests/boot.test.js 经 boot.js
    //     间接引入时）：同一处即便加了 /* @vite-ignore */ 仍会在 transform 阶段
    //     报 "Failed to resolve import"；换成 node environment 则不会。
    // 把路径装进变量能在两条流水线里都稳定生效：变量不是字符串字面量，
    // 两边的静态分析都无法提前解析，于是都当作真正的运行时动态 import，
    // 执行到这一行才去取，失败正常落进 catch。
    //
    // Task 10 建好 settings-store.js 之后，把这里改回字面量
    // `await import('./settings-store.js')` 并去掉变量与 @vite-ignore ——
    // 那时静态解析能成功，恢复静态检查才能在路径写错时发现问题。
    const settingsStorePath = './settings-store.js';
    const mod = await import(/* @vite-ignore */ settingsStorePath);
    await mod.patchSettings({
      ...(patch.theme ? { darkTheme: patch.theme === 'dark' } : {}),
      ...(patch.accent ? { theme: patch.accent } : {}),
    });
  } catch {
    /* settings-store 不可用时静默降级，localStorage 已足够维持体验 */
  }
}

// 水合只做一次：软导航后模块仍在内存里，没必要每次 page-load 都读库。
let hydrated = false;

/**
 * 把库里的持久偏好补应用到页面上。预绘制脚本只读 localStorage 镜像，
 * 而老用户没有镜像（旧站不写 spc-* 键），所以首访时得靠这一步把偏好找回来。
 * 只在 remember 标志允许、且与当前已应用的值不一致时才动 DOM。
 */
async function hydrateAndApply() {
  if (hydrated) return;
  hydrated = true;
  try {
    const mod = await import('./settings-store.js');
    const s = await mod.hydrateSettings();
    const el = document.documentElement;

    if (s.rememberDarkMode) {
      const want = s.darkTheme ? 'dark' : 'light';
      if (el.dataset.theme !== want) apply(want, el.dataset.accent);
    }
    if (s.rememberTheme && ACCENTS.includes(s.theme) && el.dataset.accent !== s.theme) {
      apply(el.dataset.theme, s.theme);
    }
  } catch (err) {
    // 水合失败不该影响页面 —— 顶多是这次没找回偏好
    console.warn('[theme] 设置水合失败', err);
  }
}

export function initTheme() {
  const el = document.documentElement;

  hydrateAndApply();

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn && !themeBtn.dataset.bound) {
    themeBtn.dataset.bound = '1';
    themeBtn.addEventListener('click', () => {
      const theme = nextTheme(el.dataset.theme);
      apply(theme, el.dataset.accent);
      persist({ theme });
    });
  }

  const accentBtn = document.getElementById('accentCycle');
  if (accentBtn && !accentBtn.dataset.bound) {
    accentBtn.dataset.bound = '1';
    accentBtn.addEventListener('click', () => {
      const accent = cycleAccent(el.dataset.accent);
      apply(el.dataset.theme, accent);
      persist({ accent });
    });
  }
}

export { apply as applyTheme };
```

- [ ] **Step 5: 实现 src/scripts/reveal.js**

```js
export function initReveal() {
  const els = document.querySelectorAll('html.reveal-on [data-reveal]:not(.in)');
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        // 同一父级内按序号错开，让一组元素依次浮现而非齐刷刷跳出
        const i = el.parentElement ? [].indexOf.call(el.parentElement.children, el) : 0;
        el.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
        el.classList.add('in');
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.1 }
  );

  els.forEach((el) => io.observe(el));
}
```

- [ ] **Step 6: 实现 src/scripts/boot.js**

```js
import { initTheme } from './theme.js';
import { initReveal } from './reveal.js';
import { initNav } from './nav.js';

const PAGES = new Map();

/**
 * 页面脚本用它注册自己的 init；boot 按 <main data-page> 分派。
 *
 * **必须在模块顶层同步调用**（通过页面里的静态 `<script>` import）。
 * Astro 保证 `astro:page-load` 在本页所有静态阻塞脚本执行完之后才触发，
 * 所以顶层调用一定赶得上。反之，若从 `then()`、async 回调或延迟的
 * 动态 `import()` 里调用，注册可能发生在 boot() 已经分派之后 ——
 * 下面的 `if (fn)` 会静默跳过，页面的 init 永不执行，既不报错也无警告。
 * 那种 bug 的表现是「检索页就是不工作」，极难定位。
 */
export function registerPage(name, initFn) {
  PAGES.set(name, initFn);
}

async function boot() {
  initNav();
  initTheme();
  initReveal();

  const page = document.querySelector('main[data-page]')?.dataset.page;
  if (!page) return;

  const fn = PAGES.get(page);
  if (fn) {
    try {
      await fn();
    } catch (err) {
      console.error(`[boot] 页面 "${page}" 初始化失败`, err);
    }
  }
}

// astro:page-load 在首次加载与每次软导航后都会触发，
// 所以所有 init 必须幂等（用 dataset.bound 守卫）。
document.addEventListener('astro:page-load', boot);
```

- [ ] **Step 6b: 给 boot.js 的分派补测试**

`boot.js` 的分派是后续 13 个任务共用的入口，而它坏掉的方式是**静默的** —— 页面的 `init` 不执行，既不报错也无警告，表现为「某个页面就是不工作」。这条路径能在 jsdom 里直接测，不需要浏览器。

```js
// tests/boot.test.js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// boot.js 在模块顶层就 document.addEventListener('astro:page-load', boot)。
// vi.resetModules() 只让下次 import 拿到新模块实例，**不会摘掉上一个实例已经
// 挂在 document 上的监听器** —— 不处理的话监听器会逐个用例累积（1→2→3…），
// 每次 dispatch 都会把之前所有模块实例的 boot 一起跑一遍。目前恰好无害
// （六个用例的 page 名互不相同），但这等于测试之间没有隔离，
// 而这套测试正是要给「后续 13 个任务共用的分派入口」当回归网 ——
// 网自己漏着不行。所以显式记录并在 afterEach 摘掉。
let pageLoadListeners = [];

async function freshBoot() {
  vi.resetModules();
  return import('@/scripts/boot.js');
}

function mountPage(name) {
  document.body.innerHTML =
    name === null ? '<main></main>' : `<main data-page="${name}"></main>`;
}

// boot() 是 async 的，事件派发后要把微任务与一轮宏任务都放干
const settle = () => new Promise((r) => setTimeout(r, 0));

describe('boot 分派', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    pageLoadListeners = [];
    // 必须在 freshBoot() 之前装好：boot.js 是在被 import 的那一刻注册监听器的
    const realAdd = document.addEventListener.bind(document);
    vi.spyOn(document, 'addEventListener').mockImplementation((type, fn, opts) => {
      if (type === 'astro:page-load') pageLoadListeners.push(fn);
      return realAdd(type, fn, opts);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const fn of pageLoadListeners) {
      document.removeEventListener('astro:page-load', fn);
    }
    pageLoadListeners = [];
  });

  it('data-page 命中已注册页面时，init 被调用一次', async () => {
    const { registerPage } = await freshBoot();
    const init = vi.fn();
    registerPage('search', init);
    mountPage('search');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(init).toHaveBeenCalledTimes(1);
  });

  it('只触发匹配的那个页面，不误触其他已注册页面', async () => {
    const { registerPage } = await freshBoot();
    const search = vi.fn();
    const trends = vi.fn();
    registerPage('search', search);
    registerPage('trends', trends);
    mountPage('trends');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(trends).toHaveBeenCalledTimes(1);
    expect(search).not.toHaveBeenCalled();
  });

  it('data-page 未注册时不抛错', async () => {
    await freshBoot();
    mountPage('nobody-registered-this');

    document.dispatchEvent(new Event('astro:page-load'));
    await expect(settle()).resolves.toBeUndefined();
  });

  it('没有 data-page 属性时不抛错', async () => {
    await freshBoot();
    mountPage(null);

    document.dispatchEvent(new Event('astro:page-load'));
    await expect(settle()).resolves.toBeUndefined();
  });

  it('页面 init 抛错时被兜住并记录，不冒泡成未处理拒绝', async () => {
    const { registerPage } = await freshBoot();
    const err = new Error('页面初始化炸了');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerPage('broken', () => {
      throw err;
    });
    mountPage('broken');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(spy).toHaveBeenCalled();
    // 错误信息里要带上页面名，否则线上排查时看不出是哪个页面
    expect(spy.mock.calls[0].join(' ')).toContain('broken');
  });

  it('软导航重复触发时，init 每次都会跑（页面内容已被换掉）', async () => {
    const { registerPage } = await freshBoot();
    const init = vi.fn();
    registerPage('search', init);
    mountPage('search');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();
    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(init).toHaveBeenCalledTimes(2);
  });
});
```

最后一条记录的是一个**有意的**设计点：`boot()` 本身不做幂等，因为软导航后 DOM 是全新的、页面 init 必须重跑；幂等的责任在各页面自己的 `init()` 内部（`dataset.bound` 守卫）。

最后补一对**能真正失败**的隔离守卫，放在 describe 末尾。

先说清为什么不能用「数一下 `pageLoadListeners` 的长度」来守：`pageLoadListeners` 每个 `beforeEach` 都被清空，而每个用例只调一次 `freshBoot()`，所以它**恒等于 1** —— 不管 `afterEach` 的摘除有没有生效。那种断言是同义反复，读起来像覆盖率、实际什么都不守，比没有测试更糟。

真正能观测到跨用例污染的办法是：前一个用例留下一个探针 `init`，后一个用例挂同样的 page 名再派发一次，断言探针**没有**被再调用。若 `afterEach` 的摘除被删掉，前一个模块实例的 `boot` 会跟着跑、命中它自己 `PAGES` 里的探针，计数变 2，测试当场红。

```js
  // 这两条用例共同构成一条断言，必须相邻且按声明顺序执行（vitest 默认如此）。
  // 这是有意的用例间耦合 —— 跨用例污染只能跨用例观测。
  let leakProbe;

  it('留下一个探针 init（与下一条共同构成隔离断言）', async () => {
    const { registerPage } = await freshBoot();
    leakProbe = vi.fn();
    registerPage('leak-probe', leakProbe);
    mountPage('leak-probe');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(leakProbe).toHaveBeenCalledTimes(1);
  });

  it('上一个用例的监听器不会在本用例里被触发（隔离断言）', async () => {
    // 新模块实例的 PAGES 是空的，没有 leak-probe。
    await freshBoot();
    // 故意挂上一个用例的 page 名：若上一个模块实例的监听器还挂在 document 上，
    // 它的 boot 会跑起来并在自己的 PAGES 里命中 leak-probe，把计数推到 2。
    mountPage('leak-probe');

    document.dispatchEvent(new Event('astro:page-load'));
    await settle();

    expect(leakProbe).toHaveBeenCalledTimes(1); // 仍是 1 —— 没有被第二次调用
  });
```

Run: `npx vitest run tests/boot.test.js`
Expected: 9 个用例全部通过

**再确认这条守卫真的会失败**（否则又是一条自我感觉良好的测试）：临时把 `afterEach` 里的摘除循环注释掉，重跑 `npx vitest run tests/boot.test.js`，最后一条必须报 `expected 1, received 2`。确认后把循环恢复。把这次「故意弄坏再修好」的两段输出都放进报告 —— 那是这条守卫有效的唯一证据。

- [ ] **Step 7: 实现 src/layouts/BaseLayout.astro**

`is:inline` 是必须的 —— 这段脚本要在首绘前同步执行，不能被 Astro 打包成 `type="module"`（那是 defer 的，会闪）。

`astro:before-swap` 那段把主题状态抄到即将换入的 document 上，否则每次软导航主题都会闪回默认值。

```astro
---
import '@/styles/tokens.css';
import '@/styles/global.css';
import { ClientRouter } from 'astro:transitions';
import TopNav from '@/components/TopNav.astro';
import Footer from '@/components/Footer.astro';
import { t } from '@/i18n/index.js';

const { lang, title, description, page, wide = false } = Astro.props;

const siteName = t(lang, 'common.title');
const fullTitle = title ? `${title} · ${siteName}` : siteName;
const desc = description ?? t(lang, 'home.metaDescription');
const htmlLang = lang === 'zh' ? 'zh-CN' : 'en';
---

<!doctype html>
<html lang={htmlLang} data-theme="light" data-accent="slate">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={desc} />
    <link rel="icon" href="/favicon.ico" />
    <link rel="alternate" hreflang="zh-CN" href={new URL(Astro.url.pathname.replace(/^\/(zh|en)/, '/zh'), Astro.site)} />
    <link rel="alternate" hreflang="en" href={new URL(Astro.url.pathname.replace(/^\/(zh|en)/, '/en'), Astro.site)} />
    <ClientRouter />

    <script is:inline>
      // 首绘前同步定主题：必须 is:inline，打包成 module 会 defer 从而闪一下默认主题。
      // 数据源是 localStorage（同步），IndexedDB 是异步的、来不及。
      (function () {
        var d = document.documentElement;
        var ACCENTS = ['slate', 'indigo', 'oxblood', 'pine'];
        var t, a;
        try {
          t = localStorage.getItem('spc-theme');
          a = localStorage.getItem('spc-accent');
        } catch (e) {}
        d.dataset.theme =
          t === 'dark' || t === 'light'
            ? t
            : window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light';
        d.dataset.accent = ACCENTS.indexOf(a) >= 0 ? a : 'slate';
        // 只有允许动效时才开启 reveal 门控，否则内容保持默认可见
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          d.classList.add('reveal-on');
        }
      })();

      // 软导航换入新 document 时把主题状态带过去，否则每次跳转都闪回默认值
      document.addEventListener('astro:before-swap', function (e) {
        var cur = document.documentElement;
        var nxt = e.newDocument.documentElement;
        nxt.dataset.theme = cur.dataset.theme;
        nxt.dataset.accent = cur.dataset.accent;
        if (cur.classList.contains('reveal-on')) nxt.classList.add('reveal-on');
      });
    </script>
  </head>

  <body>
    <a class="skip" href="#content">{t(lang, 'common.skipToContent')}</a>
    <TopNav lang={lang} />
    <main id="content" data-page={page} class={wide ? '' : 'wrap main-pad'}>
      <slot />
    </main>
    <Footer lang={lang} />
    <script>
      import '@/scripts/boot.js';
    </script>
  </body>
</html>

<style>
  .skip {
    position: absolute;
    left: -9999px;
    top: 0;
    background: var(--ink);
    color: var(--bg);
    padding: 0.6rem 1rem;
    z-index: 99;
  }
  .skip:focus { left: 0; }
  .main-pad { padding-block: clamp(1.5rem, 3vw, 2.6rem) var(--sp-band); }
</style>
```

- [ ] **Step 8: 实现 src/layouts/PageLayout.astro**

```astro
---
import BaseLayout from './BaseLayout.astro';

const { lang, title, description, page, kicker, lead } = Astro.props;
---

<BaseLayout lang={lang} title={title} description={description} page={page}>
  <header class="page-head">
    {kicker && <div class="kicker" data-reveal>{kicker}</div>}
    <h1 data-reveal>{title}</h1>
    {lead && <p class="lead" data-reveal>{lead}</p>}
  </header>
  <slot />
</BaseLayout>

<style>
  .page-head {
    padding-bottom: clamp(1.2rem, 3vw, 2rem);
    margin-bottom: clamp(1.2rem, 3vw, 2rem);
    border-bottom: 1px solid var(--hairline);
  }
  .page-head .kicker { margin-bottom: 0.7rem; }
  .lead {
    margin: 0.9rem 0 0;
    max-width: 46rem;
    color: var(--muted);
  }
</style>
```

- [ ] **Step 9: 补两条新文案 key**

`BaseLayout` 用到 `home.metaDescription` 与 `common.skipToContent`，两语都要加，否则 `t()` 会抛错导致构建失败。加到 `src/i18n/zh.json` 与 `en.json`：

```json
// zh.json：在 common 对象内追加
"skipToContent": "跳到主要内容"
// zh.json：新增顶层 home 对象
"home": { "metaDescription": "IEEE S&P、USENIX Security、ACM CCS、NDSS 等 10 个顶级会议的论文检索、录用趋势、摘要、获奖与投稿时间线。" }
```

```json
// en.json：在 common 对象内追加
"skipToContent": "Skip to main content"
// en.json：新增顶层 home 对象
"home": { "metaDescription": "Search papers, acceptance trends, abstracts, awards and submission deadlines across 10 top venues including IEEE S&P, USENIX Security, ACM CCS and NDSS." }
```

- [ ] **Step 10: 建两个临时页面用来验证转场**

```astro
---
// src/pages/[lang]/index.astro —— Task 8/9 会替换为真首页
import BaseLayout from '@/layouts/BaseLayout.astro';
import { LOCALES } from '@/i18n/index.js';
import { t } from '@/i18n/index.js';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}
const { lang } = Astro.params;
---
<BaseLayout lang={lang} page="home" title={null}>
  <h1 data-reveal>{t(lang, 'common.title')}</h1>
  <p data-reveal>临时首页，用于验证转场与主题。</p>
  <p><a class="lnk" href={`/${lang}/about/`}>去关于页</a></p>
  <div style="height:120vh"></div>
  <p data-reveal>这段应该在滚动到时淡入。</p>
</BaseLayout>
```

```astro
---
// src/pages/[lang]/about.astro —— Task 18 会替换
import PageLayout from '@/layouts/PageLayout.astro';
import { LOCALES, t } from '@/i18n/index.js';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}
const { lang } = Astro.params;
---
<PageLayout lang={lang} page="about" title={t(lang, 'menu.about')} kicker="临时">
  <p><a class="lnk" href={`/${lang}/`}>回首页</a></p>
</PageLayout>
```

```bash
git rm -f src/pages/index.astro
```

- [ ] **Step 11: 跑测试与构建**

Run: `npx vitest run tests/theme.test.js`
Expected: PASS

Run: `npm run build`
Expected: 成功，产出 `dist/zh/index.html`、`dist/en/index.html`、`dist/zh/about/index.html`、`dist/en/about/index.html`

Run: `grep -q 'astro:before-swap' dist/zh/index.html && echo "✓ 主题保持脚本已内联"`
Expected: 打印 `✓ 主题保持脚本已内联`

- [ ] **Step 12: 人工验收（这一步不能跳）**

Run: `npm run dev`

**本任务自身的检查**：

1. `/zh/` 与 `/zh/about/` 之间点链接来回跳 → 整页淡入淡出，**不是**白屏闪一下。
2. 点主题按钮切到深色 → 再跳到 about 页 → **深色保持住，没有闪回浅色**。（这条专门验 `astro:before-swap`）
3. 点强调色按钮 → 链接下划线颜色跟着变；跳页后保持。
4. 首页向下滚 → 底部那段文字淡入。
5. 系统设置里开「减少动效」后刷新 → 所有内容直接可见，不再有淡入。
6. 浏览器禁用 JS 后刷新 → 文字**全部可见**（验 `reveal-on` 门控写对了方向）。

**顺延自 Task 5 的顶栏检查**（此刻才第一次有页面渲染顶栏）：

7. 顶栏左侧 5 项平铺，右侧依次是 `其他 ▾` `EN` `◈` `◑`，`其他` 左边有一条竖线。
8. 当前页在核心 5 项里高亮（下划线 + 深色）；软导航到别页后高亮**跟着变**（验不用 `transition:persist` 的收益）。注意本任务的两个临时页是 `/zh/`（home）与 `/zh/about/`（about），`about` 属于 `其他 ▾` 组，所以核心 5 项此时都不该点亮 —— 要验证核心项高亮，临时改一下某个链接指向 `/zh/search/` 看 404 页之前的顶栏状态，或等 Task 6 之后回看。
9. 悬停 `其他 ▾` 弹出 3 项；点其中一项跳转后，**鼠标移开菜单会收起**（验 `blurOnMouse`）。
10. 窗口收窄到 860px 以下 → 出现汉堡，点开是竖排菜单，点任一项后自动收起。
11. 点 `EN` 跳到 `/en/` 对应同名路径（在 `/zh/about/` 点应到 `/en/about/`）。
12. **`aria-expanded` 与真实显隐一致**（这条只能在真实浏览器里验，jsdom 无法动态解析 `:hover`，所以 Task 5 当时留下了这个缺口）。打开 DevTools 选中 `.misc-btn`，然后：
    - 鼠标悬停到 `其他 ▾` 上 → `aria-expanded` 变 `true`，菜单可见。
    - **保持鼠标不动，点一下按钮** → `aria-expanded` 必须**仍是 `true`**，因为 `:hover` 还成立、菜单还开着。（这正是 fix round 2 引入又被 round 3 修掉的错位：当时会变成 `false`。）
    - 鼠标移开 → 变 `false`，菜单隐藏。
    - 用 Tab 键走进按钮再走进三个链接 → 全程 `true`；Tab 出最后一个链接 → 变 `false`。
    - 焦点在某个链接上按 Escape → 菜单收起且 `aria-expanded` 变 `false`（若此时鼠标恰好悬停在组上，菜单仍可见、`true` 才是正确答案）。

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(layout): BaseLayout、页面淡入淡出转场、主题与滚动淡入

ClientRouter 做整文档 0.22s 交叉淡入；不用 transition:persist，
让 aria-current 由服务端渲染保证正确。
astro:before-swap 钩子把 data-theme/data-accent/reveal-on 抄到换入的 document，
否则每次软导航主题都会闪回默认值。
主题预绘制脚本用 is:inline + localStorage 同步读取（IndexedDB 是异步的，来不及）；
localStorage 是预绘制缓存，IndexedDB 是持久存储，两处双写。
boot.js 作为唯一启动点，按 <main data-page> 分派并绑在 astro:page-load 上。"
```

---

### Task 5: TopNav、Footer 与语言切换

> **执行顺序：本任务在 Task 4 之前做**（编号不变，只是执行次序调换）。原因见 Task 4
> 开头的说明：Task 4 的 `BaseLayout` 要 import 本任务的 `TopNav`/`Footer`，`boot.js`
> 要 import 本任务的 `nav.js`。
>
> 本任务产出的组件此刻还没有任何页面 import 它们 —— 这是预期的，Astro 不会因为
> 组件未被使用而报错，`npm test` 与 `npm run build` 照样能过。顶栏长什么样的**视觉
> 验收顺延到 Task 4**，那时才有页面把它渲染出来。

**Files:**
- Create: `src/components/TopNav.astro`
- Create: `src/components/Footer.astro`
- Create: `src/components/LangSwitch.astro`
- Create: `src/scripts/nav.js`
- Create: `src/lib/nav-model.js`
- Create: `tests/nav-model.test.js`

**Interfaces:**
- Consumes: `t`（Task 2）、`swapLangInPath` / `localizedHref`（Task 2）
- Produces:
  - `CORE_NAV: Array<{slug: string, key: string}>` —— 顶栏平铺的 5 项
  - `MISC_NAV: Array<{slug: string, key: string}>` —— `其他 ▾` 下拉里的 3 项
  - `isActive(pathname: string, lang: string, slug: string) => boolean`
  - `initNav() => void`（幂等）

- [ ] **Step 1: 写失败的测试**

```js
// tests/nav-model.test.js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/nav-model.test.js`
Expected: FAIL，`Cannot find module '@/lib/nav-model.js'`

- [ ] **Step 3: 实现 src/lib/nav-model.js**

```js
// 核心内容只有 5 项，全部平铺 —— 一次点击直达，不需要下拉。
export const CORE_NAV = [
  { slug: 'search', key: 'menu.search' },
  { slug: 'trends', key: 'menu.trends' },
  { slug: 'abstract', key: 'menu.abstract' },
  { slug: 'timeline', key: 'menu.submissionTimeline' },
  { slug: 'awards', key: 'menu.awards' },
];

// 非核心内容收进右侧「其他 ▾」，与语言、明暗按钮同区。
export const MISC_NAV = [
  { slug: 'sites', key: 'menu.moreSites' },
  { slug: 'about', key: 'menu.about' },
  { slug: 'settings', key: 'menu.settings' },
];

export function isActive(pathname, lang, slug) {
  const norm = String(pathname || '').replace(/\/+$/, '');
  return norm === `/${lang}/${slug}`;
}
```

- [ ] **Step 4: 实现 src/components/LangSwitch.astro**

```astro
---
import { swapLangInPath } from '@/i18n/paths.js';

const { lang } = Astro.props;
const other = lang === 'zh' ? 'en' : 'zh';
const href = swapLangInPath(Astro.url.pathname, other);
const label = other === 'en' ? 'EN' : '中';
---

<a class="lang" href={href} hreflang={other === 'zh' ? 'zh-CN' : 'en'}
   data-lang-target={other} aria-label={other === 'en' ? 'Switch to English' : '切换到中文'}>{label}</a>

<style>
  .lang {
    font-size: var(--fs-kicker);
    letter-spacing: 0.08em;
    color: var(--muted);
    transition: color var(--dur) var(--ease);
  }
  .lang:hover { color: var(--ink); }
</style>
```

- [ ] **Step 5: 实现 src/components/TopNav.astro**

```astro
---
import { t } from '@/i18n/index.js';
import { CORE_NAV, MISC_NAV, isActive } from '@/lib/nav-model.js';
import LangSwitch from './LangSwitch.astro';

const { lang } = Astro.props;
const path = Astro.url.pathname;
const miscActive = MISC_NAV.some((n) => isActive(path, lang, n.slug));

// 「其他 ▾」是一个 disclosure（展开/收起），不是 APG menu —— 它只是三条链接。
// 因此不用 role="menu"/"menuitem"：那会向读屏软件承诺方向键导航，而我们没有实现，
// 反而制造更差的体验。也不用 aria-haspopup：按规范它的 "true" 等同于 "menu"，
// 同样是在声明菜单语义。disclosure 只需要 aria-expanded，由 nav.js 同步。
//
// 说明写在 frontmatter 而非模板里的 HTML 注释：Astro 会把模板注释原样输出到产物。
---

<header class="hdr" id="siteHeader">
  <div class="wrap bar">
    <a class="brand srf" href={`/${lang}/`}>{t(lang, 'common.title')}</a>

    <button class="burger" id="navToggle" aria-label={t(lang, 'common.menu')}
            aria-expanded="false" aria-controls="primaryNav"><span></span></button>

    <nav class="core" id="primaryNav" aria-label={t(lang, 'common.mainNav')}>
      {CORE_NAV.map((n) => (
        <a href={`/${lang}/${n.slug}/`} aria-current={isActive(path, lang, n.slug) ? 'page' : undefined}>
          {t(lang, n.key)}
        </a>
      ))}
    </nav>

    <div class="right">
      <div class="misc" id="miscGroup">
        <button type="button" class="misc-btn" aria-expanded="false"
                data-active={miscActive ? 'true' : undefined}>
          {t(lang, 'menu.misc')}<span class="caret" aria-hidden="true">▾</span>
        </button>
        <div class="misc-menu">
          {MISC_NAV.map((n) => (
            <a href={`/${lang}/${n.slug}/`}
               aria-current={isActive(path, lang, n.slug) ? 'page' : undefined}>{t(lang, n.key)}</a>
          ))}
        </div>
      </div>
      <LangSwitch lang={lang} />
      <button type="button" class="icon" id="accentCycle" aria-label={t(lang, 'common.accentColor')}>◈</button>
      <button type="button" class="icon" id="themeToggle" aria-label={t(lang, 'common.theme')}>◑</button>
    </div>
  </div>
</header>

<style>
  .hdr {
    position: sticky;
    top: 0;
    z-index: 20;
    background: color-mix(in srgb, var(--bg) 93%, transparent);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--hairline);
  }
  .bar { display: flex; align-items: center; gap: 1.5rem; padding-block: 0.85rem; }

  .brand { font-size: 0.95rem; font-weight: 700; letter-spacing: -0.01em; white-space: nowrap; }

  .core { display: flex; gap: 1.15rem; }
  .core a {
    font-size: var(--fs-kicker);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    padding-bottom: 3px;
    border-bottom: 1.5px solid transparent;
    white-space: nowrap;
    transition: color var(--dur) var(--ease), border-color var(--dur) var(--ease);
  }
  .core a:hover { color: var(--ink); }
  .core a[aria-current='page'] { color: var(--ink); border-bottom-color: var(--ink); }

  /* 「其他」与右侧功能区同处一侧，用一条竖线与核心导航隔开 */
  .right { margin-left: auto; display: flex; align-items: center; gap: 0.85rem; }
  .misc { position: relative; padding-left: 0.9rem; border-left: 1px solid var(--hairline); }
  .misc-btn {
    background: none; border: 0; padding: 0; cursor: pointer; font: inherit;
    display: inline-flex; align-items: center; gap: 0.3rem;
    font-size: var(--fs-kicker); letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);
  }
  .misc-btn:hover, .misc-btn[data-active] { color: var(--ink); }
  .caret { font-size: 0.6rem; }

  .misc-menu {
    position: absolute; right: 0; top: calc(100% + 0.7rem); min-width: 9.5rem;
    background: var(--panel); border: 1px solid var(--hairline); border-radius: var(--radius);
    padding: 0.3rem 0; display: none;
  }
  /* 桌面端靠 hover/focus-within 显隐 */
  .misc:hover .misc-menu, .misc:focus-within .misc-menu { display: block; }
  .misc-menu a {
    display: block; padding: 0.45rem 0.9rem; font-size: var(--fs-small); color: var(--muted);
  }
  .misc-menu a:hover { color: var(--ink); background: var(--band); }
  .misc-menu a[aria-current='page'] { color: var(--ink); }

  .icon {
    background: none; border: 0; padding: 0; cursor: pointer;
    font-size: 0.85rem; color: var(--muted); line-height: 1;
  }
  .icon:hover { color: var(--ink); }

  .burger { display: none; background: none; border: 0; cursor: pointer; padding: 0.3rem; }
  .burger span, .burger span::before, .burger span::after {
    display: block; width: 17px; height: 1.5px; background: var(--ink); content: '';
  }
  .burger span::before { transform: translateY(-5px); }
  .burger span::after { transform: translateY(3.5px); }

  @media (max-width: 860px) {
    .bar { gap: 0.9rem; }
    .burger { display: block; order: -1; }
    .core {
      display: none; position: absolute; left: 0; right: 0; top: 100%;
      flex-direction: column; gap: 0;
      background: var(--bg); border-bottom: 1px solid var(--hairline);
      padding: 0.4rem var(--wrap-pad) 0.9rem;
    }
    :global(.hdr.open) .core { display: flex; }
    .core a { padding-block: 0.6rem; border-bottom: 1px solid var(--hairline-soft); }
    .core a[aria-current='page'] { border-bottom-color: var(--ink); }
  }
</style>
```

- [ ] **Step 6: 实现 src/scripts/nav.js**

`blurOnMouse` 那段解决一个真实的坑：鼠标点击下拉项后是软导航，`TopNav` 被重新渲染但焦点可能留在按钮上，`:focus-within` 会让菜单在鼠标移开后仍不消失。键盘激活（`detail === 0`）保留焦点以维持可访问性。

```js
export function initNav() {
  const hdr = document.getElementById('siteHeader');
  const toggle = document.getElementById('navToggle');

  if (hdr && toggle && !toggle.dataset.bound) {
    toggle.dataset.bound = '1';
    toggle.addEventListener('click', () => {
      const open = hdr.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    hdr.querySelectorAll('.core a').forEach((a) =>
      a.addEventListener('click', () => {
        hdr.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      })
    );
  }

  const misc = document.getElementById('miscGroup');
  if (misc && !misc.dataset.bound) {
    misc.dataset.bound = '1';
    const btn = misc.querySelector('.misc-btn');
    const menu = misc.querySelector('.misc-menu');

    // 菜单显隐完全由 CSS 决定（:hover 或 :focus-within 任一成立即展开）。
    // aria-expanded 不去用 JS 复现那套规则，而是**读 CSS 的结论** ——
    // 直接查 computed display。
    //
    // 为什么必须这样：早先的版本用各个事件分别推断状态，结果鼠标悬停时点一下
    // 按钮就错位 —— blurOnMouse 的 blur 触发 focusout，JS 据此判定「已折叠」，
    // 但 :hover 仍然成立、菜单在视觉上还开着，于是读屏播报与实际相反，
    // 而且要等鼠标真正离开才恢复。读结论而不是推规则，这一整类错位都不存在。
    const syncExpanded = () => {
      if (!btn || !menu) return;
      const open = getComputedStyle(menu).display !== 'none';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    // 统一延到下一帧：focus 与 hover 引起的样式变化在本轮事件里可能还没落定
    const scheduleSync = () => requestAnimationFrame(syncExpanded);

    // mouseenter/mouseleave 不冒泡，挂在组上正好只关心组的边界；
    // focusin/focusout 冒泡，因此也能捕获三个链接的进出。
    for (const evt of ['mouseenter', 'mouseleave', 'focusin', 'focusout']) {
      misc.addEventListener(evt, scheduleSync);
    }

    // Escape 收起：把焦点移出组，让 :focus-within 释放。
    // 若此时鼠标仍悬停在组上，菜单依然是开着的 —— syncExpanded 会如实报告 true，
    // 因为那确实是 CSS 的结论。
    misc.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (misc.contains(document.activeElement)) document.activeElement.blur();
      scheduleSync();
    });

    // 鼠标点击后主动 blur，把显隐交还给 hover；键盘激活（detail===0）保留焦点。
    const blurOnMouse = (e) => {
      if (e.detail > 0) e.currentTarget.blur();
    };
    btn?.addEventListener('click', blurOnMouse);
    menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', blurOnMouse));
  }
}
```

- [ ] **Step 7: 实现 src/components/Footer.astro**

```astro
---
import { t } from '@/i18n/index.js';
const { lang } = Astro.props;
---

<footer class="ft">
  <div class="wrap row">
    <span>{t(lang, 'footer.author')}</span>
    <span class="sep" aria-hidden="true">·</span>
    <span>{t(lang, 'footer.updateNote')}</span>
    <a class="lnk src" href="https://github.com/c01dkit/sec-papers-collection" rel="noopener" target="_blank">
      {t(lang, 'common.sourceCode')}
    </a>
  </div>
</footer>

<style>
  .ft { border-top: 1px solid var(--hairline); padding-block: 1.6rem; }
  .row {
    display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;
    font-size: var(--fs-small); color: var(--faint);
  }
  .sep { color: var(--hairline); }
  .src { margin-left: auto; }
</style>
```

- [ ] **Step 8: 补文案 key**

`common.menu`、`common.mainNav`、`common.accentColor`、`footer.author`、`footer.updateNote` 五条两语都要加：

```json
// zh.json common 内：
"menu": "菜单", "mainNav": "主导航", "accentColor": "强调色"
// zh.json 新增顶层：
"footer": { "author": "c01dkit @ ZJU", "updateNote": "每月更新" }
```

```json
// en.json common 内：
"menu": "Menu", "mainNav": "Main navigation", "accentColor": "Accent color"
// en.json 新增顶层：
"footer": { "author": "c01dkit @ ZJU", "updateNote": "Updated monthly" }
```

- [ ] **Step 9: 跑测试与构建**

Run: `npx vitest run tests/nav-model.test.js tests/i18n.test.js`
Expected: PASS（含文案漂移守卫，确认新加的 5 条两语齐全）

Run: `npm run build`
Expected: 成功

- [ ] **Step 10: 构建验证（视觉验收顺延到 Task 4）**

此刻还没有页面 import 这些组件，所以顶栏在浏览器里看不到 —— 那是预期的，别为了「能看见」而去改某个页面把它塞进去，Task 4 的 `BaseLayout` 才是它的落位处。

Run: `npx vitest run tests/nav-model.test.js tests/i18n.test.js`
Expected: PASS。其中文案漂移守卫会确认本步新增的 5 条 key（`common.menu`、`common.mainNav`、`common.accentColor`、`footer.author`、`footer.updateNote`）两语齐全。

Run: `npm run build`
Expected: 成功，零警告。未被引用的组件不会让 Astro 报错。

Run: `npx astro check 2>&1 | tail -5`
Expected: 不出现指向本任务新建的四个文件的错误（旧 `.vue` 文件的既有噪音属正常）。

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(nav): 顶部导航栏取代左侧边栏

核心 5 项（检索/趋势/摘要/时间线/获奖）全部平铺，一次点击直达；
其他 3 项收进右侧「其他 ▾」，与语言、强调色、明暗按钮同区，用竖线隔开。
下拉在鼠标点击后主动 blur，把显隐交还 hover —— 否则软导航后焦点留在按钮上，
:focus-within 会让菜单在鼠标移开后不消失。键盘激活保留焦点以维持可访问性。
移动端 860px 以下折叠为汉堡菜单。"
```

---

### Task 6: 语言分发、404 与旧链接重定向

**Files:**
- Create: `src/components/LangDispatch.astro`
- Create: `src/pages/index.astro`
- Create: `src/pages/404.astro`
- Create: `src/pages/paper/search.astro`
- Create: `src/pages/paper/trends.astro`
- Create: `src/pages/paper/view-abstract.astro`
- Create: `src/pages/paper/submission-timeline.astro`
- Create: `src/pages/reputation/awards.astro`
- Create: `src/pages/misc/about.astro`
- Create: `src/pages/misc/more-sites.astro`
- Create: `src/pages/misc/settings.astro`
- Delete: `public/404.html`

**Interfaces:**
- Consumes: `resolveLang`（Task 2）、`t`（Task 2）
- Produces: `LangDispatch` props `{ target?: string }` —— `target` 是新站 slug（如 `'search'`），省略则跳语言首页

- [ ] **Step 1: 实现 src/components/LangDispatch.astro**

`location.replace` 而非 `href` 是关键 —— 用 `href` 会把分发页留在历史记录里，用户按后退键会被弹回分发页再被弹走，形成死循环。

`<noscript>` 的 meta refresh 兜到 `/en/`：搜索引擎爬虫与禁用 JS 的访客都能落地。

```astro
---
import { t } from '@/i18n/index.js';
const { target = '' } = Astro.props;
const suffix = target ? `${target}/` : '';
---

<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{t('zh', 'common.title')}</title>
    <meta name="robots" content="noindex" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="alternate" hreflang="zh-CN" href={`https://sec.c01dkit.com/zh/${suffix}`} />
    <link rel="alternate" hreflang="en" href={`https://sec.c01dkit.com/en/${suffix}`} />
    <link rel="alternate" hreflang="x-default" href={`https://sec.c01dkit.com/en/${suffix}`} />
    <noscript><meta http-equiv="refresh" content={`0; url=/en/${suffix}`} /></noscript>
    <script is:inline define:vars={{ suffix }}>
      (function () {
        var stored = null;
        try {
          stored = localStorage.getItem('spc-lang');
        } catch (e) {}
        var lang =
          stored === 'zh' || stored === 'en'
            ? stored
            : String(navigator.language || '').toLowerCase().indexOf('zh') === 0
              ? 'zh'
              : 'en';
        // 必须用 replace：用 href 会把本页留在历史里，后退键会在分发页与目标页之间弹跳
        location.replace('/' + lang + '/' + suffix);
      })();
    </script>
    <style>
      body {
        margin: 0; min-height: 100vh;
        display: flex; align-items: center; justify-content: center;
        background: #fbfaf8; color: #8c7f66;
        font-family: Georgia, 'Songti SC', serif; font-size: 15px;
      }
      @media (prefers-color-scheme: dark) { body { background: #14120f; color: #857a69; } }
    </style>
  </head>
  <body>
    <p>安全四大汇总</p>
    <p style="position:absolute;left:-9999px">
      <a href={`/zh/${suffix}`}>中文</a> / <a href={`/en/${suffix}`}>English</a>
    </p>
  </body>
</html>
```

- [ ] **Step 2: 建 / 与 8 个旧路径占位页**

```astro
---
// src/pages/index.astro
import LangDispatch from '@/components/LangDispatch.astro';
---
<LangDispatch />
```

其余 8 个各自只有两行，`target` 换成对应新 slug。**照抄下表，不要凭记忆**（旧新 slug 有 3 处不同名）：

| 文件 | `target` |
|---|---|
| `src/pages/paper/search.astro` | `"search"` |
| `src/pages/paper/trends.astro` | `"trends"` |
| `src/pages/paper/view-abstract.astro` | `"abstract"` |
| `src/pages/paper/submission-timeline.astro` | `"timeline"` |
| `src/pages/reputation/awards.astro` | `"awards"` |
| `src/pages/misc/about.astro` | `"about"` |
| `src/pages/misc/more-sites.astro` | `"sites"` |
| `src/pages/misc/settings.astro` | `"settings"` |

每个文件内容形如：

```astro
---
import LangDispatch from '@/components/LangDispatch.astro';
---
<LangDispatch target="abstract" />
```

- [ ] **Step 3: 实现 404 页**

404 可能在任何路径下被触发，所以它也要判断语言，但**不能重定向**（否则用户看不到 404 就被弹走）。改为：静态渲染中英双份文案，用一小段脚本按语言隐藏其中一份。

```astro
---
import { t } from '@/i18n/index.js';
---

<!doctype html>
<html lang="zh-CN" data-theme="light" data-accent="slate">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>404 · 安全四大汇总</title>
    <meta name="robots" content="noindex" />
    <link rel="icon" href="/favicon.ico" />
    <script is:inline>
      (function () {
        var d = document.documentElement;
        var t;
        try { t = localStorage.getItem('spc-theme'); } catch (e) {}
        d.dataset.theme = t === 'dark' || t === 'light' ? t
          : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      })();
    </script>
  </head>
  <body>
    <main class="wrap box">
      <p class="kicker">404</p>
      <h1 class="srf" data-i18n-zh>{t('zh', 'notFound.title')}</h1>
      <h1 class="srf" data-i18n-en hidden>{t('en', 'notFound.title')}</h1>
      <p data-i18n-zh>{t('zh', 'notFound.desc')}</p>
      <p data-i18n-en hidden>{t('en', 'notFound.desc')}</p>
      <p>
        <a class="lnk" href="/zh/" data-i18n-zh>{t('zh', 'notFound.back')}</a>
        <a class="lnk" href="/en/" data-i18n-en hidden>{t('en', 'notFound.back')}</a>
      </p>
    </main>
    <script is:inline>
      (function () {
        var stored = null;
        try { stored = localStorage.getItem('spc-lang'); } catch (e) {}
        var lang = stored === 'zh' || stored === 'en' ? stored
          : String(navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
        var hide = lang === 'zh' ? 'en' : 'zh';
        document.querySelectorAll('[data-i18n-' + lang + ']').forEach(function (el) { el.hidden = false; });
        document.querySelectorAll('[data-i18n-' + hide + ']').forEach(function (el) { el.hidden = true; });
        document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
      })();
    </script>
  </body>
</html>

<style is:global>
  @import '../styles/tokens.css';
  @import '../styles/global.css';
  .box { padding-block: clamp(5rem, 18vh, 9rem); }
  .box .kicker { margin-bottom: 1rem; }
  .box h1 { margin-bottom: 0.9rem; }
  .box p { color: var(--muted); max-width: 32rem; }
</style>
```

- [ ] **Step 4: 补 404 文案与删掉旧 404**

```json
// zh.json 新增顶层：
"notFound": { "title": "这个页面不在", "desc": "链接可能已经变了。站点在 2026 年做过一次改版，旧地址大多会自动跳转 —— 如果你是从书签进来的，回首页重新找一下。", "back": "回首页" }
```

```json
// en.json 新增顶层：
"notFound": { "title": "This page isn't here", "desc": "The link may have changed. The site was reorganized in 2026 and most old addresses redirect automatically — if you arrived from a bookmark, start again from the home page.", "back": "Back to home" }
```

```bash
git rm -f public/404.html
```

- [ ] **Step 5: 让语言切换把选择写进 localStorage**

`LangDispatch` 读的是 `spc-lang`，但目前没人写它。在 `src/scripts/nav.js` 的 `initNav()` 末尾追加：

```js
  // 语言切换时记住选择，供下次访问 / 时分发
  const langLink = document.querySelector('a[data-lang-target]');
  if (langLink && !langLink.dataset.bound) {
    langLink.dataset.bound = '1';
    langLink.addEventListener('click', () => {
      try {
        localStorage.setItem('spc-lang', langLink.dataset.langTarget);
      } catch {
        /* 隐私模式下忽略 */
      }
    });
  }
```

同时在 `BaseLayout.astro` 的内联脚本里，把当前页的语言写回 `spc-lang`，这样直接访问 `/en/xxx/` 也会被记住。在 `d.classList.add('reveal-on')` 那段之后追加：

```js
        try {
          var cur = location.pathname.match(/^\/(zh|en)\//);
          if (cur) localStorage.setItem('spc-lang', cur[1]);
        } catch (e) {}
```

- [ ] **Step 6: 构建并验证产物**

Run: `npm run build`
Expected: 成功

Run:
```bash
for p in index 404 paper/search paper/trends paper/view-abstract \
         paper/submission-timeline reputation/awards misc/about \
         misc/more-sites misc/settings; do
  f="dist/$p"; [ -d "$f" ] && f="$f/index.html" || f="$f.html"
  [ -f "$f" ] && echo "✓ $p" || echo "✗ $p 缺失"
done
```
Expected: 10 行全部 `✓`

Run: `grep -o "location.replace('/' + lang + '/' + suffix)" dist/paper/search/index.html | head -1`
Expected: 输出该字符串（确认用的是 `replace` 不是 `href`）

Run: `grep -q 'url=/en/search/' dist/paper/search/index.html && echo "✓ noscript 兜底正确"`
Expected: 打印 `✓ noscript 兜底正确`

- [ ] **Step 7: 人工验收**

Run: `npm run build && npm run preview`

1. 访问 `/` → 跳到 `/zh/` 或 `/en/`（取决于浏览器语言）。
2. 在 `/zh/` 点 `EN` 到 `/en/`，然后访问 `/` → 这次应该落在 `/en/`（验 `spc-lang` 写入生效）。
3. 访问旧链接 `/paper/search` → 跳到 `/zh/search/` 或 `/en/search/`。
4. 访问 `/paper/view-abstract` → 跳到 `.../abstract/`（验旧新 slug 改名映射对了）。
5. 在 `/` 跳转完成后按浏览器**后退键** → 应该回到访问 `/` 之前的页面（或空白起点），**不能在分发页与目标页之间弹跳**。
6. 访问 `/nonexistent/` → 看到 404 页，文案是单一语言（不是中英各一份都显示）。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(routing): / 语言分发、404 与 8 个旧路径重定向

LangDispatch 用 location.replace 而非 href —— 用 href 会把分发页留在历史里，
后退键会在分发页与目标页之间弹跳。noscript 用 meta refresh 兜到 /en/。
404 不做重定向（否则用户看不到 404 就被弹走），改为双语静态渲染 + 脚本隐藏一份。
旧路径映射含 3 处改名：view-abstract→abstract、submission-timeline→timeline、
more-sites→sites。
语言选择写入 localStorage spc-lang，供下次访问 / 时分发。"
```

---

### Task 7: 首页数据层（4 组纯函数）

**Files:**
- Create: `src/lib/coverage.js`
- Create: `src/lib/sparkline.js`
- Create: `src/lib/deadlines.js`
- Create: `src/lib/awards-model.js`
- Create: `tests/coverage.test.js`
- Create: `tests/sparkline.test.js`
- Create: `tests/deadlines.test.js`
- Create: `tests/awards-model.test.js`

**Interfaces:**
- Consumes: 无（只吃 JSON 数据对象，不自己读文件）
- Produces:
  - `TOP_TIER: string[]`（4 个）、`SE_SYS: string[]`（6 个）、`MATRIX_YEARS: string[]`（`'2015'`…`'2026'`）
  - `buildCoverageMatrix(stats, years?) => { years, top: Group, se: Group }`，其中 `Group = { rows: Row[], max: number }`，`Row = { publication, cells: (Cell|null)[], preYears: string[], preTotal: number }`，`Cell = { year, count, alpha }`
  - `buildTotalTrend(stats, years) => Array<{year: string, count: number}>`
  - `toSparkline(points, opts?) => { max, coords, line, area }`
  - `parseDeadlineDate(raw) => Date | null`
  - `flattenDeadlines(timeline) => Array<{publication, cycle, stage, dateText, date}>`
  - `pickUpcomingDeadlines(timeline, today, want?) => { items: Item[], placeholder: boolean }`，`Item = { publication, cycle, stage, dateText, daysLeft: number|null, past }`（`daysLeft` 在 `past` 为真时是 `null`）
  - `totalPapers(conf)`、`groupByAward(conf)`、`groupByYear(conf)`、`pickHighlights(awards, n?)`

- [ ] **Step 1: 写 coverage 的失败测试**

用真实数据断言**结构性质**和两个已知峰值，不断言具体论文标题 —— 数据每月重新生成，硬编码标题的测试会天天红。

```js
// tests/coverage.test.js
import { describe, it, expect } from 'vitest';
import { buildCoverageMatrix, TOP_TIER, SE_SYS, MATRIX_YEARS } from '@/lib/coverage.js';
import stats from '@/assets/data/data-statistics.json';

describe('MATRIX_YEARS', () => {
  it('是 2015 到 2026 共 12 列', () => {
    expect(MATRIX_YEARS).toHaveLength(12);
    expect(MATRIX_YEARS[0]).toBe('2015');
    expect(MATRIX_YEARS[11]).toBe('2026');
  });
});

describe('buildCoverageMatrix', () => {
  const m = buildCoverageMatrix(stats);

  it('两组行数与常量一致', () => {
    expect(m.top.rows.map((r) => r.publication)).toEqual(TOP_TIER);
    expect(m.se.rows.map((r) => r.publication)).toEqual(SE_SYS);
  });

  it('两组各自归一 —— 峰值不同，不能共用一个 max', () => {
    expect(m.top.max).toBe(439);   // USENIX Sec 2025
    expect(m.se.max).toBe(389);    // ASE 2025
    expect(m.top.max).not.toBe(m.se.max);
  });

  it('峰值格的 alpha 为 1，其余小于 1', () => {
    const usenix = m.top.rows.find((r) => r.publication === 'USENIX Sec');
    const peak = usenix.cells.find((c) => c && c.year === '2025');
    expect(peak.alpha).toBe(1);
    const y2015 = usenix.cells.find((c) => c && c.year === '2015');
    expect(y2015.alpha).toBeLessThan(1);
    expect(y2015.alpha).toBeGreaterThan(0);
  });

  it('该年没办的会议是 null 格而非 0 格', () => {
    const sosp = m.se.rows.find((r) => r.publication === 'SOSP');
    const i2016 = MATRIX_YEARS.indexOf('2016');
    expect(sosp.cells[i2016]).toBeNull();      // SOSP 双年办，2016 没有
    const i2015 = MATRIX_YEARS.indexOf('2015');
    expect(sosp.cells[i2015]).not.toBeNull();
  });

  it('2015 年之前的数据收进 preYears / preTotal，不占列', () => {
    const sosp = m.se.rows.find((r) => r.publication === 'SOSP');
    expect(sosp.preYears).toContain('2001');
    expect(sosp.preYears).toContain('2013');
    expect(sosp.preYears.every((y) => Number(y) < 2015)).toBe(true);
    expect(sosp.preTotal).toBe(210);           // 17+21+66+25+23+28+30

    const spp = m.top.rows.find((r) => r.publication === 'IEEE S&P');
    expect(spp.preYears).toEqual([]);
    expect(spp.preTotal).toBe(0);
  });

  it('每行的格子数等于列数', () => {
    for (const row of [...m.top.rows, ...m.se.rows]) {
      expect(row.cells).toHaveLength(MATRIX_YEARS.length);
    }
  });

  it('空数据不炸，max 兜底为 1 避免除零', () => {
    const empty = buildCoverageMatrix({ byPublicationAndYear: {} });
    expect(empty.top.rows).toEqual([]);
    expect(empty.top.max).toBe(1);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/coverage.test.js`
Expected: FAIL，`Cannot find module '@/lib/coverage.js'`

- [ ] **Step 3: 实现 src/lib/coverage.js**

```js
export const TOP_TIER = ['IEEE S&P', 'ACM CCS', 'USENIX Sec', 'NDSS'];
export const SE_SYS = ['ICSE', 'ASE', 'FSE', 'ISSTA', 'ASPLOS', 'SOSP'];
export const MATRIX_YEARS = Array.from({ length: 12 }, (_, i) => String(2015 + i));

function buildGroup(byPY, names, years) {
  const firstYear = Number(years[0]);

  const rows = names
    .filter((name) => byPY[name])
    .map((name) => {
      const counts = byPY[name];
      const cells = years.map((y) => (counts[y] ? { year: y, count: counts[y], alpha: 0 } : null));
      const preYears = Object.keys(counts)
        .filter((y) => Number(y) < firstYear)
        .sort((a, b) => Number(a) - Number(b));   // 数值排序：别依赖年份都是四位数
      const preTotal = preYears.reduce((sum, y) => sum + counts[y], 0);
      return { publication: name, cells, preYears, preTotal };
    });

  // 每组各自归一：四大与软工/系统量级差一截，共用一个 max 会让
  // ISSTA（44–170）和 SOSP（17–66）整行淡得看不出变化。
  const values = rows.flatMap((r) => r.cells.filter(Boolean).map((c) => c.count));
  const max = Math.max(1, ...values);   // 兜底 1，避免空数据时除零
  for (const row of rows) {
    for (const cell of row.cells) {
      if (cell) cell.alpha = Math.min(1, cell.count / max);
    }
  }

  return { rows, max };
}

export function buildCoverageMatrix(stats, years = MATRIX_YEARS) {
  const byPY = (stats && stats.byPublicationAndYear) || {};
  return {
    years,
    top: buildGroup(byPY, TOP_TIER, years),
    se: buildGroup(byPY, SE_SYS, years),
  };
}
```

- [ ] **Step 4: 写 sparkline 的失败测试**

用两点的极简输入验算式，再用真实数据验单调性 —— 这样公式改错立刻能看出来。

```js
// tests/sparkline.test.js
import { describe, it, expect } from 'vitest';
import { buildTotalTrend, toSparkline } from '@/lib/sparkline.js';
import stats from '@/assets/data/data-statistics.json';

describe('toSparkline', () => {
  it('两点线性映射：y 轴翻转，峰值贴顶', () => {
    const s = toSparkline([{ count: 1 }, { count: 2 }], { width: 100, height: 40 });
    expect(s.max).toBe(2);
    expect(s.coords).toEqual([[0, 20], [100, 0]]);
    expect(s.line).toBe('0,20 100,0');
  });

  it('area 闭合到底边', () => {
    const s = toSparkline([{ count: 1 }, { count: 2 }], { width: 100, height: 40 });
    expect(s.area).toBe('M0,20 L100,0 L100,40 L0,40 Z');
  });

  it('单点不除零', () => {
    const s = toSparkline([{ count: 5 }], { width: 100, height: 40 });
    expect(s.coords).toEqual([[0, 0]]);
  });

  it('全零数据不产出 NaN', () => {
    const s = toSparkline([{ count: 0 }, { count: 0 }], { width: 100, height: 40 });
    expect(s.line).not.toContain('NaN');
    expect(s.coords).toEqual([[0, 40], [100, 40]]);
  });
});

describe('buildTotalTrend', () => {
  it('按给定年份取 byYear，缺年补 0', () => {
    const pts = buildTotalTrend({ byYear: { 2015: 10, 2017: 30 } }, ['2015', '2016', '2017']);
    expect(pts).toEqual([
      { year: '2015', count: 10 },
      { year: '2016', count: 0 },
      { year: '2017', count: 30 },
    ]);
  });

  it('真实数据 2015→2025 起点 894 终点 2342', () => {
    const years = Array.from({ length: 11 }, (_, i) => String(2015 + i));
    const pts = buildTotalTrend(stats, years);
    expect(pts[0]).toEqual({ year: '2015', count: 894 });
    expect(pts[10]).toEqual({ year: '2025', count: 2342 });
  });
});
```

- [ ] **Step 5: 实现 src/lib/sparkline.js**

```js
export function buildTotalTrend(stats, years) {
  const byYear = (stats && stats.byYear) || {};
  return years.map((y) => ({ year: y, count: byYear[y] ?? 0 }));
}

export function toSparkline(points, { width = 100, height = 40, decimals = 2 } = {}) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const round = (n) => Number(n.toFixed(decimals));

  const coords = points.map((p, i) => [round(i * step), round(height - (p.count / max) * height)]);
  const line = coords.map((c) => c.join(',')).join(' ');
  const area = `M${coords.map((c) => c.join(',')).join(' L')} L${round(width)},${round(height)} L0,${round(height)} Z`;

  return { max, coords, line, area };
}
```

- [ ] **Step 6: 写 deadlines 的失败测试**

这组测试是本任务的重点 —— spec §9.6 那条规则一旦写错，数据断更后首页会显示「还剩 −30 天」。

```js
// tests/deadlines.test.js
import { describe, it, expect } from 'vitest';
import { parseDeadlineDate, flattenDeadlines, pickUpcomingDeadlines } from '@/lib/deadlines.js';

const FIXTURE = [
  {
    publication: 'NDSS 2027',
    cycles: [
      {
        name: 'Cycle 1',
        ddls: [
          { value: '1', stage: 'Abstract registration', date: '2026-07-30' },
          { value: '2', stage: 'Paper submission', date: '2026-08-06' },
          { value: '3', stage: 'Reviews released', date: '2026-09-20' },
        ],
      },
    ],
  },
  {
    publication: 'IEEE S&P 2027',
    cycles: [
      {
        name: 'Cycle 2',
        ddls: [
          { value: '1', stage: 'Abstract registration', date: '2026-11-14' },
          { value: '2', stage: 'Interactive period', date: '2026-05-01 ~ 2026-05-10' },
          { value: '3', stage: 'To be announced', date: 'TBA' },
        ],
      },
    ],
  },
];

describe('parseDeadlineDate', () => {
  it('按本地时区解析，不发生 UTC 偏移', () => {
    // new Date('2026-06-04') 会被当成 UTC 午夜，在负时区会退到 6/3。必须按分量构造。
    expect(parseDeadlineDate('2026-06-04')).toEqual(new Date(2026, 5, 4));
  });

  it('区间取结束日', () => {
    expect(parseDeadlineDate('2026-05-01 ~ 2026-05-10')).toEqual(new Date(2026, 4, 10));
  });

  it('无法解析的返回 null', () => {
    expect(parseDeadlineDate('TBA')).toBeNull();
    expect(parseDeadlineDate('TBA, 2027')).toBeNull();
    expect(parseDeadlineDate('')).toBeNull();
    expect(parseDeadlineDate(undefined)).toBeNull();
  });
});

describe('flattenDeadlines', () => {
  it('展平成扁平列表并带上会议与周期名', () => {
    const flat = flattenDeadlines(FIXTURE);
    expect(flat[0]).toMatchObject({
      publication: 'NDSS 2027',
      cycle: 'Cycle 1',
      stage: 'Abstract registration',
      dateText: '2026-07-30',
    });
  });

  it('跳过无法解析的日期', () => {
    const flat = flattenDeadlines(FIXTURE);
    expect(flat.some((d) => d.stage === 'To be announced')).toBe(false);
  });

  it('总条数 = 可解析的 ddl 数', () => {
    expect(flattenDeadlines(FIXTURE)).toHaveLength(5);   // 3 + 2（TBA 那条被跳过）
  });
});

describe('pickUpcomingDeadlines', () => {
  it('全是未来时按日期升序取前 3，placeholder 为 false', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 6, 25));   // 2026-07-25
    expect(r.placeholder).toBe(false);
    expect(r.items).toHaveLength(3);
    expect(r.items.map((i) => i.dateText)).toEqual(['2026-07-30', '2026-08-06', '2026-09-20']);
    expect(r.items.every((i) => i.past === false)).toBe(true);
  });

  it('天数按本地午夜差计算', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 6, 25));
    expect(r.items[0].daysLeft).toBe(5);    // 07-25 → 07-30
    expect(r.items[1].daysLeft).toBe(12);   // 07-25 → 08-06
  });

  it('当天的截止日算未来，天数为 0', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 6, 30));
    expect(r.items[0].dateText).toBe('2026-07-30');
    expect(r.items[0].daysLeft).toBe(0);
    expect(r.items[0].past).toBe(false);
  });

  it('未来不足 3 条时，用最近的已过期项补齐并标 past', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 10, 1));   // 2026-11-01
    expect(r.placeholder).toBe(false);
    expect(r.items).toHaveLength(3);
    expect(r.items[0]).toMatchObject({ dateText: '2026-11-14', past: false });
    // 补位的按「最近过期的排前面」
    expect(r.items[1]).toMatchObject({ dateText: '2026-09-20', past: true });
    expect(r.items[2]).toMatchObject({ dateText: '2026-08-06', past: true });
  });

  it('补位的已过期项 daysLeft 为 null，不给负数', () => {
    // 这条守的是本模块存在的理由。上一条测试走的正是这段代码，却只用
    // toMatchObject 检了 dateText 与 past，从没碰 daysLeft ——
    // 于是「补位项返回 daysLeft: -42」这个缺陷在 37 个用例下全绿通过。
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 10, 1));
    expect(r.items[1].daysLeft).toBeNull();
    expect(r.items[2].daysLeft).toBeNull();
    // 未来项照旧给数字
    expect(typeof r.items[0].daysLeft).toBe('number');
  });

  it('任何日期下都不会返回负的 daysLeft（扫一遍整条时间线）', () => {
    // 性质测试而非单点测试：拿 FIXTURE 里每一个截止日各自前后一天当「今天」
    // 跑一遍，任何返回项的 daysLeft 要么是非负数，要么是 null。
    const days = flattenDeadlines(FIXTURE).map((d) => d.date);
    const probes = [];
    for (const d of days) {
      for (const delta of [-1, 0, 1]) {
        probes.push(new Date(d.getFullYear(), d.getMonth(), d.getDate() + delta));
      }
    }
    for (const today of probes) {
      for (const item of pickUpcomingDeadlines(FIXTURE, today, 3).items) {
        expect(
          item.daysLeft === null || item.daysLeft >= 0,
          `today=${today.toDateString()} item=${item.dateText} daysLeft=${item.daysLeft}`
        ).toBe(true);
      }
    }
  });

  it('一条未来的都没有时给 placeholder，不返回负天数', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2027, 0, 1));
    expect(r.placeholder).toBe(true);
    expect(r.items).toEqual([]);
  });

  it('空数据给 placeholder', () => {
    expect(pickUpcomingDeadlines([], new Date())).toEqual({ items: [], placeholder: true });
    expect(pickUpcomingDeadlines(undefined, new Date())).toEqual({ items: [], placeholder: true });
  });

  it('want 可调', () => {
    const r = pickUpcomingDeadlines(FIXTURE, new Date(2026, 6, 25), 2);
    expect(r.items).toHaveLength(2);
  });
});
```

- [ ] **Step 7: 实现 src/lib/deadlines.js**

```js
const ISO_DATE = /(\d{4})-(\d{2})-(\d{2})/;

/**
 * 把截止日字符串解析成本地午夜的 Date。
 * 不能用 new Date('2026-06-04')：那会被当成 UTC 午夜，在 UTC-x 时区会退到前一天。
 * 区间（含 ~）取结束日；'TBA' 之类返回 null 由调用方跳过。
 */
export function parseDeadlineDate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const part = raw.includes('~') ? raw.split('~').pop() : raw;
  const m = String(part).trim().match(ISO_DATE);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

function localMidnight(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function flattenDeadlines(timeline) {
  const out = [];
  for (const pub of timeline || []) {
    for (const cycle of pub.cycles || []) {
      for (const ddl of cycle.ddls || []) {
        const date = parseDeadlineDate(ddl.date);
        if (!date) continue;
        out.push({
          publication: pub.publication,
          cycle: cycle.name,
          stage: ddl.stage,
          dateText: ddl.date,   // 原始字符串，可能是区间；可计算的日期在 date 里
          date,
        });
      }
    }
  }
  return out;
}

/**
 * 首页倒计时用。规则（spec §9.6）：
 *   - 只显示未来的截止日，按日期升序；
 *   - 未来不足 want 条时，用最近的已过期项补齐并标 past；
 *   - 一条未来的都没有 → placeholder=true，绝不显示负天数。
 */
export function pickUpcomingDeadlines(timeline, today, want = 3) {
  const flat = flattenDeadlines(timeline);
  if (!flat.length) return { items: [], placeholder: true };

  const base = localMidnight(today);
  const dayMs = 86400000;

  const future = flat.filter((d) => d.date >= base).sort((a, b) => a.date - b.date);
  if (!future.length) return { items: [], placeholder: true };

  const past = flat.filter((d) => d.date < base).sort((a, b) => b.date - a.date);

  const toItem = (d, isPast) => ({
    publication: d.publication,
    cycle: d.cycle,
    stage: d.stage,
    // dateText 是给人看的原始字符串，区间日期会保留成 '2026-05-01 ~ 2026-05-10'。
    // 刻意不叫 iso：它并不总是可被 new Date() 解析的 ISO 串，叫 iso 会诱使
    // 消费方直接 new Date(it.iso)。要拿可计算的日期请用 parseDeadlineDate()。
    dateText: d.dateText,
    // 已过期的项不给天数。曾经这里对过期项也算差值，于是会返回 daysLeft: -13
    // 这样的值 —— 字段名叫 daysLeft，消费方极容易直接渲染成「还剩 -13 天」，
    // 而那正是这个模块存在的理由。给 null 能让误用当场显形，
    // 而不是安静地把一个负数印到首页上。
    daysLeft: isPast ? null : Math.round((d.date - base) / dayMs),
    past: isPast,
  });

  const items = future.slice(0, want).map((d) => toItem(d, false));
  for (const d of past) {
    if (items.length >= want) break;
    items.push(toItem(d, true));
  }

  return { items, placeholder: false };
}
```

- [ ] **Step 8: 写 awards-model 的失败测试**

```js
// tests/awards-model.test.js
import { describe, it, expect } from 'vitest';
import { totalPapers, groupByAward, groupByYear, pickHighlights } from '@/lib/awards-model.js';
import awards from '@/assets/data/awards.json';

const CONF = {
  publication: 'TEST',
  awards: [
    { name: 'Best Paper', papers: [{ year: 2025, title: 'B1' }, { year: 2024, title: 'B2' }] },
    { name: 'Distinguished', papers: [{ year: 2025, title: 'D1' }] },
  ],
};

describe('totalPapers', () => {
  it('累加所有奖项下的论文数', () => {
    expect(totalPapers(CONF)).toBe(3);
  });

  it('没有奖项时为 0', () => {
    expect(totalPapers({ awards: [] })).toBe(0);
  });
});

describe('groupByAward', () => {
  it('每个奖项一组，保留原顺序，并给每篇挂上 awardName', () => {
    const g = groupByAward(CONF);
    expect(g.map((x) => x.label)).toEqual(['Best Paper', 'Distinguished']);
    expect(g[0].count).toBe(2);
    expect(g[0].papers[0].awardName).toBe('Best Paper');
  });

  it('key 唯一且带前缀', () => {
    const g = groupByAward(CONF);
    expect(new Set(g.map((x) => x.key)).size).toBe(g.length);
    expect(g[0].key).toBe('award-Best Paper');
  });
});

describe('groupByYear', () => {
  it('按年份降序分组', () => {
    const g = groupByYear(CONF);
    expect(g.map((x) => x.label)).toEqual(['2025', '2024']);
    expect(g[0].count).toBe(2);      // B1 + D1
    expect(g[1].count).toBe(1);      // B2
  });

  it('同年内不同奖项都带上 awardName', () => {
    const g = groupByYear(CONF);
    expect(g[0].papers.map((p) => p.awardName).sort()).toEqual(['Best Paper', 'Distinguished']);
  });
});

describe('pickHighlights', () => {
  it('取最新年份，且优先来自不同会议', () => {
    const picks = pickHighlights(awards, 2);
    expect(picks).toHaveLength(2);
    expect(new Set(picks.map((p) => p.publication)).size).toBe(2);
    const maxYear = Math.max(
      ...awards.flatMap((c) => c.awards.flatMap((a) => a.papers.map((p) => p.year)))
    );
    expect(picks[0].year).toBe(maxYear);
  });

  it('每条都带齐渲染所需字段', () => {
    for (const p of pickHighlights(awards, 2)) {
      expect(p).toHaveProperty('publication');
      expect(p).toHaveProperty('awardName');
      expect(p).toHaveProperty('year');
      expect(typeof p.title).toBe('string');
      expect(p.title.length).toBeGreaterThan(0);
    }
  });

  it('结果稳定：同一输入两次调用完全一致', () => {
    expect(pickHighlights(awards, 2)).toEqual(pickHighlights(awards, 2));
  });

  it('空输入返回空数组', () => {
    expect(pickHighlights([], 2)).toEqual([]);
    expect(pickHighlights(undefined, 2)).toEqual([]);
  });
});
```

- [ ] **Step 9: 实现 src/lib/awards-model.js**

`pickHighlights` 必须是确定性的 —— 它在构建时渲染进首页 HTML，如果结果随调用顺序变化，每次构建的产物都会不同。

```js
export function totalPapers(conf) {
  return (conf.awards || []).reduce((sum, a) => sum + (a.papers || []).length, 0);
}

export function groupByAward(conf) {
  return (conf.awards || []).map((award) => ({
    key: `award-${award.name}`,
    label: award.name,
    count: (award.papers || []).length,
    papers: (award.papers || []).map((p) => ({ ...p, awardName: award.name })),
  }));
}

export function groupByYear(conf) {
  const buckets = new Map();
  for (const award of conf.awards || []) {
    for (const paper of award.papers || []) {
      const year = String(paper.year);
      if (!buckets.has(year)) buckets.set(year, []);
      buckets.get(year).push({ ...paper, awardName: award.name });
    }
  }
  return [...buckets.keys()]
    .sort((a, b) => Number(b) - Number(a))
    .map((year) => ({
      key: `year-${year}`,
      label: year,
      count: buckets.get(year).length,
      papers: buckets.get(year),
    }));
}

/**
 * 首页获奖精选。确定性排序（年份降序 → 会议名 → 标题），
 * 再贪心地优先凑不同会议 —— 结果进构建产物，不能随调用变化。
 */
export function pickHighlights(awards, n = 2) {
  const flat = [];
  for (const conf of awards || []) {
    for (const award of conf.awards || []) {
      for (const paper of award.papers || []) {
        flat.push({
          publication: conf.publication,
          awardName: award.name,
          year: paper.year,
          title: paper.title,
        });
      }
    }
  }

  flat.sort(
    (a, b) =>
      b.year - a.year ||
      a.publication.localeCompare(b.publication) ||
      a.title.localeCompare(b.title)
  );

  const picked = [];
  const seenPubs = new Set();
  for (const item of flat) {
    if (picked.length >= n) break;
    if (seenPubs.has(item.publication)) continue;
    picked.push(item);
    seenPubs.add(item.publication);
  }
  // 会议数不够 n 时放宽「不同会议」的要求补齐
  for (const item of flat) {
    if (picked.length >= n) break;
    if (!picked.includes(item)) picked.push(item);
  }

  return picked;
}
```

- [ ] **Step 10: 跑全部 4 组测试确认通过**

Run: `npx vitest run tests/coverage.test.js tests/sparkline.test.js tests/deadlines.test.js tests/awards-model.test.js`
Expected: PASS，全部通过

若 `top.max` 不是 439 或 `se.max` 不是 389，说明 `src/assets/data/data-statistics.json` 已被重新生成过。此时**改测试里的期望值**为当前真实峰值，并保留「两组 max 不相等」那条断言 —— 那条才是真正要守住的性质。

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(home): 首页数据层四组纯函数

coverage: 覆盖矩阵两组各自归一（四大峰值 439 / 软工系统峰值 389），
  共用一个 max 会让 ISSTA 与 SOSP 整行淡得看不出变化；
  2015 年前的数据收进 preTotal 不占列。
sparkline: 手写 SVG 折线坐标，单点与全零输入都不产出 NaN。
deadlines: 日期按分量构造避免 UTC 偏移（new Date('2026-06-04') 在负时区会退一天）；
  实现「未来优先、不足则补灰、全过期给占位」规则，绝不显示负天数。
awards-model: pickHighlights 确定性排序 + 贪心凑不同会议，
  结果进构建产物不能随调用变化。"
```

---

### Task 8: 首页首屏与覆盖矩阵

**Files:**
- Create: `src/components/home/Hero.astro`
- Create: `src/components/home/CoverageMatrix.astro`
- Modify: `src/pages/[lang]/index.astro`（替换 Task 4 的临时页）
- Modify: `src/i18n/zh.json`、`src/i18n/en.json`（追加 `home` 全套文案）
- Modify: `src/styles/tokens.css`（追加矩阵用的 RGB 三元组）

**Interfaces:**
- Consumes: `buildCoverageMatrix` / `MATRIX_YEARS`（Task 7）、`t`（Task 2）、`BaseLayout`（Task 4）
- Produces: `Hero` props `{ lang, total: number, venues: number, yearSpan: string, syncDate: string }`；`CoverageMatrix` props `{ lang, matrix, total }`

- [ ] **Step 1: 追加首页文案（zh）**

把这个对象**合并进** `src/i18n/zh.json` 已有的 `home` 键（Task 4 只加了 `metaDescription`，保留它）。标题里的 `\n` 靠 CSS `white-space: pre-line` 换行，各语言可以自己决定断句位置。

```json
"home": {
  "metaDescription": "IEEE S&P、USENIX Security、ACM CCS、NDSS 等 10 个顶级会议的论文检索、录用趋势、摘要、获奖与投稿时间线。",
  "kicker": "自 2023 · 数据同步于 {date}",
  "headline": "十个顶级会议的论文，\n一处读完",
  "headlineAccent": "一处读完",
  "lead": "IEEE S&P、USENIX Security、ACM CCS、NDSS，加上 ICSE / ISSTA / FSE / ASE / ASPLOS / SOSP。录用列表、摘要、获奖与投稿时间线，全在一个站里。",
  "ctaSearch": "开始检索",
  "ctaTrends": "看录用趋势",
  "statPapers": "篇论文",
  "statVenues": "会议",
  "statYears": "覆盖年份",
  "statCadence": "更新频率",
  "statCadenceValue": "月度",
  "matrixKicker": "收录范围",
  "matrixTitle": "每一格都是真的数过的",
  "matrixLead": "格子越深，那年录用越多。空格表示该会议当年不办或尚未收录。",
  "matrixLegendTop": "安全四大",
  "matrixLegendSe": "软工 / 系统",
  "matrixLegendEmpty": "未办 / 未收录",
  "matrixNote": "合计 {total} 篇 · 两组各自归一（四大峰值 {topMax}，软工 / 系统峰值 {seMax}）",
  "f1Kicker": "01 — 检索",
  "f1Title": "一次输入，\n一万五千篇里定位",
  "f1Body": "标题全文匹配，会议与年份可叠加筛选，命中处高亮。星标收藏留在你自己的浏览器里，不上传。",
  "f1Link": "去检索",
  "f2Kicker": "02 — 趋势",
  "f2Title": "十年扩张，\n一条线看完",
  "f2Body": "按会议、按年份、按分组看录用量变化。2015 年全部会议合计 {from} 篇，2025 年 {to} 篇 —— 中稿变难了还是变容易了，图上自己看。",
  "f2Link": "看趋势",
  "f2Caption": "全部会议合计 · {from} → {to} 篇/年",
  "f3Kicker": "03 — 摘要",
  "f3Title": "不点进 IEEE，\n先把摘要读完",
  "f3Body": "按会议和年份翻，摘要直接展开。设好的关注关键词会在正文里自动标出来，扫一眼就知道值不值得读。",
  "f3Link": "读摘要",
  "f4Kicker": "04 — 投稿时间线",
  "f4Title": "下一个截止日，\n还剩几天",
  "f4Body": "四大会议的完整周期：摘要注册、正文截止、rebuttal、通知、camera-ready。倒计时按你本地时区算。",
  "f4Link": "看时间线",
  "f4Days": "天",
  "f4Passed": "已截止",
  "f4Placeholder": "下一轮日期待公布",
  "f5Kicker": "05 — 名望",
  "f5Title": "今年谁拿了\nBest Paper",
  "f5Body": "四大会议历年最佳论文、杰出论文、Distinguished Paper 汇总，按年份和奖项分类。想知道领域风向，先看这里。",
  "f5Link": "看获奖论文",
  "f5More": "还有更多",
  "f5MoreDetail": "四大历年全部奖项",
  "closingKicker": "还有这些",
  "closingTitle": "顺手做的一些东西",
  "closingSitesTitle": "更多网站",
  "closingSitesBody": "同行整理的会议榜单、CCF 分级、评审信息等外部资源。",
  "closingPrefsTitle": "个人偏好",
  "closingPrefsBody": "明暗、强调色、关注关键词、收藏，全部存在浏览器本地。",
  "closingOpenTitle": "数据管道开源",
  "closingOpenBody": "爬取、解析、LLM 主题分类的 Python 代码都在 GitHub 上。",
  "closingCta": "开始检索 {total} 篇论文"
}
```

- [ ] **Step 2: 追加首页文案（en）**

```json
"home": {
  "metaDescription": "Search papers, acceptance trends, abstracts, awards and submission deadlines across 10 top venues including IEEE S&P, USENIX Security, ACM CCS and NDSS.",
  "kicker": "Since 2023 · data synced {date}",
  "headline": "Ten top venues,\none place to read them",
  "headlineAccent": "one place to read them",
  "lead": "IEEE S&P, USENIX Security, ACM CCS and NDSS, plus ICSE / ISSTA / FSE / ASE / ASPLOS / SOSP. Accepted lists, abstracts, awards and submission deadlines — all in one site.",
  "ctaSearch": "Start searching",
  "ctaTrends": "See acceptance trends",
  "statPapers": "papers",
  "statVenues": "venues",
  "statYears": "years covered",
  "statCadence": "update cadence",
  "statCadenceValue": "monthly",
  "matrixKicker": "Coverage",
  "matrixTitle": "Every cell was actually counted",
  "matrixLead": "Darker means more papers accepted that year. Blank means the venue did not run, or is not yet indexed.",
  "matrixLegendTop": "Big Four security",
  "matrixLegendSe": "SE / Systems",
  "matrixLegendEmpty": "Not held / not indexed",
  "matrixNote": "{total} papers total · each group normalized separately (Big Four peak {topMax}, SE / Systems peak {seMax})",
  "f1Kicker": "01 — Search",
  "f1Title": "One query,\nfifteen thousand papers deep",
  "f1Body": "Full title matching, stackable venue and year filters, matches highlighted in place. Starred favorites stay in your own browser — nothing is uploaded.",
  "f1Link": "Go to search",
  "f2Kicker": "02 — Trends",
  "f2Title": "A decade of growth,\nin one line",
  "f2Body": "Acceptance counts by venue, by year, by group. All venues together went from {from} papers in 2015 to {to} in 2025 — whether that means easier or harder is for you to read off the chart.",
  "f2Link": "See trends",
  "f2Caption": "All venues · {from} → {to} papers/year",
  "f3Kicker": "03 — Abstracts",
  "f3Title": "Read the abstract\nbefore opening IEEE",
  "f3Body": "Browse by venue and year with abstracts expanded inline. Your saved keywords get marked up automatically, so one glance tells you whether it is worth the click.",
  "f3Link": "Read abstracts",
  "f4Kicker": "04 — Deadlines",
  "f4Title": "The next deadline,\nand days remaining",
  "f4Body": "Full cycles for the Big Four: abstract registration, paper submission, rebuttal, notification, camera-ready. Countdowns computed in your local timezone.",
  "f4Link": "See the timeline",
  "f4Days": "days",
  "f4Passed": "passed",
  "f4Placeholder": "Next round not yet announced",
  "f5Kicker": "05 — Recognition",
  "f5Title": "Who took\nBest Paper this year",
  "f5Body": "Best paper, outstanding paper and distinguished paper awards across the Big Four, grouped by year and by award. A quick read on where the field is heading.",
  "f5Link": "See award winners",
  "f5More": "And more",
  "f5MoreDetail": "Every award, every year, Big Four",
  "closingKicker": "Also here",
  "closingTitle": "A few things built along the way",
  "closingSitesTitle": "More sites",
  "closingSitesBody": "Curated external resources: venue rankings, CCF tiers, review process notes.",
  "closingPrefsTitle": "Your preferences",
  "closingPrefsBody": "Theme, accent color, watched keywords and favorites — all stored locally in your browser.",
  "closingOpenTitle": "Open pipeline",
  "closingOpenBody": "The Python code that crawls, parses and LLM-classifies the data is on GitHub.",
  "closingCta": "Search {total} papers"
}
```

- [ ] **Step 3: 追加矩阵用的 RGB 三元组**

矩阵格子的深浅要按 `alpha` 连续变化，用 `rgb(var(--x) / alpha)` 语法最省事。在 `src/styles/tokens.css` 的两个 `data-theme` 区块内各追加两行：

```css
/* light 区块内 */
  --mx-top-rgb: 47 72 88;
  --mx-se-rgb: 140 127 102;
  --mx-empty: #f2eee6;

/* dark 区块内 */
  --mx-top-rgb: 127 168 189;
  --mx-se-rgb: 176 163 138;
  --mx-empty: #201c18;
```

同步更新 `tests/tokens.test.js` 里 `vars` 数组，把 `--mx-top-rgb`、`--mx-se-rgb`、`--mx-empty` 加进去，保证两套都定义了。

- [ ] **Step 4: 实现 src/components/home/Hero.astro**

```astro
---
import { t } from '@/i18n/index.js';

const { lang, total, venues, yearSpan, syncDate } = Astro.props;
const nf = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US');

const headline = t(lang, 'home.headline');
const accent = t(lang, 'home.headlineAccent');
// 把强调短语从标题里切出来单独上色，避免在 JSON 里塞 HTML
// accent 是 headline 的一个子串，切出来单独上斜体与强调色。
// found 必须参与渲染判断：若某个语言的 headline 被改写而 headlineAccent 没跟着改，
// idx 会是 -1，此时 head 是整条标题 —— 要是仍然无条件渲染 <em>{accent}</em>，
// 页面最大的标题下面就会多出一份孤立的斜体旧短语。降级要降成「纯标题」。
// tests/i18n.test.js 里有一条守卫断言两语的 accent 都确实是 headline 的子串。
const idx = headline.indexOf(accent);
const found = idx >= 0;
const head = found ? headline.slice(0, idx) : headline;
const tail = found ? headline.slice(idx + accent.length) : '';

const stats = [
  { value: nf.format(total), label: t(lang, 'home.statPapers') },
  { value: String(venues), label: t(lang, 'home.statVenues') },
  { value: yearSpan, label: t(lang, 'home.statYears') },
  { value: t(lang, 'home.statCadenceValue'), label: t(lang, 'home.statCadence') },
];
---

<section class="hero wrap">
  <div class="kicker" data-reveal>{t(lang, 'home.kicker', { date: syncDate })}</div>

  <h1 class="srf head" data-reveal>{head}{found && <em>{accent}</em>}{tail}</h1>

  <p class="lead" data-reveal>{t(lang, 'home.lead')}</p>

  <div class="cta" data-reveal>
    <a class="btn btn--solid" href={`/${lang}/search/`}>{t(lang, 'home.ctaSearch')}</a>
    <a class="btn btn--ghost" href={`/${lang}/trends/`}>{t(lang, 'home.ctaTrends')}</a>
  </div>

  <dl class="stats" data-reveal>
    {stats.map((s) => (
      <div class="stat">
        <dt class="srf">{s.value}</dt>
        <dd class="kicker">{s.label}</dd>
      </div>
    ))}
  </dl>
</section>

<style>
  .hero { padding-block: clamp(3rem, 8vw, 4.6rem) clamp(2.4rem, 6vw, 3.4rem); }
  .hero .kicker { margin-bottom: 1.15rem; }

  .head {
    font-size: var(--fs-display);
    line-height: 1.1;
    letter-spacing: -0.022em;
    margin-bottom: 1.05rem;
    max-width: 40ch;
    white-space: pre-line;   /* 让文案里的 \n 生效，各语言自己决定断句 */
  }
  .head em { font-style: italic; color: var(--accent); }

  .lead { max-width: 30rem; color: var(--muted); }

  .cta { display: flex; flex-wrap: wrap; gap: 0.65rem; margin-top: 1.7rem; }
  .btn {
    font-size: var(--fs-small);
    padding: 0.65rem 1.2rem;
    border-radius: var(--radius);
    transition: background-color var(--dur) var(--ease), border-color var(--dur) var(--ease);
  }
  .btn--solid { background: var(--ink); color: var(--bg); border: 1px solid var(--ink); }
  .btn--solid:hover { background: var(--accent); border-color: var(--accent); }
  .btn--ghost { border: 1px solid var(--hairline); color: var(--ink); }
  .btn--ghost:hover { border-color: var(--ink); }

  .stats {
    display: flex;
    flex-wrap: wrap;
    margin: 2.7rem 0 0;
    border-top: 1px solid var(--hairline);
    padding-top: 1.2rem;
  }
  .stat { padding-inline: 2.2rem; border-right: 1px solid var(--hairline); }
  .stat:first-child { padding-left: 0; }
  .stat:last-child { border-right: 0; }
  .stat dt { font-size: 1.55rem; line-height: 1.1; }
  .stat dd { margin: 0.35rem 0 0; }

  @media (max-width: 640px) {
    .stats { gap: 1.2rem 0; }
    .stat { flex: 1 1 44%; padding-inline: 0 1rem; border-right: 0; }
  }
</style>
```

- [ ] **Step 5: 实现 src/components/home/CoverageMatrix.astro**

行标里 SOSP 那个 `◂01–13` 是从 `preYears` 算出来的，不写死 —— 以后补了更早年份也会自动跟上。

```astro
---
import { t } from '@/i18n/index.js';

const { lang, matrix, total } = Astro.props;
const nf = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US');

const groups = [
  { rows: matrix.top.rows, rgb: 'var(--mx-top-rgb)', strong: true },
  { rows: matrix.se.rows, rgb: 'var(--mx-se-rgb)', strong: false },
];

// '2001'…'2013' → '◂01–13'；没有更早数据时返回空
const preLabel = (preYears) =>
  preYears.length ? `◂${preYears[0].slice(2)}–${preYears[preYears.length - 1].slice(2)}` : '';

// 把 coverage.js 给的 0..1 相对强度压到 0.06..0.50 再上色。
//
// 上限刻意停在 0.50：这样格子背景永远不会深到需要把数字反白，四种
// 「明暗 × 分组」组合下一律用 --ink，最差对比度 5.4:1，全部过 WCAG AA。
// 早先的做法是让 alpha 跑满 0..1、再在 alpha > 0.55 时把文字换成 --bg，
// 那样有两个问题：软工/系统组在浅色主题下无论 alpha 取多少都过不了 4.5:1
// （峰值格只有 3.77:1），而 0.55 这个阈值本身也偏早，alpha 0.7 时四种组合
// 全部不合规。错就错在用一个固定阈值去伺候两组独立归一、色调不同的调色板。
// 下限 0.06 是为了让最小的非空格子仍然看得见，不至于和空格混掉。
//
// 压缩动态范围的代价很小：每个格子里都印着确切数字，深浅只是冗余编码。
const displayAlpha = (a) => (0.06 + a * 0.44).toFixed(2);
---

<section class="band band--tint">
  <div class="wrap">
    <div class="head" data-reveal>
      <div class="head-text">
        <div class="kicker">{t(lang, 'home.matrixKicker')}</div>
        <h2 class="srf">{t(lang, 'home.matrixTitle')}</h2>
      </div>
      <ul class="legend">
        <li><i style="background: rgb(var(--mx-top-rgb) / 0.85)"></i>{t(lang, 'home.matrixLegendTop')}</li>
        <li><i style="background: rgb(var(--mx-se-rgb) / 0.85)"></i>{t(lang, 'home.matrixLegendSe')}</li>
        <li><i style="background: var(--mx-empty)"></i>{t(lang, 'home.matrixLegendEmpty')}</li>
      </ul>
    </div>

    <p class="lead" data-reveal>{t(lang, 'home.matrixLead')}</p>

    <div class="scroll" data-reveal>
      <table class="mx">
        <caption class="sr">{t(lang, 'home.matrixTitle')}</caption>
        <thead>
          <tr>
            <th class="corner"><span class="sr">{t(lang, 'search.publication')}</span></th>
            {matrix.years.map((y) => <th scope="col">{y}</th>)}
          </tr>
        </thead>
        {groups.map((g) => (
          <tbody class={g.strong ? 'g g--strong' : 'g'}>
            {g.rows.map((row) => (
              <tr>
                <th scope="row">
                  {row.publication}
                  {row.preYears.length > 0 && <span class="pre">{preLabel(row.preYears)}</span>}
                </th>
                {row.cells.map((cell) =>
                  cell ? (
                    <td
                      style={`background: rgb(${g.rgb} / ${displayAlpha(cell.alpha)})`}
                      title={`${row.publication} ${cell.year}: ${cell.count}`}
                    >{cell.count}</td>
                  ) : (
                    <td class="empty"></td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>

    <p class="note" data-reveal>
      {t(lang, 'home.matrixNote', {
        total: nf.format(total),
        topMax: matrix.top.max,
        seMax: matrix.se.max,
      })}
    </p>
  </div>
</section>

<style>
  .head {
    display: flex;
    align-items: flex-end;
    gap: 1.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.6rem;
  }
  .head-text { flex: 1 1 16rem; }
  .head .kicker { margin-bottom: 0.55rem; }

  .legend {
    display: flex;
    gap: 1.15rem;
    flex-wrap: wrap;
    list-style: none;
    margin: 0 0 0.25rem;
    padding: 0;
    font-size: var(--fs-kicker);
    color: var(--faint);
  }
  .legend li { display: flex; align-items: center; gap: 0.4rem; }
  .legend i { width: 10px; height: 10px; display: block; }

  .lead { color: var(--muted); font-size: var(--fs-small); margin-bottom: 1.35rem; max-width: 42rem; }

  /* 宽表在自己的容器里横向滚动，页面 body 绝不横向滚 */
  .scroll { overflow-x: auto; }

  .mx { width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 42rem; }
  .mx th, .mx td { font-weight: 400; }
  .mx thead th {
    padding: 0 1px 7px;
    text-align: center;
    font-size: var(--fs-kicker);
    color: var(--faint);
  }
  .mx .corner { width: 6.2rem; }
  .mx tbody th {
    text-align: right;
    padding-right: 0.75rem;
    white-space: nowrap;
    font-size: var(--fs-kicker);
    color: var(--muted);
  }
  .g--strong tbody th, .mx .g--strong th { color: var(--ink); font-weight: 600; }
  .mx tbody td {
    padding: 0;
    height: 26px;
    text-align: center;
    font-size: var(--fs-kicker);
    font-variant-numeric: tabular-nums;
    border: 1px solid var(--band);
    color: var(--ink);   /* 一律 --ink：alpha 上限 0.50 保证任何格子上都够对比度 */
  }
  .mx td.empty { background: var(--mx-empty); }
  .pre { color: var(--faint); font-size: 0.62rem; margin-left: 0.3rem; }

  /* 两组之间留一条空隙 */
  .g + .g tr:first-child th, .g + .g tr:first-child td { padding-top: 9px; }

  .note {
    margin: 0.9rem 0 0;
    padding-top: 0.7rem;
    border-top: 1px solid var(--hairline);
    font-size: var(--fs-kicker);
    color: var(--faint);
  }

  .sr {
    position: absolute; width: 1px; height: 1px; overflow: hidden;
    clip: rect(0 0 0 0); white-space: nowrap;
  }
</style>
```

- [ ] **Step 6: 装配首页（先只放这两块）**

`syncDate` 从 `submission-timeline.json` 里最新的 `update` 字段取 —— 那是人工同步时间，比构建时间更能说明数据新旧。构建时间会让「同步于」每次部署都变，误导性更强。

```astro
---
// src/pages/[lang]/index.astro
import BaseLayout from '@/layouts/BaseLayout.astro';
import Hero from '@/components/home/Hero.astro';
import CoverageMatrix from '@/components/home/CoverageMatrix.astro';
import { LOCALES } from '@/i18n/index.js';
import { buildCoverageMatrix, TOP_TIER, SE_SYS } from '@/lib/coverage.js';
import stats from '@/assets/data/data-statistics.json';
import timeline from '@/assets/data/submission-timeline.json';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

const { lang } = Astro.params;

const matrix = buildCoverageMatrix(stats);
const venues = TOP_TIER.concat(SE_SYS).filter((n) => stats.byPublicationAndYear[n]).length;
const years = stats.years.map(Number);
const yearSpan = `${Math.min(...years)}–${String(Math.max(...years)).slice(2)}`;
// 用人工同步时间而非构建时间：后者每次部署都变，反而误导
const syncDate = timeline.map((p) => p.update).filter(Boolean).sort().pop() ?? '';
---

<BaseLayout lang={lang} page="home" title={null} wide={true}>
  <Hero lang={lang} total={stats.total} venues={venues} yearSpan={yearSpan} syncDate={syncDate} />
  <CoverageMatrix lang={lang} matrix={matrix} total={stats.total} />
</BaseLayout>
```

- [ ] **Step 7: 跑测试与构建**

Run: `npx vitest run`
Expected: PASS（含更新后的 tokens 测试与文案漂移守卫，确认新增的 `home.*` 两语齐全）

Run: `npm run build`
Expected: 成功

Run: `grep -o 'rgb(var(--mx-top-rgb)' dist/zh/index.html | wc -l`
Expected: 输出 40 以上（四大 4 行 × 最多 12 列的非空格子数）

- [ ] **Step 8: 人工验收**

Run: `npm run dev`，访问 `/zh/`

1. 首屏：kicker、衬线大标题（强调短语是斜体 + 强调色）、导语、两个按钮、4 个数字用发丝竖线隔开。
2. 矩阵：**整幅铺满，右侧没有留白**；年份是四位；格子里有真实数字；深色格子里的数字自动转成浅色可读。
3. 矩阵标题在左、图例在右，同一行 —— 不是上下堆叠。
4. SOSP 行标后面跟着 `◂01–13`；SOSP 的双数年是空格底色。
5. 窗口收窄到 500px → 矩阵**在自己的容器内横向滚动**，页面 body 不横向滚。
6. 切深色模式 → 矩阵配色跟着换（用的是 `--mx-*-rgb`），数字仍可读。
7. 切强调色 → 首屏斜体短语和按钮 hover 跟着变。
8. 滚动 → 两块内容依次淡入。
9. 访问 `/en/` → 全部文案是英文，数字用 `en-US` 千分位。

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(home): 首屏与覆盖矩阵

矩阵用 width:100% + table-layout:fixed 铺满整幅，格内写真实录用数 ——
之前设计稿里表格只有 350px 宽导致右侧留白。
格子深浅用 rgb(var(--mx-*-rgb) / alpha) 连续映射，明暗两套各一组三元组；
alpha > 0.55 时数字自动转浅色保证可读。
SOSP 的 ◂01–13 标注从 preYears 算出，不写死。
宽表在自身容器内横向滚动，页面 body 不横向滚。
「数据同步于」取 submission-timeline 的人工 update 时间，而非构建时间 ——
后者每次部署都变，反而误导。"
```

---

### Task 9: 首页 5 个功能块与收尾块

**Files:**
- Create: `src/components/home/FeatureBlock.astro`
- Create: `src/components/home/media/SearchDemo.astro`
- Create: `src/components/home/media/TrendDemo.astro`
- Create: `src/components/home/media/AbstractDemo.astro`
- Create: `src/components/home/media/DeadlineDemo.astro`
- Create: `src/components/home/media/AwardDemo.astro`
- Create: `src/components/home/ClosingBand.astro`
- Create: `src/scripts/home-countdown.js`
- Create: `tests/home-countdown.test.js`
- Modify: `src/pages/[lang]/index.astro`
- Modify: `src/scripts/boot.js`

**Interfaces:**
- Consumes: `toSparkline` / `buildTotalTrend` / `pickUpcomingDeadlines` / `pickHighlights`（Task 7）、`registerPage`（Task 4）
- Produces: `FeatureBlock` props `{ kicker, title, body, linkLabel, href, flip?: boolean, tint?: boolean }` + 默认 slot 放媒体

- [ ] **Step 1: 实现通用 FeatureBlock**

5 个块骨架完全一致，只有内容和左右顺序不同 —— 做成一个带 `flip` 的组件，复制 5 份是 DRY 违规。

`flip` 靠 CSS `order` 实现而不是调换 DOM 顺序：这样 DOM 里永远是「文字在前、媒体在后」，移动端单列堆叠时文字总在上面，读起来才顺。

```astro
---
const { kicker, title, body, linkLabel, href, flip = false, tint = false } = Astro.props;

// 下面那个 div 只用 class:list，不要再叠一个静态 class ——
// 两者同时写，渲染出来的类名会重复一遍。
// 这条说明放在 frontmatter 而不是写成 HTML 注释：Astro 会把模板里的 HTML 注释
// 原样输出到产物，本组件在首页用了 5 次，注释就会跟着进产物 5 次；
// frontmatter 里的注释不会。
---

<section class:list={['band', { 'band--tint': tint }]}>
  <div class:list={['wrap', 'fb', { flip }]}>
    <div class="txt">
      <div class="kicker" data-reveal>{kicker}</div>
      <h2 class="srf" data-reveal>{title}</h2>
      <p data-reveal>{body}</p>
      <a class="lnk more" href={href} data-reveal>{linkLabel} →</a>
    </div>
    <div class="media" data-reveal>
      <slot />
    </div>
  </div>
</section>

<style>
  .fb {
    display: grid;
    grid-template-columns: 1fr 1.15fr;
    gap: var(--sp-gap);
    align-items: center;
  }
  /* 用 order 翻转而非调换 DOM：移动端单列时文字始终在媒体之上 */
  .fb.flip .txt { order: 2; }

  .txt .kicker { margin-bottom: 0.8rem; }
  .txt h2 { margin-bottom: 0.8rem; white-space: pre-line; }
  .txt p { color: var(--muted); font-size: var(--fs-small); max-width: 32rem; }
  .more { display: inline-block; margin-top: 1rem; font-size: var(--fs-small); }

  @media (max-width: 820px) {
    .fb { grid-template-columns: 1fr; gap: 1.6rem; }
    .fb.flip .txt { order: 0; }
  }
</style>
```

- [ ] **Step 2: 实现 SearchDemo**

媒体侧全部是**真数据**渲染的静态标记 —— 没有截图、没有图片、深色模式自动跟随、数据更新后自动跟着新。

```astro
---
import { t } from '@/i18n/index.js';
const { lang, rows, term, hits } = Astro.props;
const nf = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US');

// 把标题里命中 term 的部分切出来上高亮，大小写不敏感
function split(title) {
  const i = title.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0) return [title];
  return [title.slice(0, i), title.slice(i, i + term.length), title.slice(i + term.length)];
}
---

<div class="panel demo">
  <div class="bar">
    <span class="ic" aria-hidden="true">⌕</span>
    <span class="q">{term}</span>
  </div>
  <ul>
    {rows.map((r) => {
      const [pre, hit, post] = split(r.title);
      return (
        <li>
          <span class="pub">{r.publication} {r.year}</span>
          <span class="ttl">{pre}{hit && <b class="hl">{hit}</b>}{post}</span>
          <span class="star" aria-hidden="true">☆</span>
        </li>
      );
    })}
  </ul>
  <div class="foot">{t(lang, 'home.f1Hits', { hits: nf.format(hits), shown: rows.length })}</div>
</div>

<style>
  .demo { font-size: var(--fs-kicker); }
  .bar {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.55rem 0.8rem; border-bottom: 1px solid var(--hairline);
  }
  .ic { color: var(--faint); }
  .q { color: var(--ink); }
  ul { list-style: none; margin: 0; padding: 0; }
  li {
    display: flex; gap: 0.65rem; align-items: baseline;
    padding: 0.5rem 0.8rem; border-top: 1px solid var(--hairline-soft);
    line-height: 1.55;
  }
  li:first-child { border-top: 0; }
  .pub { color: var(--faint); flex: none; width: 4.6rem; font-variant-numeric: tabular-nums; }
  .ttl { flex: 1; }
  .star { color: var(--hairline); flex: none; }
  .foot {
    padding: 0.5rem 0.8rem; border-top: 1px solid var(--hairline);
    color: var(--faint);
  }
</style>
```

- [ ] **Step 3: 实现 TrendDemo**

```astro
---
import { t } from '@/i18n/index.js';
import { toSparkline } from '@/lib/sparkline.js';

const { lang, points } = Astro.props;
const spark = toSparkline(points, { width: 100, height: 40 });
const first = points[0];
const last = points[points.length - 1];
const mid = points[Math.floor(points.length / 2)];
const nf = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US');
---

<div class="panel demo">
  <svg viewBox="0 0 100 44" preserveAspectRatio="none" role="img"
       aria-label={t(lang, 'home.f2Caption', { from: nf.format(first.count), to: nf.format(last.count) })}>
    <defs>
      <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--accent)" stop-opacity="0.18" />
        <stop offset="1" stop-color="var(--accent)" stop-opacity="0" />
      </linearGradient>
    </defs>
    <line x1="0" y1="40" x2="100" y2="40" stroke="var(--hairline)" stroke-width="0.4" />
    <line x1="0" y1="20" x2="100" y2="20" stroke="var(--hairline-soft)" stroke-width="0.4" stroke-dasharray="1.5 1.5" />
    <path d={spark.area} fill="url(#sparkFill)" />
    <polyline points={spark.line} fill="none" stroke="var(--accent)" stroke-width="0.9"
              stroke-linejoin="round" vector-effect="non-scaling-stroke" />
    <circle cx={spark.coords[spark.coords.length - 1][0]} cy={spark.coords[spark.coords.length - 1][1]}
            r="1.4" fill="var(--accent)" vector-effect="non-scaling-stroke" />
  </svg>
  <div class="axis">
    <span>{first.year}</span><span>{mid.year}</span><span>{last.year}</span>
  </div>
  <div class="foot">
    {t(lang, 'home.f2Caption', { from: nf.format(first.count), to: nf.format(last.count) })}
  </div>
</div>

<style>
  .demo { padding: 0.9rem 1rem 0.7rem; }
  svg { width: 100%; height: 130px; display: block; }
  .axis {
    display: flex; justify-content: space-between;
    font-size: var(--fs-kicker); color: var(--faint); margin-top: 0.2rem;
    font-variant-numeric: tabular-nums;
  }
  .foot {
    margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px solid var(--hairline-soft);
    font-size: var(--fs-kicker); color: var(--faint);
  }
</style>
```

`preserveAspectRatio="none"` 配 `vector-effect="non-scaling-stroke"`：让折线横向铺满容器，同时线宽不被拉伸变形。

- [ ] **Step 4: 实现 AbstractDemo**

```astro
---
const { paper, terms } = Astro.props;

// 摘要截到约 210 字符，在词边界断开，避免切断单词
function clip(text, max = 210) {
  const s = String(text || '').trim().replace(/\s+/g, ' ');
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

// 把 terms 里的词切出来上高亮（构建时做，纯静态）
function segments(text) {
  const escaped = terms.filter(Boolean).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!escaped.length) return [{ text, hit: false }];
  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const out = [];
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), hit: false });
    out.push({ text: m[0], hit: true });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last), hit: false });
  return out;
}

const body = segments(clip(paper.abstract));
---

<div class="panel demo">
  <div class="meta">{paper.publication} {paper.year} · #{paper.id}</div>
  <div class="srf ttl">{paper.title}</div>
  <p class="body">{body.map((s) => (s.hit ? <b class="hl">{s.text}</b> : s.text))}</p>
  <div class="tags">
    {terms.slice(0, 2).map((k) => <span class="tag">{k}</span>)}
  </div>
</div>

<style>
  .demo { padding: 0.9rem 1.05rem 1rem; }
  .meta { font-size: var(--fs-kicker); color: var(--faint); margin-bottom: 0.45rem; }
  .ttl { font-size: 0.95rem; line-height: 1.4; margin-bottom: 0.55rem; }
  .body { font-size: var(--fs-kicker); line-height: 1.78; color: var(--muted); margin: 0; }
  .tags { display: flex; gap: 0.35rem; margin-top: 0.7rem; flex-wrap: wrap; }
  .tag {
    border: 1px solid var(--hairline); color: var(--muted);
    font-size: 0.62rem; padding: 0.1rem 0.45rem;
  }
</style>
```

- [ ] **Step 5: 实现 DeadlineDemo**

构建时算好的天数在部署当天是对的，之后会越来越旧，所以每条都带 `data-ddl` 让客户端重算。`data-placeholder` 把占位文案交给脚本，脚本就不用碰 i18n。

```astro
---
import { t } from '@/i18n/index.js';
const { lang, picked } = Astro.props;

// 「天」与「已截止」两个标签挂在容器的 data 属性上：客户端脚本重算后要能把它们
// 写回去，但脚本里不该出现 i18n。放容器而非每行，因为整块共用同一组标签。
//
// 无论 past 与否，每行都渲染同一套骨架（data-days + unit），只是初始文案不同。
// 早先按 past 分成两种形状（past 行只有 <span class="passed">、根本没有
// [data-days]），于是某行由「构建时已过期」翻回未来时（构建服务器与访客本地日期
// 最多差约 26 小时，真实可达），脚本摘得掉 .past 类却写不进天数 ——
// 行的样式变了、文字还停在「已截止」。形状统一后脚本只有一条代码路径，
// 测试的 DOM 夹具也能天然忠实。
//
// 说明写在 frontmatter 而非模板里的 HTML 注释：Astro 会把模板注释原样输出到产物，
// 而本组件的行会渲染多次，注释就跟着重复多次。
---

<div class="panel demo" data-countdown
     data-placeholder={t(lang, 'home.f4Placeholder')}
     data-days-label={t(lang, 'home.f4Days')}
     data-passed-label={t(lang, 'home.f4Passed')}>
  {picked.placeholder ? (
    <div class="ph">{t(lang, 'home.f4Placeholder')}</div>
  ) : (
    picked.items.map((it) => (
      <div class:list={['row', { past: it.past }]} data-ddl={it.dateText}>
        <div class="who">
          <div class="pub">{it.publication} <span class="stage">· {it.stage}</span></div>
          <div class="date">{it.dateText}</div>
        </div>
        <div class="srf num">
          <span data-days>{it.past ? t(lang, 'home.f4Passed') : it.daysLeft}</span>
          <span class="unit">{it.past ? '' : ` ${t(lang, 'home.f4Days')}`}</span>
        </div>
      </div>
    ))
  )}
</div>

<style>
  .row {
    display: flex; align-items: baseline; gap: 0.8rem;
    padding: 0.7rem 0.9rem; border-top: 1px solid var(--hairline);
  }
  .row:first-child { border-top: 0; }
  .row.past { color: var(--faint); }
  .who { flex: 1; min-width: 0; }
  .pub { font-size: var(--fs-small); }
  .stage { color: var(--faint); }
  .date { font-size: var(--fs-kicker); color: var(--faint); margin-top: 0.15rem; font-variant-numeric: tabular-nums; }
  .num { font-size: 1.3rem; color: var(--accent); font-variant-numeric: tabular-nums; }
  .row.past .num { color: var(--faint); font-size: var(--fs-small); }
  .unit, .passed { font-size: var(--fs-kicker); color: var(--faint); }
  .ph { padding: 1.4rem 0.9rem; text-align: center; color: var(--faint); font-size: var(--fs-small); }
</style>
```

- [ ] **Step 6: 实现 home-countdown.js**

```js
import { parseDeadlineDate } from '@/lib/deadlines.js';

/**
 * 首页倒计时的客户端刷新。构建时嵌入的天数在部署当天正确，之后会过期；
 * 这里按访客本地时区重算，并在所有截止日都已过去时切成占位文案 ——
 * 否则数据断更后首页会显示「还剩 −30 天」。
 *
 * 日期解析**必须复用 parseDeadlineDate**，不要在这里自己写正则。区间日期
 * （'2026-05-01 ~ 2026-05-10'）该取的是 ~ 之后的结束日；早先这里用
 * /(\d{4})-(\d{2})-(\d{2})/ 取第一个匹配，于是构建时用结束日、客户端用开始日，
 * 同一条截止日在两处算出的天数不一样。
 */
export function initCountdown() {
  const box = document.querySelector('[data-countdown]');
  if (!box || box.dataset.bound) return;
  box.dataset.bound = '1';

  const rows = [...box.querySelectorAll('[data-ddl]')];
  if (!rows.length) return;

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysLabel = box.dataset.daysLabel || '';
  const passedLabel = box.dataset.passedLabel || '';
  let anyFuture = false;

  for (const row of rows) {
    const date = parseDeadlineDate(row.dataset.ddl);
    if (!date) continue;
    const days = Math.round((date - base) / 86400000);

    const slot = row.querySelector('[data-days]');
    const unit = row.querySelector('.unit');

    // 两个方向都要处理，且互为逆操作：构建时已过期的行也可能因访客所在时区
    // 而翻回未来。所以每个分支都把 class、天数、单位三者一并写到位，
    // 不能只改其中一两个 —— 那样会留下「样式说未过期、文字说已截止」的行。
    if (days >= 0) {
      anyFuture = true;
      row.classList.remove('past');
      if (slot) slot.textContent = String(days);
      if (unit) unit.textContent = daysLabel ? ` ${daysLabel}` : '';
    } else {
      row.classList.add('past');
      if (slot) slot.textContent = passedLabel;   // 绝不写负数
      if (unit) unit.textContent = '';
    }
  }

  if (!anyFuture) {
    const ph = document.createElement('div');
    ph.className = 'ph';
    ph.textContent = box.dataset.placeholder || '';
    box.replaceChildren(ph);
  }
}
```

- [ ] **Step 7: 实现 AwardDemo**

```astro
---
import { t } from '@/i18n/index.js';
const { lang, highlights } = Astro.props;
---

<div class="cards">
  {highlights.map((h) => (
    <div class="panel card">
      <div class="tag">{h.awardName} · {h.publication} {h.year}</div>
      <div class="srf ttl">{h.title}</div>
    </div>
  ))}
  <div class="panel card card--more">
    <div class="tag tag--muted">{t(lang, 'home.f5More')}</div>
    <div class="ttl-sm">{t(lang, 'home.f5MoreDetail')}</div>
  </div>
</div>

<style>
  .cards { display: flex; flex-direction: column; gap: 0.55rem; }
  .card { padding: 0.7rem 0.9rem; border-left: 2px solid var(--gold); }
  .card--more { border-left-color: var(--hairline); color: var(--muted); }
  .tag {
    font-size: 0.62rem; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 0.35rem;
  }
  .tag--muted { color: var(--faint); }
  .ttl { font-size: 0.83rem; line-height: 1.45; }
  .ttl-sm { font-size: var(--fs-kicker); }
</style>
```

- [ ] **Step 8: 实现 ClosingBand**

```astro
---
import { t } from '@/i18n/index.js';
const { lang, total } = Astro.props;
const nf = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US');

const cards = [
  { title: t(lang, 'home.closingSitesTitle'), body: t(lang, 'home.closingSitesBody'), href: `/${lang}/sites/` },
  { title: t(lang, 'home.closingPrefsTitle'), body: t(lang, 'home.closingPrefsBody'), href: `/${lang}/settings/` },
  { title: t(lang, 'home.closingOpenTitle'), body: t(lang, 'home.closingOpenBody'), href: 'https://github.com/c01dkit/sec-papers-collection' },
];
---

<section class="band band--inverse">
  <div class="wrap">
    <div class="kicker k" data-reveal>{t(lang, 'home.closingKicker')}</div>
    <h2 class="srf ttl" data-reveal>{t(lang, 'home.closingTitle')}</h2>

    <div class="grid" data-reveal>
      {cards.map((c) => (
        <a class="cell" href={c.href} rel={c.href.startsWith('http') ? 'noopener' : undefined}
           target={c.href.startsWith('http') ? '_blank' : undefined}>
          <div class="srf ct">{c.title}</div>
          <p class="cb">{c.body}</p>
        </a>
      ))}
    </div>

    <div class="cta" data-reveal>
      <a class="btn" href={`/${lang}/search/`}>{t(lang, 'home.closingCta', { total: nf.format(total) })}</a>
      <span class="by">{t(lang, 'footer.author')} · {t(lang, 'footer.updateNote')}</span>
    </div>
  </div>
</section>

<style>
  .k { color: var(--inverse-muted); margin-bottom: 0.7rem; }
  .ttl { margin-bottom: 1.5rem; }

  /* 1px 间隙靠背景色透出，不用 border 也不用阴影 */
  .grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: var(--inverse-hairline);
  }
  .cell { background: var(--inverse-bg); padding: 1.05rem 1.15rem; display: block; }
  .cell:hover .ct { color: var(--accent); }
  .ct { font-size: 0.95rem; margin-bottom: 0.4rem; transition: color var(--dur) var(--ease); }
  .cb { font-size: var(--fs-kicker); line-height: 1.7; color: var(--inverse-muted); margin: 0; }

  .cta { margin-top: 1.8rem; display: flex; flex-wrap: wrap; align-items: center; gap: 0.8rem; }
  .btn {
    background: var(--inverse-ink); color: var(--inverse-bg);
    font-size: var(--fs-small); padding: 0.65rem 1.2rem; border-radius: var(--radius);
  }
  .by { font-size: var(--fs-kicker); color: var(--inverse-muted); }

  @media (max-width: 720px) { .grid { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 9: 装配完整首页**

`SEARCH_TERM` 与 `ABSTRACT_TERMS` 是首页演示用的固定词，写死在页面里而非 i18n —— 它们是技术术语，两语相同。

```astro
---
// src/pages/[lang]/index.astro —— 在 Task 8 版本上追加 5 块 + 收尾
import BaseLayout from '@/layouts/BaseLayout.astro';
import Hero from '@/components/home/Hero.astro';
import CoverageMatrix from '@/components/home/CoverageMatrix.astro';
import FeatureBlock from '@/components/home/FeatureBlock.astro';
import SearchDemo from '@/components/home/media/SearchDemo.astro';
import TrendDemo from '@/components/home/media/TrendDemo.astro';
import AbstractDemo from '@/components/home/media/AbstractDemo.astro';
import DeadlineDemo from '@/components/home/media/DeadlineDemo.astro';
import AwardDemo from '@/components/home/media/AwardDemo.astro';
import ClosingBand from '@/components/home/ClosingBand.astro';
import { LOCALES, t } from '@/i18n/index.js';
import { buildCoverageMatrix, TOP_TIER, SE_SYS } from '@/lib/coverage.js';
import { buildTotalTrend } from '@/lib/sparkline.js';
import { pickUpcomingDeadlines } from '@/lib/deadlines.js';
import { pickHighlights } from '@/lib/awards-model.js';
import stats from '@/assets/data/data-statistics.json';
import timeline from '@/assets/data/submission-timeline.json';
import awards from '@/assets/data/awards.json';
import quickView from '@/assets/data/data-quick-view.json';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

const { lang } = Astro.params;
const nf = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US');

// ── 首屏与矩阵 ─────────────────────────────────────────
const matrix = buildCoverageMatrix(stats);
const venues = TOP_TIER.concat(SE_SYS).filter((n) => stats.byPublicationAndYear[n]).length;
const years = stats.years.map(Number);
const yearSpan = `${Math.min(...years)}–${String(Math.max(...years)).slice(2)}`;
const syncDate = timeline.map((p) => p.update).filter(Boolean).sort().pop() ?? '';

// ── 01 检索 ────────────────────────────────────────────
// 首页演示用的固定词，两语相同，是技术术语不进 i18n
const SEARCH_TERM = 'fuzz';
const matched = quickView.filter((p) => p.title.toLowerCase().includes(SEARCH_TERM));
const searchRows = matched
  .sort((a, b) => b.year - a.year || a.id - b.id)
  .slice(0, 3);

// ── 02 趋势 ────────────────────────────────────────────
// 末年通常还在办、数据不全，画进去会是一根断崖，所以掐掉
const fullYears = stats.years.filter((y) => Number(y) >= 2015);
const trendYears = fullYears.slice(0, -1);
const trendPoints = buildTotalTrend(stats, trendYears);

// ── 03 摘要 ────────────────────────────────────────────
const ABSTRACT_TERMS = ['LLM', 'fuzzing'];
// 摘要只存在 meta_json 里，需要显式 import 一届。
// 届次文件名硬编码是有意的：数据更新后若这届消失，astro build 会立刻失败
// 提醒改这一行，而不是静默渲染出一张空摘要卡。
const metaLatest = (await import('@/assets/data/meta_json/IEEE S&P - 2026.json')).default;
// 挑一篇摘要里命中演示词的，命不中就退回第一篇
const abstractPaper =
  metaLatest.find(
    (p) => p.abstract && ABSTRACT_TERMS.some((k) => p.abstract.toLowerCase().includes(k.toLowerCase()))
  ) ?? metaLatest[0];

// ── 04 时间线 ──────────────────────────────────────────
const picked = pickUpcomingDeadlines(timeline, new Date(), 3);

// ── 05 名望 ────────────────────────────────────────────
const highlights = pickHighlights(awards, 2);
---

<BaseLayout lang={lang} page="home" title={null} wide={true}>
  <Hero lang={lang} total={stats.total} venues={venues} yearSpan={yearSpan} syncDate={syncDate} />
  <CoverageMatrix lang={lang} matrix={matrix} total={stats.total} />

  <FeatureBlock kicker={t(lang, 'home.f1Kicker')} title={t(lang, 'home.f1Title')}
                body={t(lang, 'home.f1Body')} linkLabel={t(lang, 'home.f1Link')}
                href={`/${lang}/search/`}>
    <SearchDemo lang={lang} rows={searchRows} term={SEARCH_TERM} hits={matched.length} />
  </FeatureBlock>

  <FeatureBlock kicker={t(lang, 'home.f2Kicker')} title={t(lang, 'home.f2Title')}
                body={t(lang, 'home.f2Body', {
                  from: nf.format(trendPoints[0].count),
                  to: nf.format(trendPoints[trendPoints.length - 1].count),
                })}
                linkLabel={t(lang, 'home.f2Link')} href={`/${lang}/trends/`} flip tint>
    <TrendDemo lang={lang} points={trendPoints} />
  </FeatureBlock>

  <FeatureBlock kicker={t(lang, 'home.f3Kicker')} title={t(lang, 'home.f3Title')}
                body={t(lang, 'home.f3Body')} linkLabel={t(lang, 'home.f3Link')}
                href={`/${lang}/abstract/`}>
    <AbstractDemo paper={abstractPaper} terms={ABSTRACT_TERMS} />
  </FeatureBlock>

  <FeatureBlock kicker={t(lang, 'home.f4Kicker')} title={t(lang, 'home.f4Title')}
                body={t(lang, 'home.f4Body')} linkLabel={t(lang, 'home.f4Link')}
                href={`/${lang}/timeline/`} flip tint>
    <DeadlineDemo lang={lang} picked={picked} />
  </FeatureBlock>

  <FeatureBlock kicker={t(lang, 'home.f5Kicker')} title={t(lang, 'home.f5Title')}
                body={t(lang, 'home.f5Body')} linkLabel={t(lang, 'home.f5Link')}
                href={`/${lang}/awards/`}>
    <AwardDemo lang={lang} highlights={highlights} />
  </FeatureBlock>

  <ClosingBand lang={lang} total={stats.total} />
</BaseLayout>
```

- [ ] **Step 10: 补 f1Hits 文案并注册倒计时**

注意：本任务用到的 `home.f1Kicker` … `home.closingCta` 等约 35 个 key，**Task 8 已经一次性加齐了**（那一步贴的是完整的 `home` 文案块）。这里真正缺的只有 `f1Hits` 一条。别去重复添加已有的 key，也别因为「看起来该加一批」而把已有条目重写一遍。

```json
// zh.json home 内追加
"f1Hits": "命中 {hits} 篇 · 显示 1–{shown}"
// en.json home 内追加
"f1Hits": "{hits} hits · showing 1–{shown}"
```

在 `src/scripts/boot.js` 顶部追加 import 并注册：

```js
import { initCountdown } from './home-countdown.js';
// ...其余 import 之后
registerPage('home', () => {
  initCountdown();
});
```

- [ ] **Step 10b: 给 home-countdown.js 补回归测试**

这个模块的存在理由就是防住「首页显示还剩 −13 天」。它坏掉的方式是静默的：天数算错不会报错，只会印一个错数字。而它的兄弟模块 `boot.js` 是有八条测试的 —— 这里一条都没有说不过去。可在 jsdom 里直接测，不需要浏览器。

```js
// tests/home-countdown.test.js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCountdown } from '@/scripts/home-countdown.js';

const PLACEHOLDER = '下一轮日期待公布';

// 这段 DOM 必须与 DeadlineDemo.astro 渲染出的结构一致 —— 两者一旦分叉，
// 测试会绿而线上会错，所以改动 DeadlineDemo 的结构时也要同步改这里。
const DAYS_LABEL = '天';
const PASSED_LABEL = '已截止';

// 结构必须与 DeadlineDemo.astro 一致。关键点：past 与非 past 用的是**同一套骨架**
// （data-days + unit），只有初始文案不同 —— 组件那边也是这么渲染的。
// 传 { ddl, past: true } 可以造出「构建时已过期」的初始状态。
function mount(rows) {
  document.body.innerHTML = `
    <div class="panel demo" data-countdown
         data-placeholder="${PLACEHOLDER}"
         data-days-label="${DAYS_LABEL}"
         data-passed-label="${PASSED_LABEL}">
      ${rows
        .map(
          (r) => `
        <div class="row${r.past ? ' past' : ''}" data-ddl="${r.ddl}">
          <div class="who"><div class="pub">${r.pub ?? 'V'}</div></div>
          <div class="num">
            <span data-days>${r.past ? PASSED_LABEL : '?'}</span>
            <span class="unit">${r.past ? '' : ' ' + DAYS_LABEL}</span>
          </div>
        </div>`
        )
        .join('')}
    </div>`;
  return document.querySelector('[data-countdown]');
}

const rowAt = (box, i) => box.querySelectorAll('[data-ddl]')[i];
const daysAt = (box, i) => rowAt(box, i).querySelector('[data-days]')?.textContent;
const numTextAt = (box, i) => rowAt(box, i).querySelector('.num').textContent.trim();
const isPastAt = (box, i) => rowAt(box, i).classList.contains('past');

describe('initCountdown', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('按访客本地的今天重算未来项的天数', () => {
    vi.setSystemTime(new Date(2026, 6, 25)); // 2026-07-25
    const box = mount([{ ddl: '2026-08-06' }]);
    initCountdown();
    expect(daysAt(box, 0)).toBe('12');
    expect(isPastAt(box, 0)).toBe(false);
  });

  it('当天的截止日算 0 天，不算过期', () => {
    vi.setSystemTime(new Date(2026, 7, 6));
    const box = mount([{ ddl: '2026-08-06' }]);
    initCountdown();
    expect(daysAt(box, 0)).toBe('0');
    expect(isPastAt(box, 0)).toBe(false);
  });

  it('构建时是未来、查看时已过期的行：标 past、显示破折号、绝不出现负数', () => {
    // 这正是构建时嵌入的天数会过期这件事本身
    vi.setSystemTime(new Date(2026, 8, 1)); // 2026-09-01
    const box = mount([{ ddl: '2026-08-06' }, { ddl: '2026-12-01' }]);
    initCountdown();
    expect(isPastAt(box, 0)).toBe(true);
    expect(numTextAt(box, 0)).toBe(PASSED_LABEL);
    expect(numTextAt(box, 0)).not.toMatch(/-\d/);
    expect(box.textContent).not.toMatch(/-\d+\s*天/);
    // 后面那条仍是未来，正常显示天数
    expect(isPastAt(box, 1)).toBe(false);
    expect(daysAt(box, 1)).toBe('91');
  });

  it('全部过期时整块换成占位文案', () => {
    vi.setSystemTime(new Date(2027, 0, 1));
    const box = mount([{ ddl: '2026-08-06' }, { ddl: '2026-09-20' }]);
    initCountdown();
    expect(box.textContent.trim()).toBe(PLACEHOLDER);
    expect(box.querySelectorAll('[data-ddl]')).toHaveLength(0);
  });

  it('区间日期取 ~ 之后的结束日 —— 与 parseDeadlineDate 保持一致', () => {
    // 守的是一处真实存在过的分歧：早先客户端自写正则取第一个日期匹配，
    // 而构建时取结束日，同一条截止日两处算出不同天数。
    // 今天在区间之内：取开始日会判成已过期，取结束日才是未来 5 天。
    vi.setSystemTime(new Date(2026, 7, 5)); // 2026-08-05
    const box = mount([{ ddl: '2026-08-01 ~ 2026-08-10' }]);
    initCountdown();
    expect(isPastAt(box, 0)).toBe(false);
    expect(daysAt(box, 0)).toBe('5');
  });

  it('data-ddl 解析不出日期时跳过该行且不抛错', () => {
    vi.setSystemTime(new Date(2026, 6, 25));
    const box = mount([{ ddl: 'TBA' }, { ddl: '2026-08-06' }]);
    expect(() => initCountdown()).not.toThrow();
    expect(daysAt(box, 0)).toBe('?'); // 原样保留
    expect(daysAt(box, 1)).toBe('12');
  });

  it('幂等：守卫生效后，即使时钟前进也不再重算', () => {
    // 光是「连调三次、值还一样」证明不了任何事：时钟不动时，重跑循环写回的是
    // 同一个值，把 dataset.bound 守卫整个删掉这条也照样绿 —— 那就是一条
    // 无法失败的测试。真正能falsify守卫的做法是在两次调用之间推进时钟：
    // 守卫在，第二次直接 return，显示值停在 12；守卫没了，会被改成 5。
    vi.setSystemTime(new Date(2026, 6, 25)); // 2026-07-25 → 距 08-06 十二天
    const box = mount([{ ddl: '2026-08-06' }]);
    initCountdown();
    expect(daysAt(box, 0)).toBe('12');

    vi.setSystemTime(new Date(2026, 7, 1)); // 2026-08-01 → 若重算会变成 5
    initCountdown();
    expect(daysAt(box, 0)).toBe('12');

    expect(box.querySelectorAll('[data-ddl]')).toHaveLength(1);
  });

  it('构建时已过期、查看时却是未来的行：天数与单位都要写回去', () => {
    // 构建服务器的「今天」与访客本地的「今天」最多能差约 26 小时，
    // 所以一行在构建时判为已过期、到访客那里又变成未来，是真实可达的。
    // 这条守的是：摘掉 .past 类的同时，天数和单位也必须一起写对 ——
    // 早先 past 行根本没有 [data-days] 元素，脚本改得了 class 却写不进文字，
    // 结果是「样式说未过期、文字还停在已截止」。
    vi.setSystemTime(new Date(2026, 7, 6)); // 2026-08-06 正是那一天
    const box = mount([{ ddl: '2026-08-06', past: true }]);
    initCountdown();

    expect(isPastAt(box, 0)).toBe(false);
    expect(daysAt(box, 0)).toBe('0');
    expect(numTextAt(box, 0)).toContain(DAYS_LABEL);
    expect(numTextAt(box, 0)).not.toContain(PASSED_LABEL);
  });

  it('页面上没有倒计时块时安全返回', () => {
    document.body.innerHTML = '<main></main>';
    expect(() => initCountdown()).not.toThrow();
  });
});
```

Run: `npx vitest run tests/home-countdown.test.js`
Expected: 9 个用例全部通过

**再确认「区间取结束日」那条真的会失败**（它守的是一个真实发生过的 bug）：临时把 `home-countdown.js` 里的 `parseDeadlineDate(row.dataset.ddl)` 换成早先那种写法 —— `const m = row.dataset.ddl.match(/(\d{4})-(\d{2})-(\d{2})/); const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));` —— 重跑，该条必须报错（会判成已过期）。确认后改回。两段输出都放进报告。

- [ ] **Step 11: 跑测试与构建**

Run: `npx vitest run`
Expected: PASS（文案漂移守卫确认 `home.f1Hits` 等新 key 两语齐全）

Run: `npm run build`
Expected: 成功

Run: `grep -o 'data-reveal' dist/zh/index.html | wc -l`
Expected: 25 以上

Run: `grep -q 'data-countdown' dist/zh/index.html && echo "✓ 倒计时挂载点存在"`
Expected: 打印 `✓ 倒计时挂载点存在`

- [ ] **Step 12: 人工验收**

Run: `npm run dev`，访问 `/zh/`，从上滚到底

1. 顺序是：首屏 → 覆盖矩阵 → 01 检索 → 02 趋势 → 03 摘要 → 04 时间线 → 05 名望 → 深色收尾。
2. 左右交替：01 文左图右、02 图左文右、03 文左图右、04 图左文右、05 文左图右。
3. 每块在滚到时淡入，同一块内的元素**依次**浮现而非齐刷刷跳出。
4. 01 的迷你搜索结果里 `fuzz` 被高亮；标题是真实论文。
5. 02 的折线横向铺满面板，末端有个点；线宽不被拉伸变形。
6. 04 的天数与今天日期相符（改系统日期或在控制台改 `data-ddl` 验证）；已过期的行显示 `—` 而**不是负数**。
7. 05 的两张获奖卡是真实论文，且来自**不同会议**。
8. 深色收尾块里三格之间是 1px 细线（背景透出），没有阴影。
9. 窗口收窄到 800px 以下 → 全部块变单列，且**文字始终在媒体上方**（验 `order` 翻转写法）。
10. 切深色 / 切强调色 → 趋势折线、按钮、卡片左边框跟着变。
11. `/en/` 同样检查一遍。

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat(home): 5 个功能块与深色收尾块，首页完成

FeatureBlock 做成带 flip 的通用组件，5 块共用 —— 骨架一致，复制 5 份是 DRY 违规。
flip 用 CSS order 而非调换 DOM：移动端单列堆叠时文字始终在媒体之上。
媒体侧全部真数据渲染的静态标记，无截图无图片，深色模式自动跟随，数据更新自动跟新。
趋势图掐掉末年（会议通常还在办、数据不全，画进去是一根断崖）。
倒计时构建时嵌初值、客户端按本地时区重算，全部过期时切占位文案，
永不显示负天数。
meta_json 的届次文件名硬编码有意为之：数据更新后该届消失会让构建立刻失败，
而不是静默渲染空摘要。"
```

---

### Task 10: 设置的 schema 与存储

**Files:**
- Modify: `src/lib/settings-schema.js`（Task 4 只放了常量，现在补全）
- Create: `src/scripts/settings-store.js`
- Create: `tests/settings-schema.test.js`
- Create: `tests/settings-store.test.js`
- Modify: `package.json`（加 `fake-indexeddb`）
- Modify: `src/layouts/BaseLayout.astro`（预绘制脚本读 remember 标志）

**Interfaces:**
- Consumes: 无
- Produces:
  - `ACCENTS: string[]`、`THEMES: string[]`
  - `DEFAULT_SETTINGS() => Settings`
  - `migrateSettings(raw) => Settings` —— 纯函数，负责补默认值、纠脏值、删死字段
  - `MIRROR: { theme, accent, lang, rememberDark, rememberAccent, rememberLang }` —— localStorage 键名常量
  - `getSettings() => Promise<Settings>`（永不 reject）
  - `patchSettings(partial) => Promise<Settings>`（永不 reject，返回合并后的完整设置）
  - `getFavorites() => Promise<number[]>`（永不 reject）
  - `toggleFavorite(id) => Promise<{favorites: number[], added: boolean}>`（永不 reject）
  - `isPersistent() => boolean` —— IndexedDB 是否真的可用，供 UI 提示降级
  - `hydrateSettings() => Promise<Settings>`（永不 reject）—— 页面加载后调用一次：
    读库、把迁移结果写回、填充 localStorage 镜像。老用户只有库没有镜像，缺这一步
    他们存的主题偏好在新站首访时会被无声忽略。

**存储契约（实现时务必按这个来）**

两层存储，各有不可替代的理由：

- **IndexedDB**（`spc-settings` / `config` / key `app` 与 `favorites`）—— 持久真值，装得下 `keywords` 数组和上千个收藏 ID。异步。
- **localStorage 镜像**（6 个键）—— 只放主题、强调色、语言和三个 remember 标志。存在的唯一理由是**预绘制脚本必须同步读到它们**；IndexedDB 是异步的，等它返回时首屏已经画完，会闪一下默认主题。

写入时**两边都写**，读取时按用途选：预绘制读 localStorage，设置页读 IndexedDB。`patchSettings` 是唯一的写入口，镜像同步在它内部完成 —— 别在别处直接写 localStorage。

- [ ] **Step 1: 装 fake-indexeddb**

「IndexedDB schema 禁止改动」是硬约束，现有用户的收藏在里面，必须有自动化测试守住，不能靠人工点。

```bash
npm install -D fake-indexeddb
```

- [ ] **Step 2: 写 settings-schema 的失败测试**

```js
// tests/settings-schema.test.js
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
```

- [ ] **Step 3: 跑测试确认失败**

Run: `npx vitest run tests/settings-schema.test.js`
Expected: FAIL，`migrateSettings is not a function`

- [ ] **Step 4: 补全 src/lib/settings-schema.js**

```js
export const ACCENTS = ['slate', 'indigo', 'oxblood', 'pine'];
export const THEMES = ['light', 'dark'];
const LANGS = ['zh', 'en'];

/** localStorage 镜像键名。存在的唯一理由是预绘制脚本要同步读取。 */
export const MIRROR = {
  theme: 'spc-theme',
  accent: 'spc-accent',
  lang: 'spc-lang',
  rememberDark: 'spc-remember-dark',
  rememberAccent: 'spc-remember-accent',
  rememberLang: 'spc-remember-lang',
};

export function DEFAULT_SETTINGS() {
  return {
    theme: 'slate',            // 强调色 slug（语义已从 PrimeVue 预设名改变）
    language: 'en',
    darkTheme: false,
    rememberLanguage: false,
    rememberDarkMode: false,
    rememberTheme: false,
    showStatusDots: false,
    keywords: [],
  };
}

/**
 * 把任意来源的原始对象规整成合法设置。
 * 输出的键集合恒等于 DEFAULT_SETTINGS()，多余字段一律丢弃 ——
 * 否则历史遗留字段（如 llmEndpoint）会永远躺在用户库里越积越多。
 */
export function migrateSettings(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = DEFAULT_SETTINGS();

  out.theme = ACCENTS.includes(src.theme) ? src.theme : 'slate';
  out.language = LANGS.includes(src.language) ? src.language : 'en';
  out.darkTheme = Boolean(src.darkTheme);
  out.rememberLanguage = Boolean(src.rememberLanguage);
  out.rememberDarkMode = Boolean(src.rememberDarkMode);
  out.rememberTheme = Boolean(src.rememberTheme);
  out.showStatusDots = Boolean(src.showStatusDots);
  out.keywords = Array.isArray(src.keywords)
    ? src.keywords.filter((k) => k !== null && k !== undefined && String(k) !== '').map(String)
    : [];

  return out;
}
```

- [ ] **Step 5: 写 settings-store 的失败测试**

两个 describe 块环境不同：真 IDB 路径用 `fake-indexeddb`，降级路径要在**没有** `indexedDB` 的环境里跑。

```js
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { DEFAULT_SETTINGS, MIRROR } from '@/lib/settings-schema.js';

async function freshStore({ withIDB = true } = {}) {
  // 每个用例一套干净的库与模块实例（store 内部缓存了 db promise）
  if (withIDB) globalThis.indexedDB = new IDBFactory();
  else delete globalThis.indexedDB;
  localStorage.clear();
  vi.resetModules();
  return import('@/scripts/settings-store.js');
}

describe('IndexedDB 可用时', () => {
  it('首次读取给默认值', async () => {
    const s = await freshStore();
    expect(await s.getSettings()).toEqual(DEFAULT_SETTINGS());
    expect(s.isPersistent()).toBe(true);
  });

  it('写入后能读回', async () => {
    const s = await freshStore();
    await s.patchSettings({ keywords: ['fuzz', 'LLM'], theme: 'pine' });
    const got = await s.getSettings();
    expect(got.keywords).toEqual(['fuzz', 'LLM']);
    expect(got.theme).toBe('pine');
  });

  it('patch 是合并而非覆盖', async () => {
    const s = await freshStore();
    await s.patchSettings({ keywords: ['a'] });
    await s.patchSettings({ showStatusDots: true });
    const got = await s.getSettings();
    expect(got.keywords).toEqual(['a']);
    expect(got.showStatusDots).toBe(true);
  });

  it('读取时对库里的脏数据做迁移', async () => {
    const s = await freshStore();
    await s.patchSettings({ theme: 'pine' });
    // 直接往库里塞一份旧格式数据，绕过 patchSettings
    await s.__writeRaw('app', { theme: 'green', llmApiKey: 'sk-1', keywords: 'oops' });
    const got = await s.getSettings();
    expect(got.theme).toBe('slate');
    expect(got).not.toHaveProperty('llmApiKey');
    expect(got.keywords).toEqual([]);
  });

  it('收藏能增删且顺序稳定', async () => {
    const s = await freshStore();
    expect(await s.getFavorites()).toEqual([]);
    const r1 = await s.toggleFavorite(42);
    expect(r1).toEqual({ favorites: [42], added: true });
    await s.toggleFavorite(7);
    expect(await s.getFavorites()).toEqual([42, 7]);
    const r2 = await s.toggleFavorite(42);
    expect(r2).toEqual({ favorites: [7], added: false });
  });

  it('设置与收藏互不干扰（同 store 不同 key）', async () => {
    const s = await freshStore();
    await s.toggleFavorite(1);
    await s.patchSettings({ keywords: ['x'] });
    expect(await s.getFavorites()).toEqual([1]);
    expect((await s.getSettings()).keywords).toEqual(['x']);
  });

  it('沿用现有 schema：库名 / store 名 / key 名一字不改', async () => {
    const s = await freshStore();
    await s.patchSettings({ theme: 'pine' });
    await s.toggleFavorite(1);

    const dbs = await globalThis.indexedDB.databases();
    expect(dbs.map((d) => d.name)).toContain('spc-settings');

    const db = await new Promise((res, rej) => {
      const req = globalThis.indexedDB.open('spc-settings');
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    expect(db.version).toBe(1);
    expect([...db.objectStoreNames]).toEqual(['config']);
    const keys = await new Promise((res, rej) => {
      const req = db.transaction('config').objectStore('config').getAllKeys();
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
    expect(keys.sort()).toEqual(['app', 'favorites']);
    db.close();
  });

  it('镜像六个键到 localStorage 供预绘制同步读取', async () => {
    const s = await freshStore();
    await s.patchSettings({ theme: 'oxblood', darkTheme: true, language: 'zh', rememberDarkMode: true });
    expect(localStorage.getItem(MIRROR.accent)).toBe('oxblood');
    expect(localStorage.getItem(MIRROR.theme)).toBe('dark');
    expect(localStorage.getItem(MIRROR.lang)).toBe('zh');
    expect(localStorage.getItem(MIRROR.rememberDark)).toBe('1');
  });
});

describe('并发写：读—改—写必须串行，不能丢更新', () => {
  it('两个并发 patchSettings，两处改动都要留下', async () => {
    const s = await freshStore();
    // 不 await 第一个就发第二个 —— 这正是连点两个按钮的样子
    const a = s.patchSettings({ darkTheme: true });
    const b = s.patchSettings({ theme: 'pine' });
    await Promise.all([a, b]);

    const got = await s.getSettings();
    expect(got.darkTheme).toBe(true);   // 没被 b 的旧快照覆盖
    expect(got.theme).toBe('pine');     // 也没被 a 覆盖
  });

  it('两个并发 toggleFavorite，两个 id 都要在', async () => {
    const s = await freshStore();
    await Promise.all([s.toggleFavorite(1), s.toggleFavorite(2)]);
    expect((await s.getFavorites()).sort()).toEqual([1, 2]);
  });

  it('hydrateSettings 与点击并发时，不把用户刚改的值回滚', async () => {
    const s = await freshStore();
    // 老用户的库：深色关、强调色是已废弃的 green
    await s.__writeRaw('app', { theme: 'green', darkTheme: false, rememberDarkMode: true });

    // **调用顺序很关键**：必须先发点击、后发水合。
    // 反过来写（先水合后点击）的话，水合的写入会先落盘、点击的写入后落盘，
    // 正确结果是靠顺序碰巧得到的 —— 即使把 serialize 拆掉这条也照样绿，
    // 那就是一条检测不到竞态的测试（实测直通状态下 10/10 全过）。
    // 先点击后水合才会让水合的旧快照最后落盘、盖掉用户的改动，
    // 也正是要防的那个真实场景（实测直通状态下 5/5 全红）。
    const c = s.patchSettings({ darkTheme: true, rememberDarkMode: true });
    const h = s.hydrateSettings();
    await Promise.all([c, h]);

    const got = await s.getSettings();
    expect(got.darkTheme).toBe(true);   // 用户的点击必须活下来
    expect(got.theme).toBe('slate');    // 迁移也必须生效
  });

  it('十个并发 toggleFavorite 全部保留，一个不丢', async () => {
    const s = await freshStore();
    const ids = [11, 22, 33, 44, 55, 66, 77, 88, 99, 100];
    await Promise.all(ids.map((i) => s.toggleFavorite(i)));
    expect((await s.getFavorites()).sort((a, b) => a - b)).toEqual(ids);
  });
});

  it('水合在前、点击在后同样不丢更新（对称性）', async () => {
    // 这条与上一条互为镜像。它**单独**并不能检测出竞态 ——
    // 实测把 serialize 拆掉后它 10/10 全过，因为这个顺序下水合的写入先落盘、
    // 点击的写入后落盘，正确结果是靠顺序碰巧得到的。
    // 留着它是为了记录「两种派发顺序都应当安全」这条性质：serialize 的 FIFO
    // 队列本身与派发顺序无关，将来若有人改成某种带偏向的实现，这条会跟着红。
    // 真正有鉴别力的是上一条（先点击后水合）。
    const s = await freshStore();
    await s.__writeRaw('app', { theme: 'green', darkTheme: false, rememberDarkMode: true });

    const h = s.hydrateSettings();
    const c = s.patchSettings({ darkTheme: true, rememberDarkMode: true });
    await Promise.all([h, c]);

    const got = await s.getSettings();
    expect(got.darkTheme).toBe(true);
    expect(got.theme).toBe('slate');
  });
});

describe('openDb 的失败不该拖垮整个会话', () => {
  it('一次瞬时失败之后，下一次调用会重新尝试', async () => {
    localStorage.clear();
    vi.resetModules();
    const real = new IDBFactory();
    let calls = 0;
    // 第一次 open 直接失败，之后恢复正常
    globalThis.indexedDB = {
      open: (...args) => {
        calls++;
        if (calls === 1) {
          const req = {};
          setTimeout(() => req.onerror && req.onerror(), 0);
          return req;
        }
        return real.open(...args);
      },
      databases: () => real.databases(),
    };
    const s = await import('@/scripts/settings-store.js');

    // 第一次读：失败 → 走内存兜底
    await expect(s.getSettings()).resolves.toBeTruthy();
    expect(s.isPersistent()).toBe(false);

    // 第二次写：应当重新 open 并真的落盘，而不是因为缓存了 rejected promise
    // 而整个会话都困在内存里
    await s.patchSettings({ theme: 'pine' });
    expect(calls).toBeGreaterThan(1);
    const raw = await s.__readRaw('app');
    expect(raw?.theme).toBe('pine');
  });
});

describe('降级标志要能恢复', () => {
  it('瞬时失败后重试成功，isPersistent() 回到 true', async () => {
    localStorage.clear();
    vi.resetModules();
    const real = new IDBFactory();
    let calls = 0;
    globalThis.indexedDB = {
      open: (...args) => {
        calls++;
        if (calls === 1) {
          const req = {};
          setTimeout(() => req.onerror && req.onerror(), 0);
          return req;
        }
        return real.open(...args);
      },
      databases: () => real.databases(),
    };
    const s = await import('@/scripts/settings-store.js');

    await s.getSettings();
    expect(s.isPersistent()).toBe(false);   // 第一次失败，降级

    await s.patchSettings({ theme: 'pine' });
    // 重试成功、数据真的落盘了，标志就该收回来 ——
    // 否则 Task 19 的降级提示会永久挂着，等于对用户说假话
    expect(s.isPersistent()).toBe(true);
  });
});

  it('连接健康但事务失败后又成功，标志同样能收回 true', async () => {
    // 覆盖「连接开着、事务失败」这一类，配额耗尽是最典型的情形。
    // 只在 openDb 的 onsuccess 里置 true 的实现会让这条红 ——
    // 因为连接一直是同一个，不会重新 open。
    //
    // 制造方式：临时替换 IDBObjectStore.prototype.put，让**下一次** put 返回一个
    // 立即 onerror 的假请求。比包装 indexedDB.open 简单得多，也不用碰连接生命周期。
    const s = await freshStore();
    await s.patchSettings({ theme: 'slate' });
    expect(s.isPersistent()).toBe(true);

    const realPut = IDBObjectStore.prototype.put;
    let failOnce = true;
    IDBObjectStore.prototype.put = function (...args) {
      if (failOnce) {
        failOnce = false;
        const req = {};
        setTimeout(() => req.onerror && req.onerror(), 0);
        return req;
      }
      return realPut.apply(this, args);
    };

    try {
      await s.patchSettings({ theme: 'pine' });
      expect(s.isPersistent()).toBe(false);   // 事务失败 → 降级

      await s.patchSettings({ theme: 'indigo' });
      expect(s.isPersistent()).toBe(true);    // 写又成功了 → 收回
    } finally {
      IDBObjectStore.prototype.put = realPut;
    }
  });
});

  it('clearFavorites 成功后也能收回标志 —— 它前面没有读操作', async () => {
    // 这条补的是一个真实的覆盖漏洞：patchSettings / toggleFavorite /
    // hydrateSettings 都会先读（getSettings/getFavorites → idbGet，那里已经会
    // 置 true），所以 idbPut 自己那行 persistent = true 在这三条路径上是被**遮住**的
    // —— 把它删掉，上面那条「事务失败后又成功」的测试照样绿。
    // clearFavorites 是唯一没有前置读的写函数，只有走它才能验到 idbPut 那行。
    const s = await freshStore();
    await s.toggleFavorite(1);

    const realPut = IDBObjectStore.prototype.put;
    let failOnce = true;
    IDBObjectStore.prototype.put = function (...args) {
      if (failOnce) {
        failOnce = false;
        const req = {};
        setTimeout(() => req.onerror && req.onerror(), 0);
        return req;
      }
      return realPut.apply(this, args);
    };

    try {
      // 先让一次写失败，把标志打到 false
      await s.toggleFavorite(2);
      expect(s.isPersistent()).toBe(false);

      // clearFavorites 不读只写：成功后必须靠 idbPut 那行把标志收回来
      await s.clearFavorites();
      expect(s.isPersistent()).toBe(true);
    } finally {
      IDBObjectStore.prototype.put = realPut;
    }
  });
});

describe('永不 reject：连恶意入参也不例外', () => {
  it('keywords 里塞一个字符串化会抛错的对象，patchSettings 仍然 resolve', async () => {
    const s = await freshStore();
    await s.patchSettings({ keywords: ['fuzzing'] });
    const bad = {
      [Symbol.toPrimitive]() {
        throw new Error('boom');
      },
    };
    // 契约是永不 reject —— 宁可丢掉这次改动，也要保住已有设置
    await expect(s.patchSettings({ keywords: [bad] })).resolves.toBeTruthy();
    expect((await s.getSettings()).keywords).toEqual(['fuzzing']);
  });
});

describe('clearFavorites', () => {
  it('清空后为空数组，且不影响 app 记录', async () => {
    const s = await freshStore();
    await s.patchSettings({ keywords: ['x'] });
    await s.toggleFavorite(5);
    expect(await s.clearFavorites()).toEqual([]);
    expect(await s.getFavorites()).toEqual([]);
    expect((await s.getSettings()).keywords).toEqual(['x']);
  });
});

describe('hydrateSettings —— 老用户数据的迁移与镜像', () => {
  it('把迁移后的形状写回库里，死字段真的消失', async () => {
    const s = await freshStore();
    // 造一条旧站格式的记录（含两个死字段与已废弃的 theme 值）
    await s.__writeRaw('app', {
      theme: 'green',
      language: 'zh',
      darkTheme: true,
      rememberDarkMode: true,
      rememberTheme: true,
      showStatusDots: true,
      llmEndpoint: 'https://api.example.com/v1/chat/completions',
      llmApiKey: 'sk-must-be-removed',
      keywords: ['fuzzing', 'C++'],
    });

    await s.hydrateSettings();

    // 直接读原始记录：迁移必须已落盘，不能只在内存里对
    const raw = await s.__readRaw('app');
    expect(raw).not.toHaveProperty('llmEndpoint');
    expect(raw).not.toHaveProperty('llmApiKey');
    expect(raw.theme).toBe('slate');          // green 不在新 slug 列表里
    expect(raw.keywords).toEqual(['fuzzing', 'C++']);
    expect(raw.showStatusDots).toBe(true);
    expect(raw.darkTheme).toBe(true);
  });

  it('填充 localStorage 镜像，供下次首绘同步读取', async () => {
    const s = await freshStore();
    await s.__writeRaw('app', {
      theme: 'pine',
      language: 'zh',
      darkTheme: true,
      rememberDarkMode: true,
      rememberTheme: true,
      rememberLanguage: true,
    });
    expect(localStorage.getItem(MIRROR.accent)).toBeNull(); // 老用户没有镜像

    await s.hydrateSettings();

    expect(localStorage.getItem(MIRROR.accent)).toBe('pine');
    expect(localStorage.getItem(MIRROR.theme)).toBe('dark');
    expect(localStorage.getItem(MIRROR.lang)).toBe('zh');
    expect(localStorage.getItem(MIRROR.rememberDark)).toBe('1');
  });

  it('不动收藏', async () => {
    const s = await freshStore();
    await s.__writeRaw('favorites', [1, 42, 7]);
    await s.hydrateSettings();
    expect(await s.getFavorites()).toEqual([1, 42, 7]); // 顺序也不动
  });

  it('库里本来是空的也不报错，写入默认值', async () => {
    const s = await freshStore();
    await expect(s.hydrateSettings()).resolves.toMatchObject({ theme: 'slate' });
  });

  it('IndexedDB 不可用时不 reject', async () => {
    const s = await freshStore({ withIDB: false });
    await expect(s.hydrateSettings()).resolves.toBeTruthy();
  });
});

describe('IndexedDB 不可用时', () => {
  it('getSettings 不抛错，给默认值', async () => {
    const s = await freshStore({ withIDB: false });
    await expect(s.getSettings()).resolves.toEqual(DEFAULT_SETTINGS());
    expect(s.isPersistent()).toBe(false);
  });

  it('patchSettings 不抛错，本会话内仍生效', async () => {
    const s = await freshStore({ withIDB: false });
    await expect(s.patchSettings({ keywords: ['a'] })).resolves.toMatchObject({ keywords: ['a'] });
    expect((await s.getSettings()).keywords).toEqual(['a']);
  });

  it('主题与强调色仍镜像进 localStorage，体验不退化', async () => {
    const s = await freshStore({ withIDB: false });
    await s.patchSettings({ theme: 'pine' });
    expect(localStorage.getItem(MIRROR.accent)).toBe('pine');
  });

  it('收藏操作不抛错，退成本会话有效', async () => {
    const s = await freshStore({ withIDB: false });
    await expect(s.toggleFavorite(5)).resolves.toEqual({ favorites: [5], added: true });
    expect(await s.getFavorites()).toEqual([5]);
  });
});
```

- [ ] **Step 6: 实现 src/scripts/settings-store.js**

每个导出函数都用 `try/catch` 包住并 resolve —— **永不 reject** 是契约。调用方不该为「用户开了隐私模式」写错误处理。

```js
import { DEFAULT_SETTINGS, migrateSettings, MIRROR } from '@/lib/settings-schema.js';

// 这三个常量是硬约束：现有用户的收藏与关键词在这个库里，改一个字就丢数据
const DB_NAME = 'spc-settings';
const STORE = 'config';
const DB_VERSION = 1;

const KEY_APP = 'app';
const KEY_FAV = 'favorites';

let dbPromise = null;

/**
 * 「存储当前是否真的在持久化」。
 *
 * 语义刻意定成**「最近一次实际读写是否成功」**，而不是「连接是否打开过」：
 * 连接开着而事务失败是真实存在的情形（配额耗尽最典型），此时数据并没有落盘，
 * 标志必须为 false；反过来配额腾出来、写又成功了，标志也必须能收回 true。
 * 早先只在 openDb 的 onsuccess 里置 true，于是这类「连接健康、事务失败」
 * 一旦发生就再也恢复不了 —— Task 19 的「存储降级」提示会一直挂着，
 * 而其实早就在正常保存了。名字承诺了什么，就得真的是那个意思。
 */
let persistent = true;

// IndexedDB 不可用时的会话内兜底，保证 UI 行为一致
const memory = { [KEY_APP]: null, [KEY_FAV]: null };

/**
 * 所有**写**操作串行化。
 *
 * patchSettings 与 toggleFavorite 都是「读—改—写」：先读出当前值，合并，再写回。
 * 两个并发调用会各自读到同一个旧值，后写的那个把先写的那个覆盖掉 ——
 * 用户刚点的设置被静默丢掉，而 DOM 已经改了，于是界面与存储不一致。
 * 这不是理论问题：initTheme() 里 hydrateAndApply() 是 fire-and-forget，
 * 紧接着就绑定了主题/强调色两个按钮，所以「水合还在飞、用户已经点了」
 * 几乎每次加载都存在这个窗口；连点两个按钮也会撞上。
 *
 * 用一条 promise 链把写操作排成队。读操作不排队（没必要，也会拖慢）。
 * 排队后无论水合与点击谁先谁后，结果都正确：先水合则点击读到迁移后的值，
 * 先点击则水合读到点击后的值。
 */
let writeQueue = Promise.resolve();

function serialize(fn) {
  // 前一个失败也不能卡住后一个，所以 then 的两个分支都跑 fn
  const run = writeQueue.then(fn, fn);
  // 队列自身永不 reject，否则一次失败会让后续所有写操作都走 rejected 分支
  writeQueue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

export function isPersistent() {
  return persistent;
}

function openDb() {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') {
    persistent = false;
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' });
    };
    req.onsuccess = () => {
      const db = req.result;
      // 开成功就把降级标志收回来。否则一次瞬时故障之后，即使重试成功、
      // 数据其实又在持久化了，isPersistent() 仍会一直返回 false，
      // Task 19 的「存储降级」提示会永久挂着 —— 那是在对用户说假话。
      persistent = true;
      // 连接被外部关掉（onversionchange、用户清了站点数据）时要让缓存失效，
      // 否则 dbPromise 会一直指向一个死连接：后续每次操作都失败并落到内存兜底，
      // 数据不丢但再也不会重试。这和 openDb 失败后清缓存是同一类问题。
      db.onclose = () => {
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('IndexedDB blocked'));
  });
  // 失败时不要把这个 rejected promise 永久缓存下来 —— 那会让一次瞬时故障
  // （onerror / onblocked）把**整个会话**降级到内存兜底，即使原因早已消失。
  // 清掉缓存让下次调用重新尝试。注意不要把 .catch() 的返回值赋回 dbPromise，
  // 否则调用方拿到的就是已被吞掉错误的 resolved promise 了。
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function idbGet(key) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
        req.onsuccess = () => {
          persistent = true;   // 语义见 persistent 声明处的说明
          resolve(req.result ? req.result.value : null);
        };
        req.onerror = () => reject(req.error);
      })
  );
}

function idbPut(key, value) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        // structuredClone 剥掉任何不可克隆的包装，避免 DataCloneError
        let plain;
        try {
          plain = structuredClone(value);
        } catch {
          plain = JSON.parse(JSON.stringify(value));
        }
        const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put({ key, value: plain });
        req.onsuccess = () => {
          persistent = true;   // 语义见 persistent 声明处的说明
          resolve();
        };
        req.onerror = () => reject(req.error);
      })
  );
}

/** 仅供测试：绕过迁移直接写入原始值，用来模拟库里的旧格式数据。 */
export async function __writeRaw(key, value) {
  try {
    await idbPut(key, value);
  } catch {
    memory[key] = value;
  }
}

/** 仅供测试：绕过迁移直接读回原始记录，用来断言写回确实落盘了。 */
export async function __readRaw(key) {
  try {
    return await idbGet(key);
  } catch {
    return memory[key];
  }
}

function mirror(settings) {
  try {
    localStorage.setItem(MIRROR.theme, settings.darkTheme ? 'dark' : 'light');
    localStorage.setItem(MIRROR.accent, settings.theme);
    localStorage.setItem(MIRROR.lang, settings.language);
    localStorage.setItem(MIRROR.rememberDark, settings.rememberDarkMode ? '1' : '0');
    localStorage.setItem(MIRROR.rememberAccent, settings.rememberTheme ? '1' : '0');
    localStorage.setItem(MIRROR.rememberLang, settings.rememberLanguage ? '1' : '0');
  } catch {
    /* 隐私模式下 localStorage 也可能抛错；镜像失败不影响主流程 */
  }
}

export async function getSettings() {
  try {
    const raw = await idbGet(KEY_APP);
    return migrateSettings(raw);
  } catch {
    persistent = false;
  }
  // 兜底路径也要包住 migrateSettings：契约是永不 reject，而 patchSettings 与
  // hydrateSettings 都直接 await 这个函数、外面没有 try，
  // 所以这里漏出去的异常会一路穿透到调用方。
  try {
    return migrateSettings(memory[KEY_APP]);
  } catch {
    return DEFAULT_SETTINGS();
  }
}

export async function patchSettings(partial) {
  return serialize(async () => {
    const current = await getSettings();

    let next;
    try {
      next = migrateSettings({ ...current, ...partial });
    } catch {
      // partial 里若有值在字符串化时抛错（keywords 里塞了个 toString 会抛的对象），
      // 宁可丢掉这次改动也要保住已有设置 —— 契约是永不 reject。
      return current;
    }

    try {
      await idbPut(KEY_APP, next);
    } catch {
      persistent = false;
      memory[KEY_APP] = next;
    }
    mirror(next);
    return next;
  });
}

export async function getFavorites() {
  try {
    const raw = await idbGet(KEY_FAV);
    return Array.isArray(raw) ? raw : [];
  } catch {
    persistent = false;
    return Array.isArray(memory[KEY_FAV]) ? memory[KEY_FAV] : [];
  }
}

export async function toggleFavorite(id) {
  return serialize(async () => {
    const current = await getFavorites();
    const idx = current.indexOf(id);
    const added = idx < 0;
    // 保持插入顺序：不排序，让收藏列表反映用户添加的先后
    const next = added ? [...current, id] : current.filter((x) => x !== id);
    try {
      await idbPut(KEY_FAV, next);
    } catch {
      persistent = false;
      memory[KEY_FAV] = next;
    }
    return { favorites: next, added };
  });
}

/**
 * 把 IndexedDB 里的持久设置「水合」到运行时。页面加载后调用一次。
 *
 * 为什么必须有这一步：预绘制脚本只读 localStorage 镜像，而**老用户的浏览器里
 * 只有 IndexedDB、没有镜像** —— 旧站从来不写 spc-* 这些键。没有水合的话，
 * 一个存了几年深色偏好的老用户在新站首次访问时会被无声忽略，直到他再点一次
 * 开关。旧站是在 App.vue 的 onMounted 里读库并 applySettingsToRuntime 的，
 * 新站必须有等价物，否则就是功能退化。
 *
 * 做三件事：
 *   1. 读出来（getSettings 内部已跑过 migrateSettings）；
 *   2. 把迁移后的形状**写回**库里 —— 这才真正清掉 llmEndpoint 这类死字段，
 *      否则它们会一直躺在用户库里；
 *   3. 填充 localStorage 镜像，供**下次**首绘同步读取。
 *
 * 主题的实际应用不在这里做（那属于 theme.js），本函数只返回设置。
 *
 * 代价要如实说明：升级后的**第一次**加载会有一次可见的主题跳变
 * （系统默认 → 存储值），因为此时镜像还是空的而 IndexedDB 是异步的。
 * 此后镜像已就位，不再跳。一次跳变换回用户的偏好，好过静默丢掉它。
 */
export async function hydrateSettings() {
  return serialize(async () => {
    const settings = await getSettings();
    try {
      await idbPut(KEY_APP, settings);   // 把迁移结果落盘
    } catch {
      persistent = false;
      memory[KEY_APP] = settings;
    }
    mirror(settings);
    return settings;
  });
}

export async function clearFavorites() {
  return serialize(async () => {
    try {
      await idbPut(KEY_FAV, []);
    } catch {
      persistent = false;
      memory[KEY_FAV] = [];
    }
    return [];
  });
}
```

- [ ] **Step 7: 让预绘制脚本尊重 remember 标志**

`BaseLayout.astro` 的 `is:inline` 脚本目前无条件读镜像。改成：`remember` 关掉时忽略镜像、走系统偏好。把 Task 4 那段主题判定替换为：

```js
      (function () {
        var d = document.documentElement;
        var ACCENTS = ['slate', 'indigo', 'oxblood', 'pine'];
        var g = function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } };

        // remember 关闭时忽略上次选择，跟随系统偏好
        var t = g('spc-remember-dark') === '0' ? null : g('spc-theme');
        d.dataset.theme =
          t === 'dark' || t === 'light'
            ? t
            : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

        var a = g('spc-remember-accent') === '0' ? null : g('spc-accent');
        d.dataset.accent = ACCENTS.indexOf(a) >= 0 ? a : 'slate';

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          d.classList.add('reveal-on');
        }

        try {
          var cur = location.pathname.match(/^\/(zh|en)\//);
          if (cur) localStorage.setItem('spc-lang', cur[1]);
        } catch (e) {}
      })();
```

注意判定用的是 `=== '0'` 而非 `!== '1'` —— 键不存在（首访）时应当**记住**用户的显式切换，只有明确关掉才忽略。

同理，`LangDispatch.astro` 里读 `spc-lang` 那段前面加一道：

```js
        var remember = null;
        try { remember = localStorage.getItem('spc-remember-lang'); } catch (e) {}
        var stored = null;
        if (remember !== '0') { try { stored = localStorage.getItem('spc-lang'); } catch (e) {} }
```

- [ ] **Step 8: 让 theme.js 走 patchSettings 而不是自己写 localStorage**

Task 4 的 `theme.js` 里 `persist()` 自己写了 localStorage，现在镜像归 `settings-store` 统管。

**同时把 `theme.js` 里那个动态 import 改回字面量**：

```js
    const mod = await import('./settings-store.js');
```

把 `const settingsStorePath = ...` 那行、`/* @vite-ignore */` 以及解释这套权宜之计的整段注释一并删掉。它们是 Task 4 的临时措施 —— 当时 `settings-store.js` 还不存在，字面量路径在 `astro build` 会 UNRESOLVED_IMPORT、在 vitest 的 jsdom environment 下即便加了 `@vite-ignore` 也会 transform 失败，所以只能用变量绕开两边的静态分析。现在文件有了，静态解析能成功，改回字面量才能恢复静态检查 —— 否则以后把路径写错不会有任何人告诉你。

改完必须跑三样确认都通过：`npx vitest run tests/boot.test.js`（jsdom 环境，Task 4 踩坑的那条）、`npm test`、`npm run build`。

把 `persist` 整个替换为：

```js
// 唯一写入口是 patchSettings，镜像同步在它内部完成 —— 别在这里直接写 localStorage
async function persist(patch) {
  try {
    const mod = await import('./settings-store.js');
    await mod.patchSettings({
      ...(patch.theme ? { darkTheme: patch.theme === 'dark', rememberDarkMode: true } : {}),
      ...(patch.accent ? { theme: patch.accent, rememberTheme: true } : {}),
    });
  } catch (err) {
    console.warn('[theme] 持久化失败，本次切换仅本页有效', err);
  }
}
```

用户手点切换即视为「要记住」，所以顺带把对应的 `remember*` 置 true。

- [ ] **Step 9: 跑测试确认通过**

Run: `npx vitest run tests/settings-schema.test.js tests/settings-store.test.js`
Expected: PASS，全部通过

「沿用现有 schema」那条最关键 —— 它一红就说明会弄丢现有用户的收藏，**不许改测试去迁就实现**。

Run: `npm run build`
Expected: 成功

- [ ] **Step 10: 人工验收 —— 真实浏览器里验「老用户数据不丢」**

这是整次迁移唯一**不可逆**的风险点：线上用户浏览器里已经存着收藏和关注关键词，读错或写坏就没了。所以这一步不能只跑单测，必须在真实 IndexedDB 上验。

**不要**为了造历史数据去 `git checkout main` —— 那需要把整套 Vue 工具链 `npm ci` 装回来，还得先清干净工作树，代价大且有风险。直接**按旧格式播种**更快、可重复、可回滚，而且能造出真实点击造不出的迁移场景（比如已废弃的 `theme: 'green'`）。

打开 `npm run dev` 的页面，在 DevTools Console 里跑这段：

```js
// 完全复刻旧站 SettingsService 的写入形状：
// 库 spc-settings / store config（keyPath: 'key'）/ 版本 1 / 两个 key: app 与 favorites
await new Promise((resolve, reject) => {
  const req = indexedDB.open('spc-settings', 1);
  req.onupgradeneeded = () => {
    const db = req.result;
    if (!db.objectStoreNames.contains('config')) {
      db.createObjectStore('config', { keyPath: 'key' });
    }
  };
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction('config', 'readwrite');
    const store = tx.objectStore('config');
    store.put({ key: 'app', value: {
      theme: 'green',        // 旧 PrimeVue 预设名，不在新的四个 slug 里 → 应迁成 slate
      language: 'zh',
      darkTheme: true,
      rememberLanguage: true,
      rememberDarkMode: true,
      rememberTheme: true,
      showStatusDots: true,
      llmEndpoint: 'https://api.example.com/v1/chat/completions', // 死字段 → 应被删掉
      llmApiKey: 'sk-must-be-removed',                            // 死字段 → 应被删掉
      keywords: ['fuzzing', 'C++'],  // C++ 顺带验高亮的正则转义
    }});
    store.put({ key: 'favorites', value: [1, 42, 7] });  // 顺序有意义，不该被排序
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => reject(tx.error);
  };
  req.onerror = () => reject(req.error);
});
console.log('已播种旧格式数据');
```

然后刷新页面，逐项确认（用 Console 读回，不要只看 DevTools 面板的缓存视图）：

```js
const read = (key) => new Promise((res, rej) => {
  const req = indexedDB.open('spc-settings', 1);
  req.onsuccess = () => {
    const db = req.result;
    const r = db.transaction('config').objectStore('config').get(key);
    r.onsuccess = () => { db.close(); res(r.result?.value); };
    r.onerror = () => rej(r.error);
  };
});
console.table({
  favorites: JSON.stringify(await read('favorites')),
  app: JSON.stringify(await read('app')),
});
```

必须全部成立：

1. **`favorites` 仍是 `[1, 42, 7]`，顺序不变** —— 这是最要紧的一条。顺序反映用户添加的先后，不该被排序。
2. **`keywords` 仍是 `['fuzzing', 'C++']`** —— 一个字符都不能少，`C++` 不能被转义污染。
3. `theme` 从 `'green'` 迁成 `'slate'`（旧预设名不在新 slug 列表里）。
4. **`llmEndpoint` 与 `llmApiKey` 这两个 key 已不存在**（不是空字符串，是键本身消失）。
5. `showStatusDots` / `darkTheme` / 三个 `remember*` 的布尔值原样保留。
6. 库版本仍是 **1**，store 仍只有 `config`，key 仍只有 `app` 与 `favorites` —— 一个都不多。
7. Application → Local Storage 里出现 6 个 `spc-*` 镜像键，且 `spc-accent` 是 `slate`、`spc-theme` 是 `dark`（因为播种时 `darkTheme: true` 且 `rememberDarkMode: true`）。
8. 页面确实以深色 + 深石青强调色渲染 —— 说明镜像被预绘制脚本读到了。

（第 3、4、7、8 项依赖 `hydrateSettings()` —— 老用户浏览器里只有 IndexedDB 没有 localStorage 镜像，`initTheme()` 会在加载后调用一次水合，把迁移结果写回并填充镜像。**升级后的第一次加载会看到一次主题跳变**：预绘制时镜像还是空的、只能跟随系统，水合完成后才切到用户存的深色。这是有意接受的代价 —— 一次跳变换回用户的偏好，好过静默丢掉它。第二次加载起镜像已就位，不再跳。）

再验降级：

9. 开一个**无痕窗口**访问，切主题、点收藏都不报错（Console 零红字），行为正常，只是关窗后不保留。
10. 在 Console 里执行 `Object.defineProperty(window, 'indexedDB', { get: () => undefined })` 后刷新（或用禁用存储的浏览器配置），确认页面照常工作、`isPersistent()` 返回 `false`、且有降级提示。

把第 1–8 项的 `console.table` 实际输出、以及第 9–10 项的观察结果原样贴进报告。**任何一项对不上就停下来上报，不要自行调整迁移逻辑去迎合** —— 这里的正确答案是「保住用户数据」，不是「让检查通过」。

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(settings): 设置 schema 迁移与双层存储

IndexedDB（spc-settings/config/app+favorites，版本 1）一字不改地沿用现有 schema，
并加自动化测试守住 —— 现有用户的收藏与关键词在里面，改一个字就丢数据。
localStorage 镜像 6 个键，存在的唯一理由是预绘制脚本必须同步读取；
IndexedDB 是异步的，等它返回时首屏已画完，会闪一下默认主题。
patchSettings 是唯一写入口，镜像同步在其内部完成。
每个导出函数永不 reject：隐私模式下退成会话内存 + localStorage，
调用方不必为此写错误处理。
migrateSettings 输出的键集合恒等于默认值，多余字段一律丢弃 ——
否则 llmEndpoint 这类遗留字段会永远躺在用户库里。
theme 字段语义从 PrimeVue 预设名改为强调色 slug，认不出的值回落 slate
（旧值恰好是 indigo 的平滑保留）。"
```

---

### Task 11: papers.js 纯数据核心

**Files:**
- Create: `src/lib/cdn.js`（从 `src/service/cdn.js` 搬来并扩展）
- Create: `src/lib/papers.js`
- Create: `tests/papers.test.js`
- Delete: `src/service/cdn.js`

**Interfaces:**
- Consumes: 无
- Produces:
  - `CDN_DATA_BASE: string`、`DATA_BASE: string`
  - `applyFilters(rows, criteria) => Row[]`，`criteria = { query?, publications?, years?, favoritesOnly?, favorites? }`
  - `sortRows(rows, key, dir) => Row[]`，`key ∈ {'id','year','title','publication'}`，`dir ∈ {'asc','desc'}`
  - `paginate(rows, page, size) => { rows, page, pageCount, total, from, to }`
  - `loadPapers(fetchImpl?) => Promise<Row[]>`
  - `Row = { id, year, title, category, publication, paper, status }`

这是重写 DataTable 时最容易出错的一块 —— 筛选取交集、分页边界、收藏过滤三者叠加。全部做成纯函数，脱离浏览器单测。

- [ ] **Step 1: 写失败的测试**

```js
// tests/papers.test.js
import { describe, it, expect } from 'vitest';
import { applyFilters, sortRows, paginate, loadPapers } from '@/lib/papers.js';

const ROWS = [
  { id: 1, year: 2026, title: 'Bridge: High-Order Taint Detection', publication: 'IEEE S&P' },
  { id: 2, year: 2026, title: 'Camveil: Coordinated Fuzzing', publication: 'IEEE S&P' },
  { id: 3, year: 2025, title: 'Directed Greybox Fuzzing', publication: 'ACM CCS' },
  { id: 4, year: 2025, title: 'Formal Verification of TLS', publication: 'NDSS' },
  { id: 5, year: 2024, title: 'A Study of C++ Templates', publication: 'ACM CCS' },
];

describe('applyFilters', () => {
  it('无条件时原样返回', () => {
    expect(applyFilters(ROWS, {})).toHaveLength(5);
    expect(applyFilters(ROWS, undefined)).toHaveLength(5);
  });

  it('标题子串匹配，大小写不敏感', () => {
    expect(applyFilters(ROWS, { query: 'fuzz' }).map((r) => r.id)).toEqual([2, 3]);
    expect(applyFilters(ROWS, { query: 'FUZZ' }).map((r) => r.id)).toEqual([2, 3]);
  });

  it('查询词首尾空白被忽略', () => {
    expect(applyFilters(ROWS, { query: '  fuzz  ' }).map((r) => r.id)).toEqual([2, 3]);
  });

  it('纯空白查询等于无查询', () => {
    expect(applyFilters(ROWS, { query: '   ' })).toHaveLength(5);
  });

  it('查询词含正则特殊字符时按字面匹配，不炸也不误匹配', () => {
    expect(applyFilters(ROWS, { query: 'C++' }).map((r) => r.id)).toEqual([5]);
    expect(() => applyFilters(ROWS, { query: '(' })).not.toThrow();
    expect(applyFilters(ROWS, { query: '(' })).toEqual([]);
  });

  it('会议多选取并集', () => {
    expect(applyFilters(ROWS, { publications: ['ACM CCS'] }).map((r) => r.id)).toEqual([3, 5]);
    expect(applyFilters(ROWS, { publications: ['ACM CCS', 'NDSS'] }).map((r) => r.id)).toEqual([3, 4, 5]);
  });

  it('年份多选取并集，字符串与数字都认', () => {
    expect(applyFilters(ROWS, { years: [2025] }).map((r) => r.id)).toEqual([3, 4]);
    expect(applyFilters(ROWS, { years: ['2025'] }).map((r) => r.id)).toEqual([3, 4]);
  });

  it('多个维度之间取交集', () => {
    const out = applyFilters(ROWS, { query: 'fuzz', publications: ['ACM CCS'] });
    expect(out.map((r) => r.id)).toEqual([3]);
  });

  it('空数组视为「不筛这一维」而非「筛掉全部」', () => {
    expect(applyFilters(ROWS, { publications: [], years: [] })).toHaveLength(5);
  });

  it('仅看收藏', () => {
    const favorites = new Set([2, 5]);
    expect(applyFilters(ROWS, { favoritesOnly: true, favorites }).map((r) => r.id)).toEqual([2, 5]);
  });

  it('仅看收藏但收藏为空时返回空', () => {
    expect(applyFilters(ROWS, { favoritesOnly: true, favorites: new Set() })).toEqual([]);
  });

  it('仅看收藏但没传 favorites 时返回空，而不是崩', () => {
    expect(applyFilters(ROWS, { favoritesOnly: true })).toEqual([]);
  });

  it('收藏与其他维度叠加', () => {
    const favorites = new Set([2, 3, 5]);
    const out = applyFilters(ROWS, { favoritesOnly: true, favorites, query: 'fuzz' });
    expect(out.map((r) => r.id)).toEqual([2, 3]);
  });

  it('不修改传入的数组', () => {
    const copy = [...ROWS];
    applyFilters(ROWS, { query: 'fuzz' });
    expect(ROWS).toEqual(copy);
  });
});

describe('sortRows', () => {
  it('按年份降序，同年按 id 升序', () => {
    expect(sortRows(ROWS, 'year', 'desc').map((r) => r.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('按年份升序', () => {
    expect(sortRows(ROWS, 'year', 'asc').map((r) => r.id)).toEqual([5, 3, 4, 1, 2]);
  });

  it('按标题字母序', () => {
    expect(sortRows(ROWS, 'title', 'asc')[0].title).toBe('A Study of C++ Templates');
  });

  it('按会议名排序，同会议按 id 升序', () => {
    expect(sortRows(ROWS, 'publication', 'asc').map((r) => r.id)).toEqual([3, 5, 1, 2, 4]);
  });

  it('不认识的 key 原样返回顺序（不偷偷按 id 排）', () => {
    // 必须用打乱过的输入。ROWS 本身就是 id 升序，拿它来断言的话，
    //「原样返回」与「回落到按 id 排序」两种实现都会绿 —— 这条就区分不了它们。
    const shuffled = [ROWS[3], ROWS[0], ROWS[4], ROWS[1], ROWS[2]]; // ids: 4,1,5,2,3
    expect(sortRows(shuffled, 'nope', 'asc').map((r) => r.id)).toEqual([4, 1, 5, 2, 3]);
  });

  it('返回新数组，不原地改', () => {
    const out = sortRows(ROWS, 'year', 'asc');
    expect(out).not.toBe(ROWS);
    expect(ROWS[0].id).toBe(1);
  });
});

describe('paginate', () => {
  it('常规分页', () => {
    const p = paginate(ROWS, 1, 2);
    expect(p.rows.map((r) => r.id)).toEqual([1, 2]);
    expect(p).toMatchObject({ page: 1, pageCount: 3, total: 5, from: 1, to: 2 });
  });

  it('末页不足一页时 to 收到总数', () => {
    const p = paginate(ROWS, 3, 2);
    expect(p.rows.map((r) => r.id)).toEqual([5]);
    expect(p).toMatchObject({ page: 3, from: 5, to: 5 });
  });

  it('页码超出上界时夹到末页', () => {
    expect(paginate(ROWS, 99, 2)).toMatchObject({ page: 3, from: 5, to: 5 });
  });

  it('页码为 0 或负数时夹到第 1 页', () => {
    expect(paginate(ROWS, 0, 2).page).toBe(1);
    expect(paginate(ROWS, -5, 2).page).toBe(1);
  });

  it('空数据：pageCount 至少 1，from/to 为 0，不出现「显示第 1 到 0 条」之外的怪值', () => {
    const p = paginate([], 1, 15);
    expect(p).toEqual({ rows: [], page: 1, pageCount: 1, total: 0, from: 0, to: 0 });
  });

  it('每页容量大于总数时一页装完', () => {
    expect(paginate(ROWS, 1, 100)).toMatchObject({ pageCount: 1, from: 1, to: 5 });
  });

  it('每页容量非法时兜底为 15 而不是除零', () => {
    expect(paginate(ROWS, 1, 0).pageCount).toBe(1);
    expect(paginate(ROWS, 1, 0).rows).toHaveLength(5);
  });
});

describe('loadPapers', () => {
  it('成功时返回解析后的数组', async () => {
    const fake = async () => ({ ok: true, status: 200, json: async () => ROWS });
    await expect(loadPapers(fake)).resolves.toHaveLength(5);
  });

  it('HTTP 错误时抛出带状态码的错误', async () => {
    const fake = async () => ({ ok: false, status: 503, json: async () => ({}) });
    await expect(loadPapers(fake)).rejects.toThrow(/503/);
  });

  it('网络异常原样冒泡，交给调用方降级', async () => {
    const fake = async () => {
      throw new TypeError('Failed to fetch');
    };
    await expect(loadPapers(fake)).rejects.toThrow(/Failed to fetch/);
  });

  it('返回非数组时抛错，避免下游拿到对象当数组用', async () => {
    const fake = async () => ({ ok: true, status: 200, json: async () => ({ oops: 1 }) });
    await expect(loadPapers(fake)).rejects.toThrow(/not an array/i);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/papers.test.js`
Expected: FAIL，`Cannot find module '@/lib/papers.js'`

- [ ] **Step 3: 实现 src/lib/cdn.js**

先看一眼旧文件里的实际值再写：`cat src/service/cdn.js`。

```js
export const CDN_DATA_BASE = 'https://cdn.c01dkit.com/sec-papers';

/**
 * 运行时数据基址 —— 全站唯一的 DEV/PROD 判断点。
 * DEV 下的 /data/** 由 astro.config.mjs 的开发中间件映射到 src/assets/data/**。
 * 旧代码里 Search.vue 用 import.meta.env.PROD、ViewAbstract.vue 用 process.env.NODE_ENV
 * 且硬编码了 /src/assets/... 路径，两处分叉制造过多次「开发环境加载失败」的 bug。
 */
export const DATA_BASE = import.meta.env.DEV ? '/data' : CDN_DATA_BASE;
```

```bash
git rm -f src/service/cdn.js
```

- [ ] **Step 4: 实现 src/lib/papers.js**

标题匹配用 `String.includes` 而非正则 —— 用户可能输入 `C++` 或 `(`，正则会误匹配或直接抛错。

```js
import { DATA_BASE } from './cdn.js';

const DEFAULT_PAGE_SIZE = 15;

export function applyFilters(rows, criteria) {
  const c = criteria || {};
  const query = String(c.query || '').trim().toLowerCase();
  // 空数组表示「这一维不筛」，不是「筛掉全部」
  const pubSet = c.publications && c.publications.length ? new Set(c.publications) : null;
  const yearSet = c.years && c.years.length ? new Set(c.years.map(Number)) : null;
  const favoritesOnly = Boolean(c.favoritesOnly);
  const favorites = c.favorites instanceof Set ? c.favorites : null;

  return rows.filter((row) => {
    // 用 includes 而非正则：用户可能输入 C++ 或 ( ，正则会误匹配甚至抛错
    if (query && !String(row.title).toLowerCase().includes(query)) return false;
    if (pubSet && !pubSet.has(row.publication)) return false;
    if (yearSet && !yearSet.has(Number(row.year))) return false;
    if (favoritesOnly && !(favorites && favorites.has(row.id))) return false;
    return true;
  });
}

// 只定义主键比较；二级键（id 升序）在 sortRows 里恒定附加。
// 别把二级键写进这里再对整体 reverse() —— 那会把「同年按 id 升序」也翻过来，
// 降序时 [1,2,3,4,5] 会变成 [2,1,4,3,5]，与预期不符。
const PRIMARY = {
  id: (a, b) => a.id - b.id,
  year: (a, b) => a.year - b.year,
  title: (a, b) => String(a.title).localeCompare(String(b.title)),
  publication: (a, b) => String(a.publication).localeCompare(String(b.publication)),
};

export function sortRows(rows, key, dir = 'asc') {
  const primary = PRIMARY[key];
  if (!primary) return [...rows];
  const sign = dir === 'desc' ? -1 : 1;
  // 方向只作用于主键；主键相等时恒按 id 升序
  return [...rows].sort((a, b) => sign * primary(a, b) || a.id - b.id);
}

export function paginate(rows, page, size) {
  const perPage = Number(size) > 0 ? Number(size) : DEFAULT_PAGE_SIZE;
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Number(page) || 1), pageCount);
  const start = (current - 1) * perPage;
  const slice = rows.slice(start, start + perPage);

  return {
    rows: slice,
    page: current,
    pageCount,
    total,
    from: total ? start + 1 : 0,
    to: total ? start + slice.length : 0,
  };
}

export async function loadPapers(fetchImpl) {
  const doFetch = fetchImpl || globalThis.fetch;
  const res = await doFetch(`${DATA_BASE}/data.json`);
  if (!res.ok) throw new Error(`data.json HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('data.json payload is not an array');
  return data;
}
```

排序方向的那个细节值得验算一遍，它是本任务最容易写错的地方。`ROWS` 按年份升序是 `[5,3,4,1,2]`（2024 的 5，2025 的 3、4，2026 的 1、2）。如果实现成「把二级键写进比较器再对整体 `reverse()`」，降序会得到 `[2,1,4,3,5]` —— 同年内的 id 顺序也被翻了，而测试期望的是 `[1,2,3,4,5]`。所以方向必须只乘在主键上。

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run tests/papers.test.js`
Expected: PASS，全部通过

特别确认这三条：`空数组视为「不筛这一维」`、`空数据 from/to 为 0`、`按年份降序同年按 id 升序`。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(papers): 论文筛选/排序/分页纯数据核心

替代 PrimeVue DataTable 的「脑子」，做成纯函数以脱离浏览器单测 ——
筛选取交集、分页边界、收藏叠加三者是重写里最容易出错的地方。
标题匹配用 String.includes 而非正则：用户可能输入 C++ 或 ( ，
正则会误匹配甚至直接抛错。
排序方向只作用于主键，同主键恒按 id 升序，否则降序会把同年论文顺序也翻过来。
空筛选数组表示「这一维不筛」而非「筛掉全部」。
loadPapers 接受注入的 fetch 以便测试，并校验返回是数组。
src/service/cdn.js 迁至 src/lib/cdn.js，成为全站唯一的 DEV/PROD 判断点。"
```

---

### Task 12: highlight.js 移植

**Files:**
- Create: `src/lib/highlight.js`
- Create: `tests/highlight.test.js`
- Delete: `src/composables/useHighlight.js`

**Interfaces:**
- Consumes: 无
- Produces: `highlightSegments(text, patterns) => Array<{text: string, hit: boolean, cls: string}>`

原实现（`src/composables/useHighlight.js`）从 `getRuntimeSettings()` 拿全局关键词，这个隐式依赖让它没法单测。移植时改成**显式传入 patterns**，调用方自己从 `settings-store` 取。

- [ ] **Step 1: 写失败的测试**

```js
// tests/highlight.test.js
import { describe, it, expect } from 'vitest';
import { highlightSegments } from '@/lib/highlight.js';

const text = (segs) => segs.map((s) => s.text).join('');
const hits = (segs) => segs.filter((s) => s.hit).map((s) => s.text);

describe('highlightSegments', () => {
  it('没有 pattern 时整段返回，标记为未命中', () => {
    const segs = highlightSegments('Hello world', []);
    expect(segs).toEqual([{ text: 'Hello world', hit: false, cls: '' }]);
  });

  it('切段后拼回原文，一个字符不多不少', () => {
    const segs = highlightSegments('a fuzz b fuzz c', [{ text: 'fuzz' }]);
    expect(text(segs)).toBe('a fuzz b fuzz c');
    // 两半都得断言：只验「拼回原文」的话，一个永不切段的实现也会绿。
    // 这条守的是「切归切，字符不许变」，缺了下面这句就只剩后半句。
    expect(segs.length).toBeGreaterThan(1);
  });

  it('命中多处', () => {
    expect(hits(highlightSegments('fuzz and fuzz', [{ text: 'fuzz' }]))).toEqual(['fuzz', 'fuzz']);
  });

  it('大小写不敏感，但保留原文大小写', () => {
    expect(hits(highlightSegments('Fuzzing FUZZ fuzz', [{ text: 'fuzz' }]))).toEqual(['Fuzz', 'FUZZ', 'fuzz']);
  });

  it('长 pattern 优先于短 pattern', () => {
    const segs = highlightSegments('a fuzzing tool here', [{ text: 'fuzz' }, { text: 'fuzzing tool' }]);
    expect(hits(segs)).toEqual(['fuzzing tool']);
  });

  it('关键词含正则特殊字符时按字面匹配，不抛错', () => {
    for (const k of ['C++', '(', ')', '[', ']', '\\', '.*', '$^', 'a|b', '?']) {
      expect(() => highlightSegments(`x ${k} y`, [{ text: k }]), k).not.toThrow();
      expect(hits(highlightSegments(`x ${k} y`, [{ text: k }])), k).toEqual([k]);
    }
  });

  it('C++ 不会被当成「C 后面跟一个或多个 +」', () => {
    expect(hits(highlightSegments('C++ and C', [{ text: 'C++' }]))).toEqual(['C++']);
  });

  it('每个 pattern 可带自己的 cls', () => {
    const segs = highlightSegments('search term here', [
      { text: 'search', cls: 'q' },
      { text: 'term', cls: 'kw' },
    ]);
    expect(segs.find((s) => s.text === 'search').cls).toBe('q');
    expect(segs.find((s) => s.text === 'term').cls).toBe('kw');
  });

  it('未指定 cls 时给默认值 hl', () => {
    const segs = highlightSegments('abc', [{ text: 'b' }]);
    expect(segs.find((s) => s.hit).cls).toBe('hl');
  });

  it('空文本与空值安全', () => {
    expect(highlightSegments('', [{ text: 'x' }])).toEqual([{ text: '', hit: false, cls: '' }]);
    expect(highlightSegments(null, [{ text: 'x' }])).toEqual([{ text: '', hit: false, cls: '' }]);
    expect(highlightSegments(undefined, undefined)).toEqual([{ text: '', hit: false, cls: '' }]);
  });

  it('pattern 里的空字符串被忽略，不产生零宽死循环', () => {
    const segs = highlightSegments('abc', [{ text: '' }, { text: null }, { text: 'b' }]);
    expect(text(segs)).toBe('abc');
    expect(hits(segs)).toEqual(['b']);
  });

  it('整段命中时不产生空的前后段', () => {
    const segs = highlightSegments('fuzz', [{ text: 'fuzz' }]);
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ text: 'fuzz', hit: true, cls: 'hl' });
  });

  it('相邻命中之间不插入空段', () => {
    const segs = highlightSegments('ab', [{ text: 'a' }, { text: 'b' }]);
    expect(segs.every((s) => s.text.length > 0)).toBe(true);
    expect(text(segs)).toBe('ab');
    // 同上：不切段的实现同样「没有空段」。断言它确实切成了两段，
    // 这条才不必依赖别的用例存在才有意义。
    expect(segs).toHaveLength(2);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run tests/highlight.test.js`
Expected: FAIL，`Cannot find module '@/lib/highlight.js'`

- [ ] **Step 3: 实现 src/lib/highlight.js**

```js
const RE_SPECIAL = /[.*+?^${}()|[\]\\]/g;

/**
 * 把文本按 patterns 切成命中/未命中的片段。
 * 纯函数、不读全局状态 —— 原 useHighlight 从 getRuntimeSettings() 隐式取关键词，
 * 那个依赖让它没法单测。调用方自己把关键词传进来。
 *
 * @param {string} text
 * @param {Array<{text: string, cls?: string}>} patterns
 * @returns {Array<{text: string, hit: boolean, cls: string}>}
 */
export function highlightSegments(text, patterns) {
  const src = text == null ? '' : String(text);
  const list = (patterns || []).filter((p) => p && p.text != null && String(p.text) !== '');

  if (!src || !list.length) return [{ text: src, hit: false, cls: '' }];

  // 长的排前面，让 "fuzzing tool" 抢在 "fuzz" 之前匹配
  const sorted = [...list].sort((a, b) => String(b.text).length - String(a.text).length);
  const source = sorted.map((p) => String(p.text).replace(RE_SPECIAL, '\\$&')).join('|');
  const re = new RegExp(`(${source})`, 'gi');

  const segments = [];
  let last = 0;
  let m;

  while ((m = re.exec(src)) !== null) {
    if (m.index > last) segments.push({ text: src.slice(last, m.index), hit: false, cls: '' });

    // 按长度与内容找回是哪个 pattern 命中的，取它的 cls
    const lower = m[0].toLowerCase();
    const owner = sorted.find(
      (p) => String(p.text).length === m[0].length && String(p.text).toLowerCase() === lower
    );
    segments.push({ text: m[0], hit: true, cls: owner?.cls || 'hl' });

    last = re.lastIndex;
  }

  if (last < src.length) segments.push({ text: src.slice(last), hit: false, cls: '' });

  return segments.length ? segments : [{ text: src, hit: false, cls: '' }];
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run tests/highlight.test.js`
Expected: PASS，全部通过

`C++ 不会被当成「C 后面跟一个或多个 +」` 这条是重点 —— 原实现虽然做了转义，但从没被测过；关键词是用户自由输入的，这个路径必须有测试压住。

- [ ] **Step 5: 删掉旧 composable**

```bash
git rm -f src/composables/useHighlight.js src/composables/useI18n.js
rmdir src/composables 2>/dev/null || true
```

`useI18n.js` 里只有 `usePageTitle`，路由分语言后标题由各页面 frontmatter 直接传给 `BaseLayout`，不再需要。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(highlight): 关键词切段移植为纯函数

原 useHighlight 从 getRuntimeSettings() 隐式取关键词，这个全局依赖让它没法单测；
改成显式传入 patterns，调用方自己从 settings-store 取。
补上原实现从未覆盖的路径：关键词含正则特殊字符（C++、括号、反斜杠、.* 等）
必须按字面匹配 —— 关键词是用户自由输入的。
同时保证切段拼回原文一字不差、不产生空段、长 pattern 优先。"
```

---

### Task 13: 检索页

**Files:**
- Create: `src/pages/[lang]/search.astro`
- Create: `src/components/PaperRow.astro`
- Create: `src/components/FilterDropdown.astro`
- Create: `src/scripts/paper-table.js`
- Modify: `src/scripts/boot.js`
- Modify: `src/i18n/zh.json`、`src/i18n/en.json`

**Interfaces:**
- Consumes: `applyFilters` / `sortRows` / `paginate` / `loadPapers`（Task 11）、`highlightSegments`（Task 12）、`getFavorites` / `toggleFavorite` / `isPersistent`（Task 10）
- Produces: `initPaperTable() => Promise<void>`（幂等）

**设计要点**

- 首屏 30 行**在构建时预渲染进 HTML**：CDN 挂掉或 JS 未就绪时页面仍有真内容，绝不出现空表格。同一批 30 条记录另以内嵌 `<script type="application/json">` 完整带上，作为 CDN 失败后仍可筛选/排序/分页的数据源 —— **不要**从表格 DOM 反推数据（会丢字段、要从文本 parse 数字、且与列结构紧耦合）。
- 多选筛选器用原生 `<details>` 做开合 —— 无障碍、零 JS、跟发丝线风格天然契合，不需要自己写 popover 的焦点管理。
- 全量数据到达后整表由 JS 重渲染；渲染函数只有一个，预渲染的 30 行和后续渲染共用同一套 markup 结构。

- [ ] **Step 1: 追加文案**

现有 `search.*` 已有大部分 key，补下面这些（两语）。

**注意 `anyPublication` 与 `anyYear` 早已存在**（值分别是「任意会议 / 任意年份」与
「Any Publication / Any Year」），不在下面的清单里 —— 别去覆盖它们，现有文案没问题。

```json
// zh.json search 内追加
"loading": "正在加载全部论文…",
"loadFailed": "无法加载完整论文列表（可能是网络或 CDN 问题）。当前显示的是最新 30 篇。",
"retry": "重试",
"lead": "检索历年安全顶会论文：按会议与年份筛选，按标题搜索，收藏感兴趣的条目。",
"previewNote": "预览：最新 __N__ 篇，完整列表加载中…",
"previewOffline": "离线预览：__N__ 篇（完整列表暂不可用）",
"favoritesOnly": "仅看收藏",
"selected": "已选 {count}",
"perPage": "每页",
"prevPage": "上一页",
"nextPage": "下一页",
"pageOf": "第 {page} / {pageCount} 页",
"notPersistent": "浏览器限制了本地存储，本次收藏关闭页面后不会保留。",
"openPaper": "打开论文",
"toggleFavorite": "收藏 / 取消收藏"
```

```json
// en.json search 内追加
"loading": "Loading all papers…",
"loadFailed": "Could not load the full paper list (network or CDN issue). Showing the 30 most recent.",
"retry": "Retry",
"lead": "Search accepted papers from top security venues — filter by venue and year, search titles, and star the ones worth keeping.",
"previewNote": "Preview: __N__ most recent, loading the full list…",
"previewOffline": "Offline preview: __N__ papers (full list unavailable)",
"favoritesOnly": "Favorites only",
"selected": "{count} selected",
"perPage": "Per page",
"prevPage": "Previous",
"nextPage": "Next",
"pageOf": "Page {page} of {pageCount}",
"notPersistent": "Your browser is blocking local storage, so favorites will not survive closing this page.",
"openPaper": "Open paper",
"toggleFavorite": "Toggle favorite"
```

- [ ] **Step 2: 实现 FilterDropdown（原生 details 多选）**

```astro
---
const { id, label, options, placeholder } = Astro.props;
---

<details class="fd" id={id}>
  <summary>
    <span class="fd-label">{label}</span>
    <span class="fd-value" data-fd-value>{placeholder}</span>
    <span class="fd-caret" aria-hidden="true">▾</span>
  </summary>
  <div class="fd-menu" role="group" aria-label={label}>
    {options.map((o) => (
      <label class="fd-opt">
        <input type="checkbox" value={String(o.value)} />
        <span>{o.label}</span>
        {o.count != null && <em>{o.count}</em>}
      </label>
    ))}
  </div>
</details>

<style>
  .fd { position: relative; }
  summary {
    display: flex; align-items: baseline; gap: 0.4rem; cursor: pointer;
    list-style: none; padding: 0.4rem 0.6rem;
    border: 1px solid var(--hairline); border-radius: var(--radius);
    font-size: var(--fs-small); white-space: nowrap;
  }
  summary::-webkit-details-marker { display: none; }
  summary:hover { border-color: var(--ink); }
  .fd-label { color: var(--faint); font-size: var(--fs-kicker); }
  .fd-value { color: var(--ink); }
  .fd-caret { color: var(--faint); font-size: 0.6rem; }

  .fd-menu {
    position: absolute; z-index: 10; left: 0; top: calc(100% + 0.35rem);
    min-width: 12rem; max-height: 17rem; overflow-y: auto;
    background: var(--panel); border: 1px solid var(--hairline); border-radius: var(--radius);
    padding: 0.3rem 0;
  }
  .fd-opt {
    display: flex; align-items: center; gap: 0.5rem;
    padding: 0.3rem 0.7rem; font-size: var(--fs-small); cursor: pointer;
  }
  .fd-opt:hover { background: var(--band); }
  .fd-opt em { margin-left: auto; color: var(--faint); font-style: normal; font-size: var(--fs-kicker); }
  .fd-opt input { accent-color: var(--accent); }
</style>
```

- [ ] **Step 3: 实现 PaperRow（预渲染与 JS 渲染共用的行结构）**

```astro
---
import { t } from '@/i18n/index.js';
const { lang, row } = Astro.props;
const hasLink = row.paper && row.paper !== '#';
---

<tr data-id={row.id}>
  <td class="c-id">{row.id}</td>
  <td class="c-pub">{row.publication}</td>
  <td class="c-year">{row.year}</td>
  <td class="c-title"><span data-title>{row.title}</span></td>
  <td class="c-act">
    {hasLink ? (
      <a href={row.paper} target="_blank" rel="noopener" title={t(lang, 'search.openPaper')} aria-label={t(lang, 'search.openPaper')}>↗</a>
    ) : (
      <span class="off" aria-hidden="true">↗</span>
    )}
    <button type="button" data-fav={row.id} title={t(lang, 'search.toggleFavorite')}
            aria-pressed="false" aria-label={t(lang, 'search.toggleFavorite')}>☆</button>
  </td>
</tr>
```

- [ ] **Step 4: 实现检索页**

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import FilterDropdown from '@/components/FilterDropdown.astro';
import PaperRow from '@/components/PaperRow.astro';
import { LOCALES, t } from '@/i18n/index.js';
import stats from '@/assets/data/data-statistics.json';
import quickView from '@/assets/data/data-quick-view.json';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

const { lang } = Astro.params;

// 预渲染最新 30 条：按年份降序、同年按 id 升序（spec §8）
// 论文标题是从会议网站抓来的。set:html 不做转义，标题里只要出现 </script>
// 就能提前闭合这个标签，其后的内容会被当页面 HTML 解析。当前 15,600 条里没有
// 这种标题，但数据每次抓取都会变，不能指望它一直没有。
const safeJson = (v) => JSON.stringify(v).replaceAll('<', '\\u003c');

const seed = [...quickView].sort((a, b) => b.year - a.year || a.id - b.id).slice(0, 30);
// 预渲染只铺第一页。铺满 30 行的话，JS 一接管就立刻换成 15 行的分页结果，
// 用户在最常访问的页面上看到一次明显的内容跳动，另有约 2.5 KB HTML 白发一遍。
// #ptSeed 仍内嵌全部 30 条 —— 那是 CDN 失败时的兜底数据集，越多越有得筛。
const prerender = seed.slice(0, 15);   // 与 initialState().perPage 一致

// #ptSeed 内嵌了预渲染那 30 行的完整数据：CDN 拉不到 data.json 时，脚本以此为
// 数据源继续提供筛选/排序/分页。用内嵌 JSON 而不是从表格 DOM 反推 —— 无损、
// 不依赖表格列结构，以后改表格不会默默失效。约 5KB 未压缩。
// #ptI18n 内嵌本地化字符串，免得在 JS 里重建一套 i18n。
// （这两段说明放 frontmatter：模板里的 HTML 注释会被 Astro 原样输出到产物。）
const publications = Object.entries(stats.byPublication)
  .sort((a, b) => b[1] - a[1])
  .map(([name, count]) => ({ value: name, label: name, count }));

const years = Object.keys(stats.byYear)
  .sort((a, b) => Number(b) - Number(a))
  .map((y) => ({ value: y, label: y, count: stats.byYear[y] }));
---

<PageLayout lang={lang} page="search" title={t(lang, 'menu.search')}
            lead={t(lang, 'search.lead')}>

  <div class="toolbar">
    <label class="q">
      <span class="ic" aria-hidden="true">⌕</span>
      <input type="search" id="q" placeholder={t(lang, 'search.searchPlaceholder')}
             autocomplete="off" spellcheck="false" />
    </label>

    <FilterDropdown id="fPub" label={t(lang, 'search.publication')}
                    options={publications} placeholder={t(lang, 'search.anyPublication')} />
    <FilterDropdown id="fYear" label={t(lang, 'search.year')}
                    options={years} placeholder={t(lang, 'search.anyYear')} />

    <button type="button" id="favOnly" class="tgl" aria-pressed="false">
      <span aria-hidden="true">☆</span> {t(lang, 'search.favoritesOnly')}
    </button>
    <button type="button" id="clearAll" class="tgl">{t(lang, 'search.clearFilters')}</button>
  </div>

  <p class="notice" id="notice" hidden></p>

  <div class="table-scroll">
    <table class="pt">
      <thead>
        <tr>
          <th class="c-id" data-sort="id">ID</th>
          <th class="c-pub" data-sort="publication">{t(lang, 'search.publication')}</th>
          <th class="c-year" data-sort="year">{t(lang, 'search.year')}</th>
          <th class="c-title" data-sort="title">{t(lang, 'search.title')}</th>
          <th class="c-act"><span class="sr">{t(lang, 'search.paper')}</span></th>
        </tr>
      </thead>
      <tbody id="ptBody">
        {prerender.map((row) => <PaperRow lang={lang} row={row} />)}
      </tbody>
    </table>
    <p class="empty" id="ptEmpty" hidden>{t(lang, 'search.noResults')}</p>
  </div>

  <div class="pager">
    <span class="count" id="ptCount">{t(lang, 'search.previewNote').replace('__N__', String(seed.length))}</span>
    <div class="pg">
      <label class="per">
        {t(lang, 'search.perPage')}
        <select id="perPage">
          <option>15</option><option>30</option><option>50</option><option>100</option>
        </select>
      </label>
      <button type="button" id="pgPrev" disabled aria-label={t(lang, 'search.prevPage')}>‹</button>
      <span id="pgInfo"></span>
      <button type="button" id="pgNext" disabled aria-label={t(lang, 'search.nextPage')}>›</button>
    </div>
  </div>

  <script type="application/json" id="ptSeed" set:html={safeJson(seed)} />

  <script type="application/json" id="ptI18n" set:html={JSON.stringify({
    loading: t(lang, 'search.loading'),
    loadFailed: t(lang, 'search.loadFailed'),
    retry: t(lang, 'search.retry'),
    total: t(lang, 'search.totalPapers', { count: '__N__' }),
    pageOf: t(lang, 'search.pageOf', { page: '__P__', pageCount: '__C__' }),
    selected: t(lang, 'search.selected', { count: '__N__' }),
    anyPublication: t(lang, 'search.anyPublication'),
    anyYear: t(lang, 'search.anyYear'),
    copied: t(lang, 'search.copied'),
    notPersistent: t(lang, 'search.notPersistent'),
    openPaper: t(lang, 'search.openPaper'),
    toggleFavorite: t(lang, 'search.toggleFavorite'),
  })} />
</PageLayout>

<style>
  .toolbar {
    display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;
    margin-bottom: 1rem;
  }
  .q {
    display: flex; align-items: center; gap: 0.4rem; flex: 1 1 13rem;
    border: 1px solid var(--hairline); border-radius: var(--radius); padding: 0.4rem 0.6rem;
  }
  .q:focus-within { border-color: var(--ink); }
  .q .ic { color: var(--faint); }
  .q input {
    border: 0; background: none; color: var(--ink); font: inherit;
    font-size: var(--fs-small); width: 100%; outline: none;
  }
  .tgl {
    background: none; cursor: pointer; font: inherit; font-size: var(--fs-small);
    color: var(--muted); border: 1px solid var(--hairline); border-radius: var(--radius);
    padding: 0.4rem 0.7rem; white-space: nowrap;
  }
  .tgl:hover { border-color: var(--ink); color: var(--ink); }
  .tgl[aria-pressed='true'] { color: var(--accent); border-color: var(--accent); }

  .notice {
    display: flex; flex-wrap: wrap; gap: 0.6rem; align-items: center;
    border: 1px solid var(--hairline); border-left: 2px solid var(--accent);
    padding: 0.6rem 0.8rem; margin: 0 0 1rem;
    font-size: var(--fs-small); color: var(--muted);
  }
  .notice button {
    background: none; border: 1px solid var(--hairline); border-radius: var(--radius);
    padding: 0.2rem 0.6rem; cursor: pointer; font: inherit; font-size: var(--fs-kicker);
    color: var(--ink);
  }

  .table-scroll { overflow-x: auto; }
  .pt { width: 100%; border-collapse: collapse; min-width: 40rem; }
  .pt th {
    text-align: left; font-weight: 400; font-family: var(--font-sans);
    font-size: var(--fs-kicker); letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--faint); padding: 0 0.5rem 0.5rem; border-bottom: 1px solid var(--hairline);
    cursor: pointer; user-select: none; white-space: nowrap;
  }
  .pt th:hover { color: var(--ink); }
  .pt th[data-dir]::after { content: attr(data-dir); margin-left: 0.3rem; color: var(--accent); }
  .empty { padding: 2.5rem 0; text-align: center; color: var(--faint); font-size: var(--fs-small); }

  .pager {
    display: flex; flex-wrap: wrap; gap: 0.8rem; align-items: center;
    justify-content: space-between; margin-top: 1rem;
    font-size: var(--fs-kicker); color: var(--faint);
  }
  .pg { display: flex; align-items: center; gap: 0.6rem; }
  .pg button {
    background: none; border: 1px solid var(--hairline); border-radius: var(--radius);
    width: 1.7rem; height: 1.7rem; cursor: pointer; color: var(--ink);
  }
  .pg button:disabled { color: var(--hairline); cursor: default; }
  .per select {
    background: none; border: 1px solid var(--hairline); border-radius: var(--radius);
    color: var(--ink); font: inherit; font-size: var(--fs-kicker); padding: 0.15rem 0.3rem;
    margin-left: 0.3rem;
  }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>

<style is:global>
  /* 这些规则必须是 is:global。表格的行来自两个地方 —— 构建期的 PaperRow.astro，
     和运行期 paper-table.js 里的 buildRow —— 两者都拿不到 search.astro 的 scope
     属性（Astro 只给本文件模板里写出的元素加），所以写在上面那个 scoped 块里的
     行规则一条都不会生效：表头有样式、表体没有，肉眼一看就是坏的。
     选择器一律以 .pt 打头，把作用范围限制在这张表内。 */
  .pt td {
    padding: 0.45rem 0.5rem; border-bottom: 1px solid var(--hairline-soft);
    font-size: var(--fs-small); vertical-align: baseline;
  }
  .pt tbody tr:hover { background: var(--band); }
  .pt .c-id { width: 4rem; color: var(--faint); font-variant-numeric: tabular-nums; }
  .pt .c-pub { width: 7rem; color: var(--muted); white-space: nowrap; }
  .pt .c-year { width: 4rem; color: var(--muted); font-variant-numeric: tabular-nums; }
  .pt .c-act { width: 4.2rem; white-space: nowrap; }
  .pt .c-act a, .pt .c-act button {
    background: none; border: 0; padding: 0 0.2rem; cursor: pointer;
    font: inherit; color: var(--faint);
  }
  .pt .c-act a:hover, .pt .c-act button:hover { color: var(--accent); }
  .pt .c-act .off { color: var(--hairline); padding: 0 0.2rem; }
  .pt .c-act button[aria-pressed='true'] { color: var(--gold); }
</style>
```

- [ ] **Step 5: 实现 paper-table.js**

```js
import { applyFilters, sortRows, paginate, loadPapers } from '@/lib/papers.js';
import { highlightSegments } from '@/lib/highlight.js';
import { getSettings, getFavorites, toggleFavorite, isPersistent } from './settings-store.js';

// state 必须能整体重建。模块在软导航时不会重新执行（同一个 bundle URL），
// 但 DOM 是全新的、dataset.bound 也没了，于是 init 会再跑一次。若此时只重置
// rows，上一次访问留下的筛选条件会活下来，而界面上的控件全是空的 ——
// 表现为「什么都没选，表格却是空的」，用户无从下手。
const initialState = () => ({
  rows: [],          // 全量（或预渲染的种子）
  favorites: new Set(),
  keywords: [],
  query: '',
  publications: [],
  years: [],
  favoritesOnly: false,
  sortKey: null,
  sortDir: 'asc',
  page: 1,
  perPage: 15,
  status: 'loading', // 'loading' | 'loaded' | 'failed'
});

let state = initialState();

let i18n = {};
let els = {};

const fmt = (tpl, map) =>
  Object.entries(map).reduce((s, [k, v]) => s.replaceAll(k, v), tpl);

/**
 * 读取内嵌的种子数据（预渲染那 30 行的完整记录），作为 CDN 失败时的兜底数据源。
 * 不从表格 DOM 反推：那样会丢字段、要从文本 parse 数字，而且和表格列结构
 * 紧耦合 —— 以后改列就默默失效。
 */
function readSeed() {
  const el = document.getElementById('ptSeed');
  if (!el) return [];
  try {
    const rows = JSON.parse(el.textContent);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.warn('[paper-table] 种子数据解析失败', err);
    return [];
  }
}

function renderTitle(td, title) {
  // 必须用 trim 后的查询。applyFilters 内部会 trim，而这里不 trim 的话，
  // 输入一个空格：什么都不会被筛掉（对的），但每个标题里的每个空格都被标成命中；
  // 反过来 "fuzz " 能正确筛选却一处都高亮不出来。
  const q = state.query.trim();
  const patterns = [
    ...(q ? [{ text: q, cls: 'q-hit' }] : []),
    ...state.keywords.map((k) => ({ text: k, cls: 'hl' })),
  ];
  const frag = document.createDocumentFragment();
  for (const seg of highlightSegments(title, patterns)) {
    if (!seg.hit) {
      frag.appendChild(document.createTextNode(seg.text));
    } else {
      const b = document.createElement('b');
      b.className = seg.cls;
      b.textContent = seg.text;
      frag.appendChild(b);
    }
  }
  td.replaceChildren(frag);
}

function buildRow(row) {
  const tr = document.createElement('tr');
  tr.dataset.id = String(row.id);

  const cells = [
    ['c-id', String(row.id)],
    ['c-pub', row.publication],
    ['c-year', String(row.year)],
  ];
  for (const [cls, text] of cells) {
    const td = document.createElement('td');
    td.className = cls;
    td.textContent = text;
    tr.appendChild(td);
  }

  const tdTitle = document.createElement('td');
  tdTitle.className = 'c-title';
  const span = document.createElement('span');
  span.dataset.title = '';
  renderTitle(span, row.title);
  tdTitle.appendChild(span);
  tr.appendChild(tdTitle);

  const tdAct = document.createElement('td');
  tdAct.className = 'c-act';
  if (row.paper && row.paper !== '#') {
    const a = document.createElement('a');
    a.href = row.paper;
    a.target = '_blank';
    a.rel = 'noopener';
    a.title = i18n.openPaper;
    a.setAttribute('aria-label', i18n.openPaper);
    a.textContent = '↗';
    tdAct.appendChild(a);
  } else {
    const off = document.createElement('span');
    off.className = 'off';
    off.setAttribute('aria-hidden', 'true');
    off.textContent = '↗';
    tdAct.appendChild(off);
  }
  const fav = document.createElement('button');
  fav.type = 'button';
  fav.dataset.fav = String(row.id);
  fav.title = i18n.toggleFavorite;
  fav.setAttribute('aria-label', i18n.toggleFavorite);
  const on = state.favorites.has(row.id);
  fav.setAttribute('aria-pressed', on ? 'true' : 'false');
  fav.textContent = on ? '★' : '☆';
  tdAct.appendChild(fav);
  tr.appendChild(tdAct);

  return tr;
}

function render() {
  const filtered = applyFilters(state.rows, {
    query: state.query,
    publications: state.publications,
    years: state.years,
    favoritesOnly: state.favoritesOnly,
    favorites: state.favorites,
  });
  const ordered = state.sortKey ? sortRows(filtered, state.sortKey, state.sortDir) : filtered;
  const page = paginate(ordered, state.page, state.perPage);
  state.page = page.page;

  els.tbody.replaceChildren(...page.rows.map(buildRow));
  els.empty.hidden = page.total > 0;

  // 三态都要如实写出来。原先在未加载时保留旧文本，结果 CDN 失败后计数永远停在
  // 「预览 30 篇」，而表格已经在按筛选条件变化 —— 两者对不上。
  const countTpl = { loading: i18n.previewNote, loaded: i18n.total, failed: i18n.previewOffline }[state.status];
  els.count.textContent = fmt(countTpl, { __N__: page.total.toLocaleString() });
  els.pgInfo.textContent = fmt(i18n.pageOf, {
    __P__: String(page.page),
    __C__: String(page.pageCount),
  });
  els.pgPrev.disabled = page.page <= 1;
  els.pgNext.disabled = page.page >= page.pageCount;
}

function readDropdown(details, placeholder) {
  const checked = [...details.querySelectorAll('input:checked')].map((i) => i.value);
  const slot = details.querySelector('[data-fd-value]');
  slot.textContent = checked.length ? fmt(i18n.selected, { __N__: String(checked.length) }) : placeholder;
  return checked;
}

// 复制提示必须和 #notice 分开。共用一个槽位时，复制一次就会把 CDN 失败提示
// 连同它的「重试」按钮一起 replaceChildren 掉，两秒后再把整条隐藏 ——
// 用户失去了唯一的恢复入口，且没有任何迹象表明发生过这件事。
let toastTimer = 0;
function showToast(text) {
  els.toast.textContent = text;
  els.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els.toast.hidden = true; }, 2000);
}

function showNotice(text, onRetry) {
  els.notice.replaceChildren(document.createTextNode(text));
  if (onRetry) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = i18n.retry;
    btn.addEventListener('click', () => {
      els.notice.hidden = true;
      fetchFull();
    });
    els.notice.appendChild(btn);
  }
  els.notice.hidden = false;
}

async function fetchFull() {
  try {
    const data = await loadPapers();
    state.rows = data;
    state.status = 'loaded';
    render();   // render 自己会按 status 写计数
  } catch (err) {
    console.warn('[paper-table] 全量数据加载失败，保留预渲染内容', err);
    // 种子数据仍在 state.rows 里，页面依旧可筛可排
    state.status = 'failed';
    render();   // 让计数改口说「离线预览」，而不是停在「加载中」
    showNotice(i18n.loadFailed, true);
  }
}

export async function initPaperTable() {
  const tbody = document.getElementById('ptBody');
  if (!tbody || tbody.dataset.bound) return;
  tbody.dataset.bound = '1';

  state = initialState();   // 见 initialState 上方注释：软导航必须清干净

  i18n = JSON.parse(document.getElementById('ptI18n').textContent);
  els = {
    tbody,
    empty: document.getElementById('ptEmpty'),
    notice: document.getElementById('notice'),
    toast: document.getElementById('ptToast'),
    count: document.getElementById('ptCount'),
    pgInfo: document.getElementById('pgInfo'),
    pgPrev: document.getElementById('pgPrev'),
    pgNext: document.getElementById('pgNext'),
    q: document.getElementById('q'),
    fPub: document.getElementById('fPub'),
    fYear: document.getElementById('fYear'),
    favOnly: document.getElementById('favOnly'),
    clearAll: document.getElementById('clearAll'),
    perPage: document.getElementById('perPage'),
  };

  // 先用内嵌的种子数据当数据源，这样 CDN 失败也有内容可筛
  state.rows = readSeed();

  const [settings, favorites] = await Promise.all([getSettings(), getFavorites()]);
  state.keywords = settings.keywords;
  state.favorites = new Set(favorites);
  if (!isPersistent()) showNotice(i18n.notPersistent, false);

  // ── 事件 ────────────────────────────────────────────
  let debounce;
  els.q.addEventListener('input', () => {
    clearTimeout(debounce);
    // 15600 行的全量筛选在输入时逐字跑会卡，压到 120ms
    debounce = setTimeout(() => {
      state.query = els.q.value;
      state.page = 1;
      render();
    }, 120);
  });

  els.fPub.addEventListener('change', () => {
    state.publications = readDropdown(els.fPub, i18n.anyPublication);
    state.page = 1;
    render();
  });

  els.fYear.addEventListener('change', () => {
    state.years = readDropdown(els.fYear, i18n.anyYear);
    state.page = 1;
    render();
  });

  els.favOnly.addEventListener('click', () => {
    state.favoritesOnly = !state.favoritesOnly;
    els.favOnly.setAttribute('aria-pressed', state.favoritesOnly ? 'true' : 'false');
    els.favOnly.querySelector('span').textContent = state.favoritesOnly ? '★' : '☆';
    state.page = 1;
    render();
  });

  els.clearAll.addEventListener('click', () => {
    state.query = '';
    state.publications = [];
    state.years = [];
    state.favoritesOnly = false;
    state.sortKey = null;
    state.page = 1;
    els.q.value = '';
    for (const d of [els.fPub, els.fYear]) {
      d.querySelectorAll('input:checked').forEach((i) => (i.checked = false));
      d.open = false;
    }
    readDropdown(els.fPub, i18n.anyPublication);
    readDropdown(els.fYear, i18n.anyYear);
    els.favOnly.setAttribute('aria-pressed', 'false');
    els.favOnly.querySelector('span').textContent = '☆';
    document.querySelectorAll('.pt th[data-dir]').forEach((th) => delete th.dataset.dir);
    render();
  });

  els.perPage.addEventListener('change', () => {
    state.perPage = Number(els.perPage.value) || 15;
    state.page = 1;
    render();
  });

  els.pgPrev.addEventListener('click', () => {
    state.page -= 1;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  els.pgNext.addEventListener('click', () => {
    state.page += 1;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.querySelectorAll('.pt th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      state.sortDir = state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc';
      state.sortKey = key;
      document.querySelectorAll('.pt th[data-dir]').forEach((o) => delete o.dataset.dir);
      th.dataset.dir = state.sortDir === 'asc' ? '↑' : '↓';
      render();
    });
  });

  // 行内委托：收藏按钮 + 点标题复制
  tbody.addEventListener('click', async (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      const id = Number(favBtn.dataset.fav);
      const { favorites: next, added } = await toggleFavorite(id);
      state.favorites = new Set(next);
      favBtn.setAttribute('aria-pressed', added ? 'true' : 'false');
      favBtn.textContent = added ? '★' : '☆';
      // 「仅看收藏」开着时取消收藏要让该行立刻消失
      if (state.favoritesOnly) render();
      return;
    }
    if (e.target.closest('a')) return;   // 论文外链交给浏览器
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const title = tr.querySelector('[data-title]')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(title);
      showToast(i18n.copied);
    } catch {
      /* 无剪贴板权限时静默 */
    }
  });

  render();
  fetchFull();
}
```

- [ ] **Step 6: 注册页面并补高亮样式**

`src/scripts/boot.js` 追加：

```js
registerPage('search', async () => {
  const { initPaperTable } = await import('./paper-table.js');
  await initPaperTable();
});
```

`src/styles/global.css` 追加 —— 搜索词命中用强调色下划线，与关键词高亮的底色区分开，两者叠加时才看得清：

```css
.q-hit { color: var(--accent); border-bottom: 1px solid var(--accent); font-weight: 600; }
```

- [ ] **Step 7: 构建与验证**

Run: `npx vitest run`
Expected: PASS（文案漂移守卫确认新增 `search.*` 两语齐全）

Run: `npm run build`
Expected: 成功

Run: `grep -o 'data-fav=' dist/zh/search/index.html | wc -l`
Expected: `30`（预渲染 30 行）

Run: `grep -q 'Bridge' dist/zh/search/index.html && echo "✓ 预渲染含真实论文标题"`
Expected: 打印 `✓ 预渲染含真实论文标题`

- [ ] **Step 8: 人工验收**

Run: `npm run dev`，访问 `/zh/search/`

1. 页面刚打开就有 30 行真内容；随后计数变成「共 15600 篇论文。」。
2. 输入 `fuzz` → 结果收窄，命中处是强调色下划线。
3. 输入 `C++` → 有结果、不报错（验 `includes` 而非正则）。
4. 会议下拉勾 2 个 → 摘要栏显示「已选 2」，结果取并集；再叠加年份 → 取交集。
5. 「清除筛选」→ 输入框、两个下拉、收藏开关、排序箭头全部复位。
6. 点表头 `年份` → 升序，再点 → 降序，箭头跟着变。
7. 星标 2 行 → 开「仅看收藏」→ 只剩这 2 行 → 取消其中一个星标 → 该行**立刻消失**。
8. 每页切到 100 → 分页信息与按钮禁用状态正确；跳到末页，末页不足一页时不报错。
9. 点某行的标题区域 → 顶部提示「已复制论文标题！」。
10. **模拟 CDN 失败**：DevTools → Network → 勾 Offline，硬刷新 → 页面仍有 30 行，顶部出现失败提示 + 重试按钮；取消 Offline 后点重试 → 加载成功、提示消失。
11. 窗口收窄 → 表格在自己的容器内横向滚动。

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(search): 检索页重写为原生 JS

首屏 30 行在构建时预渲染进 HTML，并作为 CDN 失败时的兜底数据源 ——
拉不到 data.json 时页面仍可读可筛，绝不出现空表格，附重试按钮。
多选筛选器用原生 <details>，无障碍与焦点管理都由浏览器负责，不自己写 popover。
搜索输入 120ms 防抖：15600 行逐字全量筛选会卡。
搜索词命中用强调色下划线、偏好关键词用底色高亮，两者叠加时可区分。
「仅看收藏」开启时取消星标会让该行立刻消失。
表格在自身容器内横向滚动，页面 body 不横向滚。"
```

---

### Task 14: 摘要页

**Files:**
- Create: `src/pages/[lang]/abstract.astro`
- Create: `src/lib/venue-groups.js`
- Create: `src/scripts/abstract-view.js`
- Create: `tests/venue-groups.test.js`
- Modify: `src/scripts/boot.js`、`src/i18n/*.json`

**Interfaces:**
- Consumes: `highlightSegments`（Task 12）、`getSettings`（Task 10）、`DATA_BASE`（Task 11）
- Produces:
  - `groupVenues(stats) => Array<{ key, labelKey, venues: Array<{ name, years: string[] }> }>`
  - `initAbstractView() => Promise<void>`（幂等）

原实现（`ViewAbstract.vue`）用 PrimeVue MegaMenu 三级嵌套，且把会议分组硬编码在组件里（还残留一个数据里根本没有的 `TSE`）。这里把分组抽成可测的纯函数，UI 换成「会议行 + 年份 chip」的二级结构 —— 层级更浅，移动端也不用嵌套弹层。

- [ ] **Step 1: 写 venue-groups 的失败测试**

```js
// tests/venue-groups.test.js
import { describe, it, expect } from 'vitest';
import { groupVenues } from '@/lib/venue-groups.js';
import stats from '@/assets/data/data-statistics.json';

describe('groupVenues', () => {
  const groups = groupVenues(stats);

  it('三组：安全四大 / 软工 / 系统', () => {
    expect(groups.map((g) => g.key)).toEqual(['top-tier', 'software-engineering', 'system']);
  });

  it('每组的文案 key 指向 abstract.* 且两语存在', () => {
    expect(groups.map((g) => g.labelKey)).toEqual([
      'abstract.topTier',
      'abstract.softwareEngineering',
      'abstract.system',
    ]);
  });

  it('只列出数据里真实存在的会议 —— 避免出现空选项', () => {
    const all = groups.flatMap((g) => g.venues.map((v) => v.name));
    expect(all).toHaveLength(10);
    for (const name of all) {
      expect(stats.byPublicationAndYear[name]).toBeTruthy();
    }
  });

  it('不含数据里没有的会议（原实现硬编码里残留的 TSE）', () => {
    const all = groups.flatMap((g) => g.venues.map((v) => v.name));
    expect(all).not.toContain('TSE');
  });

  it('每个会议的年份按降序排列，最新在前', () => {
    for (const g of groups) {
      for (const v of g.venues) {
        const nums = v.years.map(Number);
        expect(nums).toEqual([...nums].sort((a, b) => b - a));
      }
    }
  });

  it('年份只来自该会议真实办过的届次', () => {
    const sosp = groups.flatMap((g) => g.venues).find((v) => v.name === 'SOSP');
    expect(sosp.years).not.toContain('2016');
    expect(sosp.years).toContain('2025');
  });

  it('空数据返回三个空组而不是崩', () => {
    const empty = groupVenues({ byPublicationAndYear: {} });
    expect(empty).toHaveLength(3);
    expect(empty.every((g) => g.venues.length === 0)).toBe(true);
  });
});
```

- [ ] **Step 2: 实现 src/lib/venue-groups.js**

```js
// 分组依据 data-statistics.json 里 overview[].category 的三个取值。
// 不硬编码会议名单——名单从实际数据推出，新增会议不用改这里。
const GROUPS = [
  { key: 'top-tier', labelKey: 'abstract.topTier', names: ['IEEE S&P', 'ACM CCS', 'USENIX Sec', 'NDSS'] },
  { key: 'software-engineering', labelKey: 'abstract.softwareEngineering', names: ['ICSE', 'ASE', 'FSE', 'ISSTA'] },
  { key: 'system', labelKey: 'abstract.system', names: ['ASPLOS', 'SOSP'] },
];

export function groupVenues(stats) {
  const byPY = (stats && stats.byPublicationAndYear) || {};
  return GROUPS.map((g) => ({
    key: g.key,
    labelKey: g.labelKey,
    venues: g.names
      .filter((name) => byPY[name])   // 只列真实存在的，避免空选项
      .map((name) => ({
        name,
        years: Object.keys(byPY[name]).sort((a, b) => Number(b) - Number(a)),
        counts: byPY[name],
      })),
  }));
}
```

- [ ] **Step 3: 追加文案**

```json
// zh.json 新增顶层 abstractPage
"abstractPage": {
  "lead": "选择会议与年份，加载该届的录用论文与摘要。设置里的关注关键词会在正文里自动标出。",
  "loading": "正在加载论文…",
  "failed": "加载失败，请稍后重试。",
  "noData": "该年份暂无摘要数据。",
  "count": "{count} 篇",
  "expandAll": "全部展开",
  "collapseAll": "全部收起"
}
```

```json
// en.json 新增顶层 abstractPage
"abstractPage": {
  "lead": "Pick a venue and year to load that edition's accepted papers with abstracts. Keywords saved in Settings get highlighted automatically.",
  "loading": "Loading papers…",
  "failed": "Loading failed. Please try again later.",
  "noData": "No abstracts available for this year yet.",
  "count": "{count} papers",
  "expandAll": "Expand all",
  "collapseAll": "Collapse all"
}
```

- [ ] **Step 4: 实现摘要页**

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import { LOCALES, t } from '@/i18n/index.js';
import { groupVenues } from '@/lib/venue-groups.js';
import stats from '@/assets/data/data-statistics.json';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

const { lang } = Astro.params;
const groups = groupVenues(stats);
---

<PageLayout lang={lang} page="abstract" title={t(lang, 'menu.abstract')}
            lead={t(lang, 'abstractPage.lead')}>

  <nav class="picker" aria-label={t(lang, 'menu.abstract')}>
    {groups.map((g) => (
      <section class="grp">
        <h2 class="kicker">{t(lang, g.labelKey)}</h2>
        {g.venues.map((v) => (
          <div class="venue">
            <span class="vname">{v.name}</span>
            <div class="years">
              {v.years.map((y) => (
                <button type="button" class="yr" data-venue={v.name} data-year={y}
                        aria-pressed="false" title={`${v.counts[y]}`}>{y}</button>
              ))}
            </div>
          </div>
        ))}
      </section>
    ))}
  </nav>

  <div class="result" id="abResult" aria-live="polite">
    <p class="hint">{t(lang, 'abstract.emptyHint')}</p>
  </div>

  <script type="application/json" id="abI18n" set:html={JSON.stringify({
    loading: t(lang, 'abstractPage.loading'),
    failed: t(lang, 'abstractPage.failed'),
    noData: t(lang, 'abstractPage.noData'),
    count: t(lang, 'abstractPage.count', { count: '__N__' }),
    noAbstract: t(lang, 'abstract.noAbstract'),
    openPaper: t(lang, 'abstract.openPaper'),
  })} />
</PageLayout>

<style>
  .picker { border-bottom: 1px solid var(--hairline); padding-bottom: 1.2rem; margin-bottom: 1.4rem; }
  .grp { margin-bottom: 1rem; }
  .grp:last-child { margin-bottom: 0; }
  .grp h2 { margin-bottom: 0.55rem; }

  .venue {
    display: flex; gap: 0.8rem; align-items: baseline;
    padding: 0.3rem 0; border-top: 1px solid var(--hairline-soft);
  }
  .vname { flex: none; width: 6.5rem; font-size: var(--fs-small); color: var(--ink); }
  .years { display: flex; flex-wrap: wrap; gap: 0.25rem; }
  .yr {
    background: none; border: 1px solid transparent; border-radius: var(--radius);
    padding: 0.1rem 0.35rem; cursor: pointer; font: inherit;
    font-size: var(--fs-kicker); color: var(--muted); font-variant-numeric: tabular-nums;
  }
  .yr:hover { border-color: var(--hairline); color: var(--ink); }
  .yr[aria-pressed='true'] { background: var(--ink); color: var(--bg); border-color: var(--ink); }

  .hint { color: var(--faint); font-size: var(--fs-small); padding: 2.5rem 0; text-align: center; }

  .head { display: flex; align-items: baseline; gap: 0.7rem; margin-bottom: 1rem; }
  .head h2 { font-size: var(--fs-h2); }
  .head .n { font-size: var(--fs-kicker); color: var(--faint); }

  .list { list-style: none; margin: 0; padding: 0; }
  .item { padding: 0.9rem 0 1rem; border-top: 1px solid var(--hairline-soft); }
  .item:first-child { border-top: 0; }
  .ttl {
    font-family: var(--font-serif); font-size: 1rem; line-height: 1.45;
    display: inline; margin-right: 0.3rem;
  }
  .ext { font-size: 0.7rem; color: var(--faint); }
  .ext:hover { color: var(--accent); }
  .abs {
    margin: 0.5rem 0 0; font-size: var(--fs-small); line-height: 1.8;
    color: var(--muted); text-align: justify; hyphens: auto;
  }
  .abs--none { font-style: italic; color: var(--faint); }
  .skel { height: 0.7rem; background: var(--hairline-soft); margin: 0.4rem 0; }
</style>
```

- [ ] **Step 5: 实现 abstract-view.js**

```js
import { highlightSegments } from '@/lib/highlight.js';
import { getSettings } from './settings-store.js';
import { DATA_BASE } from '@/lib/cdn.js';

let i18n = {};
let keywords = [];
let inFlight = 0;   // 请求序号，防止慢请求覆盖快请求的结果

const fmt = (tpl, map) => Object.entries(map).reduce((s, [k, v]) => s.replaceAll(k, v), tpl);

function highlightInto(el, text) {
  const frag = document.createDocumentFragment();
  for (const seg of highlightSegments(text, keywords.map((k) => ({ text: k, cls: 'hl' })))) {
    if (!seg.hit) frag.appendChild(document.createTextNode(seg.text));
    else {
      const b = document.createElement('b');
      b.className = seg.cls;
      b.textContent = seg.text;
      frag.appendChild(b);
    }
  }
  el.replaceChildren(frag);
}

function renderSkeleton(box) {
  box.replaceChildren();
  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = i18n.loading;
  box.appendChild(p);
  for (let i = 0; i < 4; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'item';
    for (let j = 0; j < 3; j++) {
      const s = document.createElement('div');
      s.className = 'skel';
      s.style.width = j === 0 ? '62%' : '100%';
      wrap.appendChild(s);
    }
    box.appendChild(wrap);
  }
}

function renderPapers(box, venue, year, papers) {
  box.replaceChildren();

  const head = document.createElement('div');
  head.className = 'head';
  const h2 = document.createElement('h2');
  h2.className = 'srf';
  h2.textContent = `${venue} ${year}`;
  const n = document.createElement('span');
  n.className = 'n';
  n.textContent = fmt(i18n.count, { __N__: String(papers.length) });
  head.append(h2, n);
  box.appendChild(head);

  const ul = document.createElement('ul');
  ul.className = 'list';
  for (const p of papers) {
    const li = document.createElement('li');
    li.className = 'item';

    const ttl = document.createElement('span');
    ttl.className = 'ttl';
    highlightInto(ttl, p.title);
    li.appendChild(ttl);

    if (p.paper && p.paper !== '#') {
      const a = document.createElement('a');
      a.className = 'ext';
      a.href = p.paper;
      a.target = '_blank';
      a.rel = 'noopener';
      a.title = i18n.openPaper;
      a.textContent = '↗';
      li.appendChild(a);
    }

    const abs = document.createElement('p');
    if (p.abstract && p.abstract.trim()) {
      abs.className = 'abs';
      highlightInto(abs, p.abstract.trim());
    } else {
      abs.className = 'abs abs--none';
      abs.textContent = i18n.noAbstract;
    }
    li.appendChild(abs);

    ul.appendChild(li);
  }
  box.appendChild(ul);
}

function renderMessage(box, text) {
  box.replaceChildren();
  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = text;
  box.appendChild(p);
}

async function load(box, venue, year) {
  const ticket = ++inFlight;
  renderSkeleton(box);
  try {
    // 文件名里有空格和 &，必须 encodeURIComponent
    const file = encodeURIComponent(`${venue} - ${year}.json`);
    const res = await fetch(`${DATA_BASE}/meta_json/${file}`);
    if (ticket !== inFlight) return;   // 已有更新的请求，丢弃本次结果
    if (!res.ok) {
      renderMessage(box, res.status === 404 ? i18n.noData : i18n.failed);
      return;
    }
    const papers = await res.json();
    if (ticket !== inFlight) return;
    if (!Array.isArray(papers) || !papers.length) {
      renderMessage(box, i18n.noData);
      return;
    }
    renderPapers(box, venue, year, papers);
  } catch (err) {
    if (ticket !== inFlight) return;
    console.warn('[abstract] 加载失败', err);
    renderMessage(box, i18n.failed);
  }
}

export async function initAbstractView() {
  const picker = document.querySelector('.picker');
  const box = document.getElementById('abResult');
  if (!picker || !box || picker.dataset.bound) return;
  picker.dataset.bound = '1';

  i18n = JSON.parse(document.getElementById('abI18n').textContent);
  keywords = (await getSettings()).keywords;

  picker.addEventListener('click', (e) => {
    const btn = e.target.closest('.yr');
    if (!btn) return;
    picker.querySelectorAll('.yr[aria-pressed="true"]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
    btn.setAttribute('aria-pressed', 'true');
    load(box, btn.dataset.venue, btn.dataset.year);
  });
}
```

`inFlight` 那个序号是必要的：连点两个年份时，先发的请求可能后到，不加序号会把旧结果盖在新选择上。

- [ ] **Step 6: 注册并验收**

`boot.js` 追加：

```js
registerPage('abstract', async () => {
  const { initAbstractView } = await import('./abstract-view.js');
  await initAbstractView();
});
```

Run: `npx vitest run tests/venue-groups.test.js tests/i18n.test.js` → PASS
Run: `npm run build` → 成功

人工验收（`npm run dev`，`/zh/abstract/`）：

1. 三组会议列出，每行一个会议 + 一排年份按钮；年份**降序**。
2. SOSP 行没有 2016、2018 这些没办的年份。
3. 点 `IEEE S&P` 的 `2026` → 出现骨架屏 → 加载出 199 篇，标题 + 摘要。
4. 先在设置页加关键词 `fuzzing`，回来重新加载 → 摘要正文里 `fuzzing` 被底色标出。
5. **连点两个不同年份** → 最终显示的是最后点的那个（验请求序号）。
6. 手动把某个年份按钮的 `data-year` 改成 `1999` 再点 → 显示「该年份暂无摘要数据。」而不是报错。
7. 开 Offline 后点年份 → 显示「加载失败，请稍后重试。」

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(abstract): 摘要页重写，会议分组抽成可测纯函数

原实现用 PrimeVue MegaMenu 三级嵌套，且把会议名单硬编码在组件里
（还残留一个数据里根本没有的 TSE）。改为二级结构「会议行 + 年份 chip」，
名单从 data-statistics.json 推出，只列真实存在的会议与届次。
加请求序号防竞态：连点两个年份时先发的请求可能后到，会把旧结果盖在新选择上。
meta_json 文件名含空格与 &，用 encodeURIComponent。
404 与网络错误分开提示。"
```

---

### Task 15: 趋势页

**Files:**
- Create: `src/pages/[lang]/trends.astro`
- Create: `src/lib/chart-palette.js`
- Create: `src/lib/trend-series.js`
- Create: `src/scripts/trends-chart.js`
- Create: `tests/trend-series.test.js`
- Modify: `src/scripts/boot.js`、`src/i18n/*.json`

**Interfaces:**
- Consumes: `groupVenues` 的分组概念（但独立实现，数据源是 `stats.overview`）
- Produces:
  - `buildSeries(stats) => Array<{ category, labelKey, years: string[], series: Array<{ label, data: (number|null)[] }> }>`
  - `SERIES_COLORS: string[]`（4 个，每张图最多 4 条线所以够用）
  - `initTrendsChart() => Promise<void>`（幂等）

**关键发现**：`stats.overview[].borderColor` 存的是 PrimeVue CSS 变量名（`--p-purple-400` 等），PrimeVue 移除后这些变量不存在了，必须换掉。好在**每个 category 各画一张图、每张最多 4 条线**，所以只需要 4 个可区分的颜色，不是 10 个 —— 这让编辑风的低饱和配色仍能保持可辨识。

- [ ] **Step 1: 写 trend-series 的失败测试**

```js
// tests/trend-series.test.js
import { describe, it, expect } from 'vitest';
import { buildSeries } from '@/lib/trend-series.js';
import { SERIES_COLORS } from '@/lib/chart-palette.js';
import stats from '@/assets/data/data-statistics.json';

describe('buildSeries', () => {
  const groups = buildSeries(stats);

  it('三张图，对应三个 category', () => {
    expect(groups.map((g) => g.category)).toEqual(['top-tier', 'software-engineering', 'system']);
  });

  it('每张图的线数不超过配色数', () => {
    for (const g of groups) {
      expect(g.series.length).toBeLessThanOrEqual(SERIES_COLORS.length);
    }
  });

  it('同一张图内所有线共用同一条年份轴', () => {
    for (const g of groups) {
      for (const s of g.series) {
        expect(s.data).toHaveLength(g.years.length);
      }
    }
  });

  it('年份轴升序', () => {
    for (const g of groups) {
      const nums = g.years.map(Number);
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    }
  });

  it('该会议当年没办时数据点是 null，让 Chart.js 断线而不是画成 0', () => {
    const sys = groups.find((g) => g.category === 'system');
    const sosp = sys.series.find((s) => s.label === 'SOSP');
    const i2016 = sys.years.indexOf('2016');
    if (i2016 >= 0) expect(sosp.data[i2016]).toBeNull();
  });

  it('真实数据点对得上', () => {
    const top = groups.find((g) => g.category === 'top-tier');
    const usenix = top.series.find((s) => s.label === 'USENIX Sec');
    expect(usenix.data[top.years.indexOf('2025')]).toBe(439);
  });

  it('不再引用 PrimeVue 的 CSS 变量名', () => {
    const json = JSON.stringify(groups);
    expect(json).not.toContain('--p-');
  });

  it('空数据返回空数组而不是崩', () => {
    expect(buildSeries({ overview: [] })).toEqual([]);
    expect(buildSeries({})).toEqual([]);
  });
});

describe('SERIES_COLORS', () => {
  it('至少 4 个，且互不相同', () => {
    expect(SERIES_COLORS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(SERIES_COLORS).size).toBe(SERIES_COLORS.length);
  });
});
```

- [ ] **Step 2: 实现 chart-palette.js 与 trend-series.js**

```js
// src/lib/chart-palette.js
// 每个 category 各一张图、每张最多 4 条线，所以 4 个颜色就够 —— 不需要 10 个。
// 这让低饱和的编辑风配色仍能保持可辨识度。
// 明暗两套：深色底上需要提亮，否则低饱和的线会糊进背景。
export const SERIES_COLORS = ['#2f4858', '#7d3038', '#6b5b2f', '#2f5744'];
export const SERIES_COLORS_DARK = ['#7fa8bd', '#d9868f', '#c4a962', '#83bda1'];

// 低饱和配色下光靠颜色区分不够稳，给后两条线加虚线做冗余编码
export const SERIES_DASH = [[], [], [5, 3], [2, 3]];

export function seriesStyle(index, isDark) {
  const palette = isDark ? SERIES_COLORS_DARK : SERIES_COLORS;
  return {
    borderColor: palette[index % palette.length],
    borderDash: SERIES_DASH[index % SERIES_DASH.length],
  };
}
```

```js
// src/lib/trend-series.js
const LABEL_KEYS = {
  'top-tier': 'abstract.topTier',
  'software-engineering': 'abstract.softwareEngineering',
  system: 'abstract.system',
};

const ORDER = ['top-tier', 'software-engineering', 'system'];

export function buildSeries(stats) {
  const overview = (stats && stats.overview) || [];
  if (!overview.length) return [];

  const byCategory = new Map();
  for (const item of overview) {
    if (!byCategory.has(item.category)) byCategory.set(item.category, []);
    byCategory.get(item.category).push(item);
  }

  return ORDER.filter((c) => byCategory.has(c)).map((category) => {
    const items = byCategory.get(category);
    const years = [...new Set(items.flatMap((i) => Object.keys(i.map_data)))].sort(
      (a, b) => Number(a) - Number(b)
    );
    return {
      category,
      labelKey: LABEL_KEYS[category] ?? category,
      years,
      // null 而非 0：该会议当年没办，Chart.js 应当断线而不是画一条掉到零的假谷底
      series: items.map((i) => ({
        label: i.label,
        data: years.map((y) => (i.map_data[y] == null ? null : i.map_data[y])),
      })),
    };
  });
}
```

- [ ] **Step 3: 实现趋势页与图表脚本**

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import { LOCALES, t } from '@/i18n/index.js';
import { buildSeries } from '@/lib/trend-series.js';
import stats from '@/assets/data/data-statistics.json';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

const { lang } = Astro.params;
const groups = buildSeries(stats);
---

<PageLayout lang={lang} page="trends" title={t(lang, 'menu.trends')}
            lead={t(lang, 'trendsPage.lead')}>
  {groups.map((g) => (
    <section class="chart-sec" data-reveal>
      <h2 class="srf">{t(lang, g.labelKey)}</h2>
      <div class="canvas-box">
        <canvas data-chart={g.category}></canvas>
      </div>
      <noscript><p class="ns">{t(lang, 'trendsPage.needsJs')}</p></noscript>
    </section>
  ))}

  <script type="application/json" id="trendData" set:html={JSON.stringify(groups)} />
</PageLayout>

<style>
  .chart-sec { margin-bottom: var(--sp-band); }
  .chart-sec h2 { margin-bottom: 0.9rem; }
  .canvas-box { height: min(58vh, 26rem); position: relative; }
  .ns { color: var(--faint); font-size: var(--fs-small); }
</style>
```

```js
// src/scripts/trends-chart.js
import { seriesStyle } from '@/lib/chart-palette.js';

let charts = [];

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function options(isDark) {
  const tick = cssVar('--faint');
  const grid = cssVar('--hairline-soft');
  const text = cssVar('--muted');
  return {
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: text, boxWidth: 18, boxHeight: 2, usePointStyle: false } },
      tooltip: {
        backgroundColor: cssVar('--panel'),
        titleColor: cssVar('--ink'),
        bodyColor: text,
        borderColor: cssVar('--hairline'),
        borderWidth: 1,
        cornerRadius: 2,
        displayColors: true,
      },
    },
    scales: {
      x: { ticks: { color: tick }, grid: { color: grid, drawTicks: false }, border: { color: grid } },
      y: {
        beginAtZero: true,
        ticks: { color: tick, precision: 0 },
        grid: { color: grid, drawTicks: false },
        border: { color: grid },
      },
    },
  };
}

export async function initTrendsChart() {
  const dataEl = document.getElementById('trendData');
  if (!dataEl || dataEl.dataset.bound) return;
  dataEl.dataset.bound = '1';

  // Chart.js 只在这一页需要，动态 import 让其余 8 个页面不背这 ~60KB
  const { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, Filler } =
    await import('chart.js');
  Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, Filler);

  const groups = JSON.parse(dataEl.textContent);
  const isDark = () => document.documentElement.dataset.theme === 'dark';

  const build = () => {
    for (const c of charts) c.destroy();
    charts = [];
    for (const g of groups) {
      const canvas = document.querySelector(`canvas[data-chart="${g.category}"]`);
      if (!canvas) continue;
      charts.push(
        new Chart(canvas, {
          type: 'line',
          data: {
            labels: g.years,
            datasets: g.series.map((s, i) => ({
              label: s.label,
              data: s.data,
              fill: false,
              tension: 0.35,
              borderWidth: 1.6,
              pointRadius: 0,
              pointHitRadius: 12,
              spanGaps: false,   // null 处断线，如实反映该年没办
              ...seriesStyle(i, isDark()),
            })),
          },
          options: options(isDark()),
        })
      );
    }
  };

  build();

  // 明暗切换后重建：Chart.js 把颜色烤进了实例，改 CSS 变量不会让它自己更新
  if (!window.__spcTrendThemeObserver) {
    window.__spcTrendThemeObserver = new MutationObserver(() => {
      if (charts.length) build();
    });
    window.__spcTrendThemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-accent'],
    });
  }

  // 软导航离开本页时销毁，避免 canvas 泄漏
  document.addEventListener(
    'astro:before-swap',
    () => {
      for (const c of charts) c.destroy();
      charts = [];
    },
    { once: true }
  );
}
```

追加文案：`trendsPage.lead` / `trendsPage.needsJs`（两语），并在 `boot.js` 注册 `registerPage('trends', ...)`。

- [ ] **Step 4: 验收**

Run: `npx vitest run tests/trend-series.test.js` → PASS
Run: `npm run build` → 成功
Run: `grep -q 'chart' dist/zh/search/index.html && echo "⚠ Chart.js 泄漏到检索页" || echo "✓ Chart.js 仅在趋势页"`
Expected: 打印 `✓ Chart.js 仅在趋势页`

人工验收（`/zh/trends/`）：

1. 三张折线图，分别是安全四大 / 软工 / 系统。
2. SOSP 那条线在没办的年份**断开**，不是掉到 0。
3. 悬停显示同一年所有会议的数值（`interaction.mode: 'index'`）。
4. 点图例可切换单条线显隐。
5. **切深色模式 → 图表颜色跟着换**（验 MutationObserver 重建）。
6. 后两条线是虚线（低饱和配色下的冗余编码）。
7. 跳到别页再跳回来 → 图表正常重建，Console 无 canvas 重用报错。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(trends): 趋势页改为原生 JS 调用 Chart.js

data-statistics.json 的 overview[].borderColor 存的是 PrimeVue 变量名
（--p-purple-400 等），PrimeVue 移除后这些变量不存在，全部换掉。
每个 category 各一张图、每张最多 4 条线，所以只需 4 个颜色而非 10 个 ——
低饱和的编辑风配色因此仍能保持可辨识；后两条线加虚线做冗余编码。
缺席年份用 null + spanGaps:false 让线断开，而不是画成掉到 0 的假谷底。
Chart.js 动态 import，其余 8 个页面不背这 ~60KB。
明暗切换用 MutationObserver 重建图表：Chart.js 把颜色烤进了实例，
改 CSS 变量不会让它自己更新。"
```

---

### Task 16: 投稿时间线页

**Files:**
- Create: `src/pages/[lang]/timeline.astro`
- Create: `src/scripts/timeline.js`
- Modify: `src/scripts/boot.js`、`src/i18n/*.json`

**Interfaces:**
- Consumes: `parseDeadlineDate` / `flattenDeadlines`（Task 7）
- Produces: `initTimeline() => void`（幂等）

整页在构建时渲染成静态 HTML，JS 只负责标出「下一个即将到来的阶段」并算天数。

- [ ] **Step 1: 追加文案**

```json
// zh.json 新增顶层 timelinePage
"timelinePage": {
  "lead": "四大安全会议的完整投稿周期。日期为人工从官网摘录，官方可能临时调整，请以官网为准。",
  "timezone": "时区",
  "period": "会期",
  "place": "地点",
  "synced": "最后同步",
  "next": "下一站",
  "daysLeft": "还剩 {days} 天",
  "today": "就是今天",
  "passed": "已过",
  "needsJs": "开启 JavaScript 可看到倒计时。"
}
```

```json
// en.json 新增顶层 timelinePage
"timelinePage": {
  "lead": "Full submission cycles for the four major security venues. Dates are transcribed by hand from official sites and may change — always confirm with the official CFP.",
  "timezone": "Timezone",
  "period": "Dates",
  "place": "Location",
  "synced": "Last synced",
  "next": "Next up",
  "daysLeft": "{days} days left",
  "today": "Today",
  "passed": "Passed",
  "needsJs": "Enable JavaScript to see countdowns."
}
```

- [ ] **Step 2: 实现时间线页**

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import { LOCALES, t } from '@/i18n/index.js';
import timeline from '@/assets/data/submission-timeline.json';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}
const { lang } = Astro.params;
---

<PageLayout lang={lang} page="timeline" title={t(lang, 'menu.submissionTimeline')}
            lead={t(lang, 'timelinePage.lead')}>

  {timeline.map((pub) => (
    <section class="pub" data-reveal>
      <div class="pub-head">
        <h2 class="srf">
          <a href={pub.url} target="_blank" rel="noopener">{pub.publication} <span class="ext">↗</span></a>
        </h2>
        <dl class="facts">
          <dt class="kicker">{t(lang, 'timelinePage.period')}</dt><dd>{pub.date}</dd>
          <dt class="kicker">{t(lang, 'timelinePage.place')}</dt><dd>{pub.place}</dd>
          <dt class="kicker">{t(lang, 'timelinePage.timezone')}</dt><dd>{pub.timezone}</dd>
          <dt class="kicker">{t(lang, 'timelinePage.synced')}</dt><dd>{pub.update}</dd>
        </dl>
      </div>

      <div class="cycles">
        {pub.cycles.map((cycle) => (
          <div class="cycle" data-cycle>
            <h3 class="kicker cname">{cycle.name}</h3>
            <ol class="steps">
              {cycle.ddls.map((ddl) => (
                <li class="step" data-ddl={ddl.date}>
                  <span class="dot" aria-hidden="true"></span>
                  <span class="date">{ddl.date}</span>
                  <span class="stage">{ddl.stage}</span>
                  <span class="days" data-days></span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </section>
  ))}

  <script type="application/json" id="tlI18n" set:html={JSON.stringify({
    daysLeft: t(lang, 'timelinePage.daysLeft', { days: '__N__' }),
    today: t(lang, 'timelinePage.today'),
    next: t(lang, 'timelinePage.next'),
  })} />
</PageLayout>

<style>
  .pub { margin-bottom: var(--sp-band); padding-bottom: var(--sp-band); border-bottom: 1px solid var(--hairline); }
  .pub:last-of-type { border-bottom: 0; }

  .pub-head { margin-bottom: 1.3rem; }
  .pub-head h2 { margin-bottom: 0.7rem; }
  .pub-head .ext { font-size: 0.7rem; color: var(--faint); }
  .pub-head a:hover { color: var(--accent); }

  .facts { display: grid; grid-template-columns: auto 1fr; gap: 0.25rem 0.8rem; margin: 0; }
  .facts dt { align-self: baseline; }
  .facts dd { margin: 0; font-size: var(--fs-small); color: var(--muted); }

  .cycles { display: grid; grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr)); gap: var(--sp-gap); }
  .cname { margin-bottom: 0.7rem; color: var(--muted); }

  .steps { list-style: none; margin: 0; padding: 0; }
  .step {
    display: grid; grid-template-columns: 0.9rem 5.6rem 1fr auto;
    gap: 0.5rem; align-items: baseline;
    padding: 0.4rem 0; font-size: var(--fs-kicker);
    border-left: 1px solid var(--hairline); margin-left: 0.28rem; padding-left: 0.8rem;
    position: relative;
  }
  .dot {
    position: absolute; left: -0.28rem; top: 0.75rem;
    width: 5px; height: 5px; background: var(--hairline);
  }
  .date { color: var(--muted); font-variant-numeric: tabular-nums; }
  .stage { color: var(--muted); line-height: 1.5; }
  .days { color: var(--accent); white-space: nowrap; }

  /* 已过的阶段整体压暗 */
  .step.past { color: var(--faint); }
  .step.past .date, .step.past .stage { color: var(--faint); }

  /* 下一个即将到来的阶段：实心点 + 强调色边线 */
  .step.next { border-left-color: var(--accent); }
  .step.next .dot { background: var(--accent); width: 7px; height: 7px; left: -0.35rem; }
  .step.next .stage, .step.next .date { color: var(--ink); }
</style>
```

- [ ] **Step 3: 实现 timeline.js**

```js
import { parseDeadlineDate } from '@/lib/deadlines.js';

const fmt = (tpl, map) => Object.entries(map).reduce((s, [k, v]) => s.replaceAll(k, v), tpl);

export function initTimeline() {
  const root = document.querySelector('.pub');
  if (!root || root.dataset.bound) return;
  root.dataset.bound = '1';

  const i18n = JSON.parse(document.getElementById('tlI18n').textContent);
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 逐个 cycle 独立标注：每个周期各有自己的「下一站」
  for (const cycle of document.querySelectorAll('[data-cycle]')) {
    const steps = [...cycle.querySelectorAll('.step[data-ddl]')];
    let marked = false;

    for (const step of steps) {
      const date = parseDeadlineDate(step.dataset.ddl);
      const slot = step.querySelector('[data-days]');
      if (!date) continue;

      const days = Math.round((date - base) / 86400000);

      if (days < 0) {
        step.classList.add('past');
        continue;
      }

      // 第一个未过期的就是这个周期的「下一站」
      if (!marked) {
        step.classList.add('next');
        marked = true;
        if (slot) slot.textContent = days === 0 ? i18n.today : fmt(i18n.daysLeft, { __N__: String(days) });
      }
    }
  }
}
```

只给「下一站」显示天数，其余不标 —— 每个阶段都挂一串天数会把这一页变成数字墙，反而看不清重点。

- [ ] **Step 4: 注册与验收**

`boot.js` 追加 `registerPage('timeline', () => import('./timeline.js').then((m) => m.initTimeline()));`

Run: `npm run build` → 成功
Run: `grep -o 'data-ddl' dist/zh/timeline/index.html | wc -l` → 输出 40 以上

人工验收（`/zh/timeline/`）：

1. 4 个会议，每个有会期/地点/时区/最后同步四项，标题可点开官网。
2. 每个会议下的周期并排（宽屏）或堆叠（窄屏）。
3. 已过阶段整体压暗；每个周期**各自**有一个实心点 + 强调色边线的「下一站」，并显示还剩天数。
4. 全部阶段都已过去的周期 → 没有「下一站」标记，也**不显示负天数**。
5. 关掉 JS → 所有日期与阶段**完整可读**，只是没有倒计时标注。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(timeline): 投稿时间线页改为静态渲染 + 轻量倒计时

整页构建时渲染成静态 HTML，关掉 JS 也完整可读（原 PrimeVue Stepper 版本
需要 JS 才能出内容）。
JS 只做两件事：压暗已过阶段、标出每个周期各自的「下一站」并算天数。
只给「下一站」显示天数 —— 每个阶段都挂天数会把这页变成数字墙。
复用 deadlines.js 的日期解析，区间取结束日、TBA 跳过、不显示负天数。"
```

---

### Task 17: 获奖页

**Files:**
- Create: `src/pages/[lang]/awards.astro`
- Create: `src/scripts/awards-view.js`
- Modify: `src/scripts/boot.js`、`src/i18n/*.json`

**Interfaces:**
- Consumes: `totalPapers` / `groupByAward` / `groupByYear`（Task 7）
- Produces: `initAwardsView() => void`（幂等）

两种分组（按奖项 / 按年份）**都在构建时渲染**，JS 只切换显隐。这样关掉 JS 仍能看到全部获奖论文，代价是 HTML 里每篇论文出现两次 —— `awards.json` 只有 48KB，值得。

- [ ] **Step 1: 追加文案**

```json
// zh.json awards 内追加
"lead": "四大安全会议历年最佳论文、杰出论文与 Distinguished Paper 汇总。",
"allVenues": "全部会议",
"totalPapers": "共 {count} 篇"
```

```json
// en.json awards 内追加
"lead": "Best paper, outstanding paper and distinguished paper awards across the four major security venues.",
"allVenues": "All venues",
"totalPapers": "{count} papers"
```

- [ ] **Step 2: 实现获奖页**

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import { LOCALES, t } from '@/i18n/index.js';
import { totalPapers, groupByAward, groupByYear } from '@/lib/awards-model.js';
import awards from '@/assets/data/awards.json';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

const { lang } = Astro.params;
const nf = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US');

const confs = awards.map((c) => ({
  publication: c.publication,
  total: totalPapers(c),
  awardCount: c.awards.length,
  byAward: groupByAward(c),
  byYear: groupByYear(c),
}));
---

<PageLayout lang={lang} page="awards" title={t(lang, 'menu.awards')} lead={t(lang, 'awards.lead')}>

  <div class="bar">
    <div class="tabs" role="tablist" aria-label={t(lang, 'search.publication')}>
      {confs.map((c, i) => (
        <button type="button" role="tab" class="tab" data-conf={c.publication}
                aria-selected={i === 0 ? 'true' : 'false'}>
          {c.publication}
          <em>{nf.format(c.total)}</em>
        </button>
      ))}
    </div>

    <div class="group-toggle">
      <span class="kicker">{t(lang, 'awards.groupBy')}</span>
      <button type="button" class="gt" data-group="award" aria-pressed="true">{t(lang, 'awards.byType')}</button>
      <button type="button" class="gt" data-group="year" aria-pressed="false">{t(lang, 'awards.byYear')}</button>
    </div>
  </div>

  {confs.map((c, ci) => (
    <div class="panel-conf" data-conf-panel={c.publication} hidden={ci !== 0}>
      {[['award', c.byAward], ['year', c.byYear]].map(([mode, groups]) => (
        <div data-group-panel={mode} hidden={mode !== 'award'}>
          {groups.map((g) => (
            <section class="grp">
              <h2 class="ghead">
                <span class="srf">{g.label}</span>
                <em>{nf.format(g.count)}</em>
              </h2>
              <ul class="plist">
                {g.papers.map((p) => (
                  <li>
                    <span class="ttl srf">{p.title}</span>
                    <span class="badge">{mode === 'award' ? p.year : p.awardName}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ))}
    </div>
  ))}
</PageLayout>

<style>
  .bar {
    display: flex; flex-wrap: wrap; gap: 1rem; align-items: center;
    justify-content: space-between; margin-bottom: 1.5rem;
    padding-bottom: 0.9rem; border-bottom: 1px solid var(--hairline);
  }
  .tabs { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .tab {
    background: none; border: 1px solid var(--hairline); border-radius: var(--radius);
    padding: 0.35rem 0.7rem; cursor: pointer; font: inherit; font-size: var(--fs-small);
    color: var(--muted); display: inline-flex; align-items: baseline; gap: 0.4rem;
  }
  .tab em { font-style: normal; font-size: var(--fs-kicker); color: var(--faint); }
  .tab:hover { border-color: var(--ink); color: var(--ink); }
  .tab[aria-selected='true'] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .tab[aria-selected='true'] em { color: var(--bg); opacity: 0.65; }

  .group-toggle { display: flex; align-items: center; gap: 0.4rem; }
  .gt {
    background: none; border: 0; cursor: pointer; font: inherit;
    font-size: var(--fs-small); color: var(--faint); padding: 0.2rem 0.3rem;
  }
  .gt[aria-pressed='true'] { color: var(--ink); border-bottom: 1.5px solid var(--ink); }

  .grp { margin-bottom: 1.9rem; }
  .ghead {
    display: flex; align-items: baseline; gap: 0.6rem;
    font-size: var(--fs-h3); margin-bottom: 0.6rem;
    padding-bottom: 0.4rem; border-bottom: 1px solid var(--hairline-soft);
  }
  .ghead em { font-style: normal; font-size: var(--fs-kicker); color: var(--faint); }

  .plist { list-style: none; margin: 0; padding: 0; }
  .plist li {
    display: flex; gap: 0.9rem; align-items: baseline; justify-content: space-between;
    padding: 0.5rem 0; border-bottom: 1px solid var(--hairline-soft);
  }
  .ttl { font-size: 0.9rem; line-height: 1.5; }
  .badge {
    flex: none; font-size: var(--fs-kicker); color: var(--gold);
    border: 1px solid var(--gold); border-radius: var(--radius);
    padding: 0.05rem 0.4rem; white-space: nowrap;
  }
</style>
```

- [ ] **Step 3: 实现 awards-view.js**

```js
export function initAwardsView() {
  const bar = document.querySelector('.bar');
  if (!bar || bar.dataset.bound) return;
  bar.dataset.bound = '1';

  const conferences = [...document.querySelectorAll('[data-conf-panel]')];
  let mode = 'award';

  const showConf = (name) => {
    for (const panel of conferences) {
      panel.hidden = panel.dataset.confPanel !== name;
    }
    for (const tab of bar.querySelectorAll('.tab')) {
      tab.setAttribute('aria-selected', tab.dataset.conf === name ? 'true' : 'false');
    }
  };

  const showMode = (next) => {
    mode = next;
    for (const panel of document.querySelectorAll('[data-group-panel]')) {
      panel.hidden = panel.dataset.groupPanel !== mode;
    }
    for (const btn of bar.querySelectorAll('.gt')) {
      btn.setAttribute('aria-pressed', btn.dataset.group === mode ? 'true' : 'false');
    }
  };

  bar.addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (tab) return showConf(tab.dataset.conf);
    const gt = e.target.closest('.gt');
    if (gt) return showMode(gt.dataset.group);
  });
}
```

- [ ] **Step 4: 注册与验收**

`boot.js` 追加 `registerPage('awards', () => import('./awards-view.js').then((m) => m.initAwardsView()));`

Run: `npm run build` → 成功

人工验收（`/zh/awards/`）：

1. 顶部 4 个会议 tab，各带论文数；默认选中第一个。
2. 右侧「分组依据」两个选项，默认「按奖项种类」。
3. 切到「按年份」→ 分组变成年份降序，每篇论文右侧徽章从年份变成奖项名。
4. 切会议 tab → 内容跟着换，分组方式保持不变。
5. 关掉 JS → **所有会议、两种分组的内容全部可见**（只是没法切换）—— 这是构建时双份渲染换来的。
6. 切深色 → 金色徽章仍可读。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(awards): 获奖页重写，两种分组均构建时渲染

按奖项与按年份两种分组都在构建时渲染进 HTML，JS 只切显隐 ——
关掉 JS 仍能看到全部获奖论文。代价是每篇论文在 HTML 里出现两次，
但 awards.json 只有 48KB，值得。
原 PrimeVue Tabs + ToggleSwitch 版本需要 JS 才能出任何内容。"
```

---

### Task 18: 关于页与更多网站页

**Files:**
- Create: `src/data/changelog.js`
- Create: `src/data/sponsors.js`
- Create: `src/data/sites.js`
- Create: `src/pages/[lang]/about.astro`（替换 Task 4 的临时页）
- Create: `src/pages/[lang]/sites.astro`
- Create: `tests/changelog.test.js`
- Delete: `src/service/AboutService.js`、`src/service/AwardService.js`、`src/service/SubmissionTimelineService.js`、`src/service/GithubService.js`、`src/service/ThemeService.js`、`src/service/SettingsService.js`

**Interfaces:**
- Consumes: `t`（Task 2）
- Produces:
  - `CHANGELOG: Record<'zh'|'en', Array<{ version, date, items: string[] }>>`
  - `SPONSORS: Array<{ name, amount, date, comment }>`
  - `SITES: Array<{ key, url }>` —— 标题与描述走 i18n 的 `moreSites.list.<key>.*`

两页都是纯静态，零运行时 JS。

- [ ] **Step 1: 写 changelog 的失败测试**

更新日志是双语手写数据，最容易出现「中文加了一条、英文忘了加」。

```js
// tests/changelog.test.js
import { describe, it, expect } from 'vitest';
import { CHANGELOG, SPONSORS } from '@/data/changelog.js';
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
```

- [ ] **Step 2: 抽出内容数据**

`src/data/changelog.js` —— 把 `src/service/AboutService.js` 里 `updateTimelineData()` 的两个数组**原样搬过来**。

搬运规则（机械操作，逐条照做）：

- 源文件：`src/service/AboutService.js`，函数 `updateTimelineData()`，其中 `data.zh` 与 `data.en` 两个数组。
- **每个数组恰好 26 条**，搬完必须还是 26 条 —— `tests/changelog.test.js` 会断言两语条数相等，但**不会**发现两边同时漏了同一条，所以搬完手动数一遍。
- 字段改名两处：`status` → `version`，`content` → `items`。`date` 不变。
- 唯一需要改内容的是 `v0.2.0` 那条：源数据里 zh 是 `'v0.2.0 里程碑'`、en 是 `'v0.2.0 Milestone'`。版本号统一成 `'v0.2.0'`，把后缀移到 `items` 的第一项（zh 加 `'🎉 里程碑'`、en 加 `'🎉 Milestone'`）。否则「版本号逐条对齐」的测试会失败。
- 其余 25 条的版本号在两语里本来就一致，不要动。

```js
// src/data/changelog.js
export const CHANGELOG = {
  zh: [
    { version: 'v0.3.12', date: '2026-04-16', items: ['✨ 在`其他`下新增`更多网站`页面', '更新投稿时间线至 NDSS 2027', '美化`论文摘要`页', '美化`标题检索`表格'] },
    // …按上述规则照搬 AboutService.js 的 data.zh 余下 25 条（v0.3.11 一直到 v0.1.0）
  ],
  en: [
    { version: 'v0.3.12', date: '2026-04-16', items: ['✨ Add `More Sites` page under Misc with curated resources', 'Update Submission Timeline to NDSS 2027', 'Beautify `Abstract` page', 'Beautify `Search` table'] },
    // …按上述规则照搬 AboutService.js 的 data.en 余下 25 条（逐条与 zh 对齐）
  ],
};

export const SPONSORS = [
  { name: '爱发电用户_a3458', amount: '20 RMB', date: '2025-12-02', comment: '很有帮助的网站！（如果可以的话，希望之后可以再多加一些软工那边的会议）' },
  { name: 'cy', amount: '66 RMB', date: '2025-01-21', comment: '' },
  { name: 'k*j', amount: '20 RMB', date: '2025-01-21', comment: '感谢开发的secpaper网站，省了不少时间' },
];
```

注意 `v0.2.0` 那条在 zh 里是 `'v0.2.0 里程碑'`、en 里是 `'v0.2.0 Milestone'` —— 版本号必须逐条对齐的测试会因此失败。把版本号统一成 `'v0.2.0'`，「里程碑 / Milestone」作为 `items` 的第一条：`'🎉 里程碑'` / `'🎉 Milestone'`。

```js
// src/data/sites.js
export const SITES = [
  { key: 'bestPaperAwards', url: 'https://jeffhuang.com/best_paper_awards/' },
  { key: 'ccfddl', url: 'https://ccfddl.top/' },
  { key: 'ccfRecommend', url: 'https://ccf.atom.im/' },
  { key: 'connectedPapers', url: 'https://www.connectedpapers.com/' },
  { key: 'wisPaper', url: 'https://wispaper.ai/' },
  { key: 'csPapers', url: 'https://cspapers.org/' },
];
```

- [ ] **Step 3: 实现关于页**

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import { LOCALES, t } from '@/i18n/index.js';
import { CHANGELOG, SPONSORS } from '@/data/changelog.js';
import stats from '@/assets/data/data-statistics.json';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

const { lang } = Astro.params;
const entries = CHANGELOG[lang] ?? CHANGELOG.en;
const nf = new Intl.NumberFormat(lang === 'zh' ? 'zh-CN' : 'en-US');
---

<PageLayout lang={lang} page="about" title={t(lang, 'menu.about')}
            lead={t(lang, 'aboutPage.lead', { total: nf.format(stats.total) })}>

  <section class="sec" data-reveal>
    <h2 class="kicker">{t(lang, 'about.timeline')}</h2>
    <ol class="log">
      {entries.map((e) => (
        <li class="entry">
          <div class="meta">
            <span class="srf ver">{e.version}</span>
            <span class="date">{e.date}</span>
          </div>
          <ul class="items">
            {e.items.map((it) => <li>{it}</li>)}
          </ul>
        </li>
      ))}
    </ol>
  </section>

  <section class="sec" data-reveal>
    <h2 class="kicker">{t(lang, 'about.sponsors')}</h2>
    <ul class="sponsors">
      {SPONSORS.map((s) => (
        <li>
          <div class="srow">
            <span class="sname">{s.name}</span>
            <span class="samt">{s.amount}</span>
            <span class="sdate">{s.date}</span>
          </div>
          {s.comment && <p class="scomment">{s.comment}</p>}
        </li>
      ))}
    </ul>
  </section>
</PageLayout>

<style>
  .sec { margin-bottom: var(--sp-band); }
  .sec > .kicker { margin-bottom: 1rem; }

  .log { list-style: none; margin: 0; padding: 0; }
  .entry {
    display: grid; grid-template-columns: 9rem 1fr; gap: 1.2rem;
    padding: 0.9rem 0; border-top: 1px solid var(--hairline-soft);
  }
  .entry:first-child { border-top: 0; }
  .meta { display: flex; flex-direction: column; gap: 0.2rem; }
  .ver { font-size: 0.95rem; }
  .date { font-size: var(--fs-kicker); color: var(--faint); font-variant-numeric: tabular-nums; }

  .items { list-style: none; margin: 0; padding: 0; }
  .items li {
    font-size: var(--fs-small); color: var(--muted); line-height: 1.7;
    padding-left: 0.9rem; position: relative;
  }
  .items li::before {
    content: '·'; position: absolute; left: 0.2rem; color: var(--faint);
  }

  .sponsors { list-style: none; margin: 0; padding: 0; }
  .sponsors > li { padding: 0.7rem 0; border-top: 1px solid var(--hairline-soft); }
  .sponsors > li:first-child { border-top: 0; }
  .srow { display: flex; gap: 0.8rem; align-items: baseline; font-size: var(--fs-small); }
  .sname { color: var(--ink); }
  .samt { color: var(--accent); }
  .sdate { margin-left: auto; color: var(--faint); font-size: var(--fs-kicker); }
  .scomment { margin: 0.3rem 0 0; font-size: var(--fs-kicker); color: var(--muted); line-height: 1.7; }

  @media (max-width: 640px) {
    .entry { grid-template-columns: 1fr; gap: 0.4rem; }
    .meta { flex-direction: row; align-items: baseline; gap: 0.6rem; }
  }
</style>
```

- [ ] **Step 4: 实现更多网站页**

原实现从外部服务抓 favicon。这里**去掉 favicon**，改用主机名文字 —— 少一批第三方请求，也更合编辑风的克制调性。

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import { LOCALES, t } from '@/i18n/index.js';
import { SITES } from '@/data/sites.js';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

const { lang } = Astro.params;
const cards = SITES.map((s) => ({
  ...s,
  host: new URL(s.url).hostname.replace(/^www\./, ''),
  title: t(lang, `moreSites.list.${s.key}.title`),
  desc: t(lang, `moreSites.list.${s.key}.desc`),
}));
---

<PageLayout lang={lang} page="sites" title={t(lang, 'moreSites.title')}
            lead={t(lang, 'moreSites.subtitle')}>
  <ul class="grid">
    {cards.map((c) => (
      <li data-reveal>
        <a class="card" href={c.url} target="_blank" rel="noopener">
          <span class="host">{c.host}</span>
          <span class="srf ttl">{c.title}</span>
          <span class="desc">{c.desc}</span>
          <span class="arrow" aria-hidden="true">↗</span>
        </a>
      </li>
    ))}
  </ul>
</PageLayout>

<style>
  .grid {
    list-style: none; margin: 0; padding: 0;
    display: grid; grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
    gap: 1px; background: var(--hairline);
    border: 1px solid var(--hairline);
  }
  .card {
    display: block; position: relative; background: var(--bg);
    padding: 1.05rem 1.15rem 1.15rem; height: 100%;
    transition: background-color var(--dur) var(--ease);
  }
  .card:hover { background: var(--band); }
  .host { display: block; font-size: var(--fs-kicker); color: var(--faint); margin-bottom: 0.5rem; }
  .ttl { display: block; font-size: 0.98rem; line-height: 1.4; margin-bottom: 0.45rem; }
  .card:hover .ttl { color: var(--accent); }
  .desc { display: block; font-size: var(--fs-kicker); line-height: 1.75; color: var(--muted); }
  .arrow {
    position: absolute; top: 1rem; right: 1.1rem;
    font-size: 0.7rem; color: var(--hairline);
  }
  .card:hover .arrow { color: var(--accent); }
</style>
```

追加文案 `aboutPage.lead`（两语），删掉旧 service 目录：

```bash
git rm -f src/service/AboutService.js src/service/AwardService.js \
          src/service/SubmissionTimelineService.js src/service/GithubService.js \
          src/service/ThemeService.js src/service/SettingsService.js
rmdir src/service 2>/dev/null || true
```

- [ ] **Step 5: 验收**

Run: `npx vitest run tests/changelog.test.js` → PASS

若「两语条目数一致」或「版本号逐条对齐」失败，说明搬运时漏了条目或 `v0.2.0` 的里程碑后缀没处理 —— 修数据，别改测试。

Run: `npm run build` → 成功

人工验收：`/zh/about/` 更新日志 25 条、版本号与日期左侧对齐、赞助者三条；`/zh/sites/` 六张卡片、1px 细线网格、hover 变底色、点开新标签；`/en/` 两页文案全英文。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(pages): 关于页与更多网站页，零运行时 JS

更新日志与赞助者数据从 AboutService.js 抽到 src/data/，
status→version、content→items。
补测试：两语条目数与版本号/日期逐条对齐 ——
双语手写数据最容易「中文加了一条、英文忘了加」。
v0.2.0 的「里程碑 / Milestone」从版本号移到变更项，让版本号两语可对齐。
更多网站去掉从第三方服务抓的 favicon，改用主机名文字：少一批外部请求，
也更合编辑风的克制调性。
删除全部旧 service 文件（cdn.js 已在 Task 11 迁至 src/lib/）。"
```

---

### Task 19: 设置页

**Files:**
- Create: `src/pages/[lang]/settings.astro`
- Create: `src/scripts/settings-form.js`
- Modify: `src/scripts/settings-store.js`（Step 0 前置：`persistent` 改为写-only 语义）
- Modify: `tests/settings-store.test.js`（Step 0 的新测试）
- Modify: `src/scripts/boot.js`、`src/i18n/*.json`

**Interfaces:**
- Consumes: `getSettings` / `patchSettings` / `getFavorites` / `clearFavorites` / `isPersistent`（Task 10）、`ACCENTS`（Task 10）
- Produces: `initSettingsForm() => Promise<void>`（幂等）

改动点：删掉两个 LLM 输入框（全站无消费方），主题色从任意调色改为 4 个精选强调色，加一个收藏管理入口。表单**即改即存**，不要「保存」按钮 —— 原实现有保存按钮 + toast，但这些偏好都是即时生效的开关，多一步确认没有意义。

- [ ] **Step 0（前置）：把 `persistent` 改成「写-only」语义**

本页要用 `isPersistent()` 渲染「存储降级」提示，所以先把这个标志的语义收紧，**否则提示会说谎**。

Task 10 的最终审阅发现（那是我在 Task 10 round 4 自己引入的问题，当时已到五轮上限、故记录下来留到这里修）：`idbGet` 的 `onsuccess` 里也设了 `persistent = true`，于是**一次成功的读会把降级标志清掉，而写可能仍在失败**。这不是刁钻情形 —— 浏览器的 `QuotaExceededError` 正是在写入（要增长存储）时抛出、读取既有数据不受影响。所以「读得到、写不进」恰恰是配额耗尽的典型形态。而本页那句提示的意思是「你的偏好保存不了」，一次成功的读对这件事什么都没证明。

改法：`src/scripts/settings-store.js` 里

1. **删掉 `idbGet` 的 `onsuccess` 中那行 `persistent = true;`**（保留它的 `resolve`）。
2. **删掉 `openDb` 的 `onsuccess` 中那行 `persistent = true;`** —— 连接开得起来同样不证明写得进去。保留同处的 `db.onclose` 处理。
3. 只保留 `idbPut` 的 `onsuccess` 里那一行。语义随之变成：**只有一次真实写入成功，才认为存储在正常工作**；任何失败仍照旧置 `false`；模块初值 `true` 是「尚无失败证据」的乐观起点。
4. 把 `persistent` 声明处的说明同步改成这个新语义，并写明为什么读不算证据。

已核对：现有三条恢复测试（`瞬时失败后重试成功`、`连接健康但事务失败后又成功`、`clearFavorites 成功后也能收回标志`）在断言前都经过写操作，所以这个改动**不会让它们变红**。

再补一条测试，锁住新语义：

```js
  it('只有读成功不足以清掉降级标志 —— 写不进就该一直显示降级', async () => {
    // 配额耗尽的典型形态就是「读得到、写不进」。设置页那句提示的意思是
    // 「你的偏好保存不了」，一次成功的读对这件事什么都没证明。
    const s = await freshStore();
    await s.patchSettings({ keywords: ['x'] });   // 先确保库里有东西可读

    const realPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      const req = {};
      setTimeout(() => req.onerror && req.onerror(), 0);
      return req;
    };

    try {
      await s.patchSettings({ theme: 'pine' });   // 写失败
      expect(s.isPersistent()).toBe(false);

      // 读是成功的（数据还在），但写仍然坏着 —— 标志必须保持 false
      await expect(s.getSettings()).resolves.toBeTruthy();
      expect(s.isPersistent()).toBe(false);

      await expect(s.getFavorites()).resolves.toEqual([]);
      expect(s.isPersistent()).toBe(false);
    } finally {
      IDBObjectStore.prototype.put = realPut;
    }
  });
```

顺带把 `idbGet` 那行删掉后遗留的覆盖不对称也补上 —— Task 10 的审阅指出 `idbPut` 那行有 `clearFavorites` 测试单独隔离验证，而 `idbGet` 那行从来没有。删掉之后这个不对称自然消失，无需另加测试。

改完跑 `npx vitest run tests/settings-store.test.js`（应为 29 条）与 `npm run build`。

- [ ] **Step 1: 追加文案**

```json
// zh.json settings 内追加（并删除 form.llmUrl 与 form.llmKey 两个对象）
"accent": { "label": "强调色", "desc": "用于链接、图表与高亮的单一强调色。" },
"accentNames": { "slate": "深石青", "indigo": "墨蓝", "oxblood": "赤赭", "pine": "松绿" },
"darkMode": { "label": "深色模式", "desc": "也可以点顶栏的 ◑ 随时切换。" },
"favorites": { "label": "收藏的论文", "desc": "共 {count} 篇。清空后无法恢复。", "clear": "清空收藏", "confirm": "确定要清空全部收藏吗？此操作无法撤销。", "cleared": "已清空" },
"keywordRemove": "移除关键词 {word}",
"autoSaved": "已自动保存"
```

```json
// en.json settings 内追加（同样删除 form.llmUrl 与 form.llmKey）
"accent": { "label": "Accent color", "desc": "The single accent used for links, charts and highlights." },
"accentNames": { "slate": "Slate", "indigo": "Ink blue", "oxblood": "Oxblood", "pine": "Pine" },
"darkMode": { "label": "Dark mode", "desc": "You can also toggle it any time with ◑ in the top bar." },
"favorites": { "label": "Saved papers", "desc": "{count} saved. Clearing cannot be undone.", "clear": "Clear favorites", "confirm": "Clear all saved papers? This cannot be undone.", "cleared": "Cleared" },
"keywordRemove": "Remove keyword {word}",
"autoSaved": "Saved automatically"
```

- [ ] **Step 2: 实现设置页**

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import { LOCALES, t } from '@/i18n/index.js';
import { ACCENTS } from '@/lib/settings-schema.js';

export function getStaticPaths() {
  return LOCALES.map((lang) => ({ params: { lang } }));
}

const { lang } = Astro.params;

const toggles = [
  { key: 'darkTheme', label: t(lang, 'settings.darkMode.label'), desc: t(lang, 'settings.darkMode.desc') },
  { key: 'rememberDarkMode', label: t(lang, 'settings.form.rememberDarkMode.label'), desc: t(lang, 'settings.form.rememberDarkMode.desc') },
  { key: 'rememberTheme', label: t(lang, 'settings.form.rememberTheme.label'), desc: t(lang, 'settings.form.rememberTheme.desc') },
  { key: 'rememberLanguage', label: t(lang, 'settings.form.rememberLanguage.label'), desc: t(lang, 'settings.form.rememberLanguage.desc') },
  { key: 'showStatusDots', label: t(lang, 'settings.form.showStatusDots.label'), desc: t(lang, 'settings.form.showStatusDots.desc') },
];
---

<PageLayout lang={lang} page="settings" title={t(lang, 'menu.settings')}
            lead={t(lang, 'settings.subtitle')}>

  <p class="privacy" data-reveal>{t(lang, 'settings.privacyNotice')}</p>
  <p class="warn" id="stWarn" hidden>{t(lang, 'settings.unsupported.desc')}</p>

  <section class="row" data-reveal>
    <div class="label">
      <div class="lt">{t(lang, 'settings.accent.label')}</div>
      <p class="ld">{t(lang, 'settings.accent.desc')}</p>
    </div>
    <div class="control swatches" role="radiogroup" aria-label={t(lang, 'settings.accent.label')}>
      {ACCENTS.map((a) => (
        <button type="button" role="radio" class="sw" data-accent-pick={a}
                aria-checked="false" title={t(lang, `settings.accentNames.${a}`)}>
          <i data-accent-swatch={a}></i>
          <span>{t(lang, `settings.accentNames.${a}`)}</span>
        </button>
      ))}
    </div>
  </section>

  {toggles.map((tg) => (
    <section class="row" data-reveal>
      <div class="label">
        <div class="lt">{tg.label}</div>
        <p class="ld">{tg.desc}</p>
      </div>
      <div class="control">
        <button type="button" class="switch" data-toggle={tg.key} aria-pressed="false">
          <span class="knob"></span>
        </button>
      </div>
    </section>
  ))}

  <section class="row" data-reveal>
    <div class="label">
      <div class="lt">{t(lang, 'settings.form.keywords.label')}</div>
      <p class="ld">{t(lang, 'settings.form.keywords.desc')}</p>
    </div>
    <div class="control">
      <div class="kwadd">
        <input type="text" id="kwInput" placeholder={t(lang, 'settings.form.keywords.placeholder')} />
        <button type="button" id="kwAdd">{t(lang, 'settings.form.keywords.add')}</button>
      </div>
      <div class="kwlist" id="kwList"></div>
    </div>
  </section>

  <section class="row" data-reveal>
    <div class="label">
      <div class="lt">{t(lang, 'settings.favorites.label')}</div>
      <p class="ld" id="favDesc">{t(lang, 'settings.favorites.desc', { count: '…' })}</p>
    </div>
    <div class="control">
      <button type="button" class="danger" id="favClear">{t(lang, 'settings.favorites.clear')}</button>
    </div>
  </section>

  <p class="saved" id="stSaved" hidden>{t(lang, 'settings.autoSaved')}</p>

  <script type="application/json" id="stI18n" set:html={JSON.stringify({
    favDesc: t(lang, 'settings.favorites.desc', { count: '__N__' }),
    confirm: t(lang, 'settings.favorites.confirm'),
    cleared: t(lang, 'settings.favorites.cleared'),
    remove: t(lang, 'settings.keywordRemove', { word: '__W__' }),
    autoSaved: t(lang, 'settings.autoSaved'),
  })} />
</PageLayout>

<style>
  .privacy, .warn {
    font-size: var(--fs-kicker); line-height: 1.75; color: var(--muted);
    border-left: 2px solid var(--hairline); padding: 0.5rem 0 0.5rem 0.8rem;
    margin: 0 0 1.6rem;
  }
  .warn { border-left-color: var(--gold); color: var(--ink); }

  .row {
    display: grid; grid-template-columns: 1fr auto; gap: 1.5rem; align-items: start;
    padding: 1rem 0; border-top: 1px solid var(--hairline-soft);
  }
  .lt { font-size: var(--fs-small); color: var(--ink); }
  .ld { margin: 0.25rem 0 0; font-size: var(--fs-kicker); color: var(--faint); line-height: 1.7; max-width: 34rem; }
  .control { justify-self: end; }

  .swatches { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .sw {
    display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer;
    background: none; border: 1px solid var(--hairline); border-radius: var(--radius);
    padding: 0.3rem 0.55rem; font: inherit; font-size: var(--fs-kicker); color: var(--muted);
  }
  .sw i { width: 11px; height: 11px; display: block; }
  .sw:hover { border-color: var(--ink); color: var(--ink); }
  .sw[aria-checked='true'] { border-color: var(--ink); color: var(--ink); }
  /* 色块要显示各自的颜色，而不是当前生效的 --accent */
  i[data-accent-swatch='slate'] { background: #2f4858; }
  i[data-accent-swatch='indigo'] { background: #3a3f7a; }
  i[data-accent-swatch='oxblood'] { background: #7d3038; }
  i[data-accent-swatch='pine'] { background: #2f5744; }
  html[data-theme='dark'] i[data-accent-swatch='slate'] { background: #7fa8bd; }
  html[data-theme='dark'] i[data-accent-swatch='indigo'] { background: #9aa0dd; }
  html[data-theme='dark'] i[data-accent-swatch='oxblood'] { background: #d9868f; }
  html[data-theme='dark'] i[data-accent-swatch='pine'] { background: #83bda1; }

  .switch {
    width: 2.4rem; height: 1.25rem; border: 1px solid var(--hairline);
    border-radius: 0.65rem; background: none; cursor: pointer; padding: 0;
    position: relative; transition: border-color var(--dur) var(--ease), background-color var(--dur) var(--ease);
  }
  .knob {
    position: absolute; top: 2px; left: 2px; width: 0.95rem; height: 0.95rem;
    background: var(--faint); border-radius: 50%;
    transition: transform var(--dur) var(--ease), background-color var(--dur) var(--ease);
  }
  .switch[aria-pressed='true'] { border-color: var(--accent); background: var(--accent-soft); }
  .switch[aria-pressed='true'] .knob { transform: translateX(1.13rem); background: var(--accent); }

  .kwadd { display: flex; gap: 0.35rem; }
  .kwadd input {
    border: 1px solid var(--hairline); border-radius: var(--radius); background: none;
    color: var(--ink); font: inherit; font-size: var(--fs-small); padding: 0.35rem 0.5rem; width: 11rem;
  }
  .kwadd input:focus { border-color: var(--ink); outline: none; }
  .kwadd button, .danger {
    background: none; border: 1px solid var(--hairline); border-radius: var(--radius);
    cursor: pointer; font: inherit; font-size: var(--fs-small); color: var(--ink);
    padding: 0.35rem 0.7rem;
  }
  .kwadd button:hover { border-color: var(--ink); }
  .danger:hover { border-color: var(--gold); color: var(--gold); }

  .kwlist { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.5rem; justify-content: flex-end; }
  .kw {
    display: inline-flex; align-items: center; gap: 0.3rem;
    border: 1px solid var(--hairline); border-radius: var(--radius);
    padding: 0.1rem 0.2rem 0.1rem 0.45rem; font-size: var(--fs-kicker); color: var(--muted);
  }
  .kw button {
    background: none; border: 0; cursor: pointer; color: var(--faint);
    font: inherit; padding: 0 0.2rem; line-height: 1;
  }
  .kw button:hover { color: var(--gold); }

  .saved {
    margin: 1.2rem 0 0; font-size: var(--fs-kicker); color: var(--accent);
  }

  @media (max-width: 640px) {
    .row { grid-template-columns: 1fr; gap: 0.7rem; }
    .control { justify-self: start; }
    .kwlist { justify-content: flex-start; }
  }
</style>
```

- [ ] **Step 3: 实现 settings-form.js**

```js
import { getSettings, patchSettings, getFavorites, clearFavorites, isPersistent } from './settings-store.js';
import { applyTheme } from './theme.js';
import { ACCENTS } from '@/lib/settings-schema.js';

const fmt = (tpl, map) => Object.entries(map).reduce((s, [k, v]) => s.replaceAll(k, v), tpl);

let i18n = {};
let savedTimer;

function flashSaved() {
  const el = document.getElementById('stSaved');
  if (!el) return;
  el.hidden = false;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { el.hidden = true; }, 1600);
}

function renderKeywords(list, keywords, onRemove) {
  list.replaceChildren();
  for (const word of keywords) {
    const chip = document.createElement('span');
    chip.className = 'kw';
    chip.append(document.createTextNode(word));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '×';
    btn.setAttribute('aria-label', fmt(i18n.remove, { __W__: word }));
    btn.addEventListener('click', () => onRemove(word));
    chip.appendChild(btn);
    list.appendChild(chip);
  }
}

export async function initSettingsForm() {
  const warn = document.getElementById('stWarn');
  const kwList = document.getElementById('kwList');
  if (!kwList || kwList.dataset.bound) return;
  kwList.dataset.bound = '1';

  i18n = JSON.parse(document.getElementById('stI18n').textContent);

  let settings = await getSettings();
  if (!isPersistent() && warn) warn.hidden = false;

  const save = async (patch) => {
    settings = await patchSettings(patch);
    flashSaved();
    return settings;
  };

  // ── 强调色 ──────────────────────────────────────────
  const paintAccent = () => {
    for (const btn of document.querySelectorAll('[data-accent-pick]')) {
      btn.setAttribute('aria-checked', btn.dataset.accentPick === settings.theme ? 'true' : 'false');
    }
  };
  for (const btn of document.querySelectorAll('[data-accent-pick]')) {
    btn.addEventListener('click', async () => {
      const accent = btn.dataset.accentPick;
      if (!ACCENTS.includes(accent)) return;
      applyTheme(document.documentElement.dataset.theme, accent);
      await save({ theme: accent, rememberTheme: true });
      paintAccent();
    });
  }
  paintAccent();

  // ── 开关 ────────────────────────────────────────────
  const paintToggles = () => {
    for (const btn of document.querySelectorAll('[data-toggle]')) {
      btn.setAttribute('aria-pressed', settings[btn.dataset.toggle] ? 'true' : 'false');
    }
  };
  for (const btn of document.querySelectorAll('[data-toggle]')) {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.toggle;
      const next = !settings[key];
      // 深色开关要立刻作用到页面，不能等下次刷新
      if (key === 'darkTheme') {
        applyTheme(next ? 'dark' : 'light', document.documentElement.dataset.accent);
        await save({ darkTheme: next, rememberDarkMode: true });
      } else {
        await save({ [key]: next });
      }
      paintToggles();
    });
  }
  paintToggles();

  // ── 关键词 ──────────────────────────────────────────
  const input = document.getElementById('kwInput');
  const addBtn = document.getElementById('kwAdd');

  const removeKeyword = async (word) => {
    await save({ keywords: settings.keywords.filter((k) => k !== word) });
    renderKeywords(kwList, settings.keywords, removeKeyword);
  };

  const addKeyword = async () => {
    const word = input.value.trim();
    if (!word) return;
    // 去重时忽略大小写：高亮本身就是大小写不敏感的，存两份没意义
    if (settings.keywords.some((k) => k.toLowerCase() === word.toLowerCase())) {
      input.value = '';
      return;
    }
    await save({ keywords: [...settings.keywords, word] });
    input.value = '';
    renderKeywords(kwList, settings.keywords, removeKeyword);
  };

  addBtn.addEventListener('click', addKeyword);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  });
  renderKeywords(kwList, settings.keywords, removeKeyword);

  // ── 收藏 ────────────────────────────────────────────
  const favDesc = document.getElementById('favDesc');
  const favClear = document.getElementById('favClear');
  const paintFav = async () => {
    const favs = await getFavorites();
    favDesc.textContent = fmt(i18n.favDesc, { __N__: String(favs.length) });
    favClear.disabled = favs.length === 0;
  };
  favClear.addEventListener('click', async () => {
    if (!window.confirm(i18n.confirm)) return;
    await clearFavorites();
    await paintFav();
    flashSaved();
  });
  await paintFav();
}
```

- [ ] **Step 4: 注册与验收**

`boot.js` 追加 `registerPage('settings', () => import('./settings-form.js').then((m) => m.initSettingsForm()));`

Run: `npx vitest run` → PASS
Run: `npm run build` → 成功
Run: `grep -ri "llmEndpoint\|llmApiKey\|llmUrl\|llmKey" src/ dist/ && echo "⚠ LLM 残留" || echo "✓ LLM 字段已清净"`
Expected: 打印 `✓ LLM 字段已清净`

人工验收（`/zh/settings/`）：

1. 四个色块显示各自颜色（**不是**当前生效的强调色）；点一个 → 整站强调色立刻变，该块被标为选中。
2. 「深色模式」开关 → 页面立刻变深，顶栏 ◑ 状态一致。
3. 每次改动右下出现「已自动保存」，1.6 秒后消失；**没有保存按钮**。
4. 加关键词 `fuzzing` → chip 出现；再加 `FUZZING` → 不重复添加。
5. 去检索页确认标题里 `fuzzing` 被高亮；回设置页移除 → 高亮消失。
6. 收藏数正确；无收藏时「清空收藏」按钮禁用；有收藏时点它 → 弹确认 → 确认后数字归零。
7. 刷新页面 → 所有设置保持。
8. 无痕窗口打开 → 顶部出现「无法本地持久化」提示，但所有开关**仍可操作**、Console 无红字。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(settings): 设置页重写

删掉两个 LLM 输入框 —— 全站无任何消费方，LLM 分析实际由 Python 侧读 .env 执行。
主题色从任意调色改为 4 个精选强调色；色块显示各自颜色而非当前生效色。
改为即改即存，去掉保存按钮与 toast —— 这些偏好都是即时生效的开关，
多一步确认没有意义。
关键词去重忽略大小写：高亮本身就是大小写不敏感的。
新增收藏管理入口（计数 + 清空，带确认）。
IndexedDB 不可用时提示降级但所有开关仍可操作。"
```

---

### Task 20: 清理、文档与版本

**Files:**
- Delete: `src/App.vue`、`src/main.js`、`src/assets/styles.scss`、`src/assets/tailwind.css`、`src/assets/layout/`、`src/assets/demo/`、`src/assets/images/`、`src/layout/`、`src/views/`、`src/components/dashboard/`、`src/components/FloatingConfigurator.vue`
- Modify: `package.json`（版本 0.4.0）
- Modify: `src/data/changelog.js`（追加 0.4.0 条目）
- Modify: `CLAUDE.md`、`README.md`、`README_zh.md`
- Delete: `build-and-deploy.sh`（若其中的检查已不适用）
- Create: `tests/no-legacy.test.js`

**Interfaces:**
- Consumes: 全部
- Produces: 干净的仓库 + 更新的文档

- [ ] **Step 1: 写「无遗留」守卫测试**

这个测试防止清理不彻底，也防止以后有人不小心把 Vue/Tailwind 依赖加回来。

```js
// tests/no-legacy.test.js
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
```

- [ ] **Step 2: 跑测试，按报错逐个删干净**

Run: `npx vitest run tests/no-legacy.test.js`
Expected: 先 FAIL，列出所有残留

```bash
git rm -rf src/views src/layout src/components/dashboard
git rm -f src/App.vue src/main.js src/components/FloatingConfigurator.vue
git rm -rf src/assets/layout src/assets/demo src/assets/images
git rm -f src/assets/styles.scss src/assets/tailwind.css
```

`src/assets/images/flags_responsive.png` 是旧语言切换器的国旗雪碧图，新的 `LangSwitch` 用文字，不再需要。

反复跑测试直到 PASS。

- [ ] **Step 3: 处理 build-and-deploy.sh**

它检查 `dist/index.html` 是否存在 —— 新站的 `dist/index.html` 是语言分发页，检查仍然有效。但脚本对 MPA 没有额外价值，且 `npm run deploy:build` 已经覆盖同样流程。删掉以免两套并存：

```bash
git rm -f build-and-deploy.sh
```

若你想保留，至少把检查项从 `dist/index.html` 扩展为同时检查 `dist/zh/index.html` 与 `dist/en/index.html` —— 只检查前者的话，两语页面全部生成失败也能通过。

- [ ] **Step 4: 版本推到 0.4.0 并补更新日志**

`package.json` 里 `"version": "0.4.0"`。

`src/data/changelog.js` 两个数组**开头**各插一条：

```js
// zh 数组第一条
{ version: 'v0.4.0', date: '2026-07-25', items: [
  '🎉 里程碑：全站用 Astro 重写，从单页应用改为静态多页',
  '✨ 全新首页：随滚动淡入的分块功能介绍，含 10 会议 × 12 年的收录覆盖矩阵',
  '✨ 左侧导航栏改为顶部导航栏，核心 5 项一次点击直达',
  '✨ 页面切换改为淡入淡出',
  '中英文改为分语言预渲染（/zh/ 与 /en/），旧链接自动跳转',
  '移除 PrimeVue 与 Tailwind，改为手写设计系统；主题色收窄为 4 个精选强调色',
  '获奖论文、投稿时间线、关于、更多网站四页改为纯静态，关掉 JS 也完整可读',
  '检索页首屏 30 篇改为构建时预渲染，CDN 异常时仍可读可筛',
  '移除无实际作用的大模型接口设置项',
  '收藏与偏好关键词的本地数据完整保留',
] },

// en 数组第一条
{ version: 'v0.4.0', date: '2026-07-25', items: [
  '🎉 Milestone: rewritten on Astro, from single-page app to static multi-page',
  '✨ New home page: scroll-revealed feature sections and a 10-venue × 12-year coverage matrix',
  '✨ Sidebar navigation replaced by a top bar, all five core pages one click away',
  '✨ Cross-page fade transitions',
  'Chinese and English are now prerendered per language (/zh/ and /en/); old links redirect automatically',
  'Removed PrimeVue and Tailwind in favor of a hand-written design system; accent colors narrowed to four',
  'Awards, submission timeline, about and more-sites are now fully static and readable without JS',
  'Search page prerenders its first 30 rows, so it stays readable and filterable if the CDN fails',
  'Removed the LLM endpoint settings, which had no effect',
  'Existing favorites and watched keywords are preserved',
] },
```

`tests/changelog.test.js` 的「日期降序」与「两语逐条对齐」会自动验证插入是否正确。

- [ ] **Step 4b: 清掉没人消费的孤儿文案 key**

Vue 时代的文案表有 165 个 key，删掉 `src/views/` 与 `src/components/dashboard/` 之后，其中相当一部分再没有任何消费方（`configurator.*`、`nav.*`、`test.*`、`dashboard.*`、`papers.*` 等整组，以及 `menu.main`/`menu.home` 这类只在旧侧边栏分组里用过的条目）。留着它们会让文案表越读越像考古现场，也会让「漂移守卫」在两语间维护一堆死条目。

已知的一处重复必须处理：`notFound.message` 与 `notFound.backHome` 是 Vue 时代遗留，Task 6 新增的 `notFound.desc` 与 `notFound.back` 是同一语义的新键（Task 6 按「只增不改」的约束没有动旧键，处理正确）。旧的两个已无消费方，在此删除。

先跑这个脚本列出孤儿，**不要凭印象删**：

```bash
python3 - <<'PY'
import json, re, subprocess, sys

keys = set()
def walk(o, p=''):
    if isinstance(o, dict):
        for k, v in o.items(): walk(v, f'{p}.{k}' if p else k)
    else: keys.add(p)
walk(json.load(open('src/i18n/zh.json')))

# 收集 src/ 下所有源码文本（排除文案表自身）
src = subprocess.run(
    ['grep', '-rh', '-oE', r"'[a-zA-Z][a-zA-Z0-9_.]*'", 'src/',
     '--include=*.astro', '--include=*.js', '--include=*.ts'],
    capture_output=True, text=True).stdout
used = set(m.strip("'") for m in src.split('\n') if m)

orphans = sorted(k for k in keys if k not in used)
print(f'共 {len(keys)} 个 key，其中 {len(orphans)} 个无消费方：')
for k in orphans: print('  ', k)
PY
```

判断规则：脚本报出的孤儿里，**凡是本计划任何页面都不会用到的，删掉两语对应条目**。拿不准的留着（宁可多留一条死文案，也不要删掉某个页面真在用的 key —— `t()` 缺 key 会让构建失败，所以删错了会立刻暴露，但那是在你已经提交之后）。删完必须跑 `npm test`（漂移守卫会确认两语仍然对齐）与 `npm run build`（任何被误删的 key 都会让构建当场失败）。

把删掉的 key 数量与清单写进报告。

- [ ] **Step 5: 更新 CLAUDE.md**

替换 `### Frontend (JavaScript/Vue)` 整节与 `### Vue frontend (src/)` 整节：

```markdown
### Frontend (Astro)
```bash
npm run dev      # Astro dev server（含 /data/** → src/assets/data/** 的开发中间件）
npm run build    # 静态构建到 dist/
npm run preview  # 预览构建产物
npm run check    # astro check
npm test         # vitest run
npm run deploy   # 部署 dist/ 到 GitHub Pages
npm run deploy:build
```

Frontend is Astro 7 with hand-written CSS (no UI framework, no Tailwind). Design
tokens live in `src/styles/tokens.css`; the visual direction is "academic
editorial" — warm off-white paper, serif headlines, hairline rules, **no
box-shadow anywhere**, max 2px radius.
```

```markdown
### Astro frontend (`src/`)
- **Pages:** `src/pages/[lang]/*.astro` — prerendered for both `zh` and `en` via
  `getStaticPaths`. `src/pages/index.astro` is a client-side language dispatcher;
  `src/pages/{paper,reputation,misc}/*.astro` are redirect stubs for pre-0.4.0 URLs.
- **Layouts:** `BaseLayout.astro`（head + ClientRouter 转场 + TopNav + Footer），
  `PageLayout.astro`（内容页统一页头）
- **Pure logic (`src/lib/`)** — 无 DOM、全部单测覆盖：`papers` `highlight`
  `coverage` `sparkline` `deadlines` `awards-model` `venue-groups`
  `trend-series` `settings-schema` `nav-model` `chart-palette` `cdn`
- **Browser side (`src/scripts/`)** — `boot.js` 是唯一启动点，按
  `<main data-page>` 分派，绑在 `astro:page-load` 上（软导航不会重跑脚本，
  所以每个 `init()` 必须用 `dataset.bound` 守卫幂等）
- **i18n:** `src/i18n/{zh,en}.json` + `index.js`；`t()` 在 key 缺失时**抛错**，
  让构建失败而非线上出现裸 key
- **Storage:** `src/scripts/settings-store.js` 是全站唯一碰 IndexedDB 的文件。
  库 `spc-settings` / store `config` / key `app` + `favorites` / 版本 1 —— **不可更改**，
  现有用户数据在里面。主题、强调色、语言额外镜像到 localStorage，
  因为预绘制脚本必须同步读取。
```

`Data flow` 一节补上构建时/运行时的劈分，`Paper Status Values` 保持不变。

- [ ] **Step 6: 更新 README**

`README.md` 与 `README_zh.md` 里凡提到 Vue 3 / PrimeVue / Vite 的技术栈段落改为 Astro；截图若已过时，标注「截图为 0.3.x 版本」或删掉。首页 hero 截图 `hero.png` 已过时，删掉或换新：

```bash
git rm -f hero.png   # 若 README 不再引用
```

（先 `grep -n "hero.png" README*.md` 确认引用情况再决定。）

- [ ] **Step 7: 全量验证**

Run: `npx vitest run`
Expected: PASS，全部测试通过

Run: `npm run build`
Expected: 成功，**零警告**

Run:
```bash
find dist -name '*.html' | wc -l
```
Expected: 28 —— `/`（1）+ `404`（1）+ 8 个旧路径重定向（8）+ 2 语言 × 9 页（18）。数字对不上时用下一条命令定位缺哪一页。

Run:
```bash
for lang in zh en; do
  for p in "" search trends abstract timeline awards sites about settings; do
    f="dist/$lang/${p:+$p/}index.html"
    [ -f "$f" ] || echo "✗ 缺失 $f"
  done
done; echo "页面检查完成"
```
Expected: 只打印 `页面检查完成`

Run: `du -sh dist`
Expected: 记录下来，与旧站 `dist` 对比（旧站含 PrimeVue 全量，新站应显著更小）

- [ ] **Step 8: 完整人工回归**

Run: `npm run build && npm run preview`

按这个清单走一遍，**每项都要实际点到**：

| 检查 | 期望 |
|---|---|
| `/` | 按浏览器语言跳到 `/zh/` 或 `/en/`；后退键不弹跳 |
| 8 个旧路径 | 全部跳到对应新页，含 3 处改名 |
| 首页 | 8 段依次淡入，左右交替，倒计时天数正确 |
| 顶栏 | 5 项平铺、当前页高亮随导航更新、其他▾ 下拉、移动端汉堡 |
| 转场 | 任意两页之间淡入淡出，主题不闪回 |
| 检索 | 30 行预渲染 → 全量替换；筛选/排序/分页/收藏；Offline 下降级 + 重试 |
| 摘要 | 选会议年份加载；关键词高亮；连点防竞态；404 提示 |
| 趋势 | 3 张图；SOSP 断线；切深色图表重建 |
| 时间线 | 每周期一个「下一站」；无 JS 仍完整可读 |
| 获奖 | 切会议、切分组；无 JS 全部内容可见 |
| 关于 / 更多网站 | 内容完整；无 JS 完整可读 |
| 设置 | 即改即存；4 色块；关键词；收藏清空 |
| 404 | 单语言文案 |
| 明暗 × 4 强调色 | 抽查每个组合在首页与检索页不塌 |
| 禁用 JS | 首页 / 时间线 / 获奖 / 关于 / 更多网站 完整可读 |
| 减少动效 | 无淡入、无转场动画，内容全部可见 |
| 移动端 375px | 无横向滚动；表格与矩阵在自身容器内滚 |
| 现有用户数据 | 迁移前造的收藏与关键词仍在（见 Task 10 Step 10） |

- [ ] **Step 9: Commit 并准备合并**

```bash
git add -A
git commit -m "chore: 清理 Vue 遗留、更新文档、版本推到 0.4.0

删除 src/{views,layout,components/dashboard}、App.vue、main.js、
assets/{layout,demo,images}、styles.scss、tailwind.css。
flags_responsive.png 是旧语言切换器的国旗雪碧图，新版用文字，不再需要。
删除 build-and-deploy.sh —— 它只检查 dist/index.html，两语页面全部生成失败
也能通过，且 npm run deploy:build 已覆盖同样流程。

新增 tests/no-legacy.test.js 作为长期守卫：禁止 Vue/PrimeVue/Tailwind/Vite
依赖回流、禁止指向自身的坏依赖、禁止 .vue/.scss 残留、禁止再引用 --p- 变量、
并断言 DEV/PROD 判断只出现在 src/lib/cdn.js 一处。

CLAUDE.md 与 README 更新技术栈与架构说明，含 IndexedDB 不可更改的约束
和 boot.js 幂等要求。"
```

合并前最后确认：

```bash
npx vitest run && npm run build && git log --oneline main..feat/astro | wc -l
```

- [ ] **Step 10: 合并到 main 并部署**

```bash
git checkout main
git merge --no-ff feat/astro -m "feat: 用 Astro 重写站点（0.4.0）

顶部导航栏、滚动淡入的落地式首页、页面淡入淡出转场；
去 PrimeVue 与 Tailwind，重交互视图全部重写为原生 JS；
中英分语言预渲染，旧链接自动跳转。

设计方案：docs/superpowers/specs/2026-07-25-astro-refactor-design.md
实施计划：docs/superpowers/plans/2026-07-25-astro-migration.md"

npm run deploy:build
```

部署后立刻在真实域名上抽查，这几处是 `preview` 覆盖不到的：

1. `https://sec.c01dkit.com/` —— 语言分发。
2. `/zh/search/` —— 从 CDN 真实拉取 `data.json`（本地走的是开发中间件）。
3. `/zh/abstract/` 选一届 —— 从 CDN 真实拉取 `meta_json`。
4. **旧链接的两种形态都要试**：`/paper/view-abstract`（**不带**尾斜杠）与 `/paper/view-abstract/`（带尾斜杠）。这条单列出来是因为改版前的 URL 是**不带**尾斜杠的（旧 `vercel.json` 设了 `trailingSlash: false`），而书签和搜索引擎收录的正是那个形态；新站 `trailingSlash: 'always'` 产出的是 `dist/paper/view-abstract/index.html`。GitHub Pages 对目录索引会自动 301 到带斜杠的形态，理论上没问题，但这是**部署环境特有**的行为，`astro preview` 复现不了（Task 6 的实现者已确认本地这条验不了）。真实域名上是唯一能确认的地方 —— 如果这里不通，所有历史链接都会断，那是本次迁移最不该出的错。

---

## 自检

**规格覆盖**：spec 的 14 节逐节对照 —— §4.1 目录结构（Task 1/2/3/4/5）、§4.2 路由与 i18n（Task 2/6）、§4.3 构建部署（Task 1/20）、§5 设计系统（Task 3）、§6 模块拆分（Task 7/10/11/12 纯逻辑 + 13–19 页面控制器）、§7 首页结构（Task 8/9）、§8 数据流（Task 1 开发中间件 + Task 11 `cdn.js` + 各页面）、§9 降级规则六条（1→Task 13、2→Task 10、3→Task 16/17/18 静态渲染、4→Task 3/4、5→Task 14、6→Task 7/9）、§10 动效转场（Task 4）、§11 测试（每个 Task 自带）、§12 清理兼容（Task 20 + Task 10 的 schema 守卫）、§13 页面清单（Task 6/13–19 全覆盖）、§14 不做的事（`no-legacy.test.js` 守住依赖边界）。无遗漏。

**类型一致性**：`Row` 形状在 Task 11 定义、Task 13 消费一致；`highlightSegments` 返回 `{text, hit, cls}` 在 Task 12 定义、Task 13/14 消费一致；`pickUpcomingDeadlines` 返回 `{items, placeholder}` 在 Task 7 定义、Task 9 消费一致；`applyTheme(theme, accent)` 在 Task 4 导出、Task 19 消费一致；`registerPage(name, fn)` 在 Task 4 定义、Task 9/13–19 使用一致。

**占位符扫描**：无 `TBD` / `TODO` / 「适当处理」类模糊指令。唯一不把内容写进计划的地方是 Task 18 的更新日志搬运 —— 26×2 条历史条目照抄进计划毫无意义，改为给出精确的源文件、函数、数组名、条数和两处字段改名规则，并单独点明 `v0.2.0` 是唯一需要改内容的一条。

**施工时唯一需要连着做完的地方**：Task 20 的 Step 2 会因为清理不彻底而反复失败 —— 那是设计如此，按 `tests/no-legacy.test.js` 的报错逐个删，直到它变绿。

**规模**：20 个任务、163 个步骤。每个任务都以「测试通过 + 构建通过（+ 涉及 UI 的还要人工验收）+ 一次 commit」收尾，可以独立评审。

