# 设计方案：迁移到 Astro + 顶栏 + 落地式首页 + 页面转场

日期：2026-07-25
状态：已确认，待编写实施计划

## 1. 目标

把 sec.c01dkit.com 从 Vue 3 SPA 重构为 Astro 静态站，具体交付四件事：

1. 站点架构改用 Astro 呈现（参照 `../agent-design-atlas`）。
2. 现有左侧导航栏内容改为顶部导航栏（参照 `../puzzlehunt` 的顶栏形态）。
3. 首页改为产品介绍式落地页：随滚动逐段淡入，分块展示功能，每块左右两半（一半文字、一半媒体）。
4. 页面之间切换为淡入淡出（参照 `../agent-design-atlas` 的 `astro:transitions`）。

## 2. 现状

- Vue 3 SPA + Vite 5 + PrimeVue 4 + Tailwind 3 + vue-i18n + vue-router。
- 10 条路由，重交互视图 4 个：`Search.vue`（PrimeVue DataTable：分页、菜单式列筛选、全局搜索、IndexedDB 收藏）、`ViewAbstract.vue`、`Awards.vue`、`Trends.vue`（Chart.js）。`About` / `MoreSites` / `SubmissionTimeline` 基本是静态内容。
- i18n 为运行时切换（vue-i18n + localStorage），单一套 URL。
- 部署：`gh-pages -d dist -f --cname sec.c01dkit.com`。仓库内另有一份 SPA rewrite 的 `vercel.json`。
- 数据：`main.py --analyze` 写入 `src/assets/data/`，`--upload` 增量传到阿里云 OSS，前端 PROD 时从 `cdn.c01dkit.com/sec-papers/` 取。
- 真实数据量（`data-statistics.json`）：**15,600 篇 / 10 个会议 / 2001–2026**。（旧 hero 截图上的 15258 与 About 文案里的「12 个会议」均已过时，以生成的 JSON 为准。）

## 3. 已确认的决策

| 议题 | 决策 |
|---|---|
| 重交互视图 | **全部重写为原生 JS**，不保留 Vue 岛屿，不保留 PrimeVue |
| i18n | **路由分语言预渲染**，`/zh/` 与 `/en/` 完全对称，`/` 做客户端语言分发 |
| 部署 | **继续 GitHub Pages 静态站**，`output: 'static'`，不用 adapter |
| 目录 | **原地替换仓库根**，`src/assets/data/` 保持不动 |
| 首页媒体 | **真数据驱动的迷你 demo**（纯 CSS/SVG，无截图无图片） |
| 视觉方向 | **A · 学术编辑风**：暖白纸底、衬线标题、发丝分割线、零阴影、单一沉稳强调色 |
| 顶栏 | 核心 5 项**全平铺**（检索/趋势/摘要/时间线/获奖），`其他 ▾` 与 EN、明暗一起靠右 |
| 主题色 | **收窄为 4 个精选强调色** + 明暗两套 |
| 趋势页图表 | **保留 Chart.js**（canvas 渲染器，与框架无关）；首页迷你图手写 SVG |
| Tailwind | **一并去掉**，纯手写 CSS + token |
| 落地方式 | **单分支一次换**（`feat/astro`），做完 9 个页面再合 main 发一次 |

落地方式选 A 的理由：分批上线需要在 Vue 侧重复实现一遍顶栏，这份工作最终全是白扔；而按数据依赖分两期的话，混搭期里停在旧样式的恰好是访问量最大的检索页 —— 那是本站主功能，割裂感最明显。本站按月度节奏更新，没有上线压力。

## 4. 架构

### 4.1 目录结构（原地替换仓库根）

```
astro.config.mjs          output:'static' · site:'https://sec.c01dkit.com' · trailingSlash:'always' · base:'/'
package.json              astro / chart.js / vitest / gh-pages / @astrojs/sitemap
src/
  pages/
    index.astro           /  → 语言分发（全站唯一不带语言前缀的页面）
    404.astro
    [lang]/               getStaticPaths 产出 zh 与 en 两份
      index.astro         首页（落地页）
      search.astro  trends.astro  abstract.astro  timeline.astro
      awards.astro  sites.astro   about.astro     settings.astro
    paper/search.astro  paper/trends.astro  paper/view-abstract.astro
    paper/submission-timeline.astro  reputation/awards.astro
    misc/about.astro    misc/more-sites.astro     misc/settings.astro
                          ↑ 8 个旧路径的重定向占位，复用同一个语言分发组件
  layouts/
    BaseLayout.astro      <head> + ClientRouter + TopNav + Footer + slot
    PageLayout.astro      内容页统一页头（kicker + 标题）；除首页与 404 外全部使用
  components/
    TopNav.astro  Footer.astro  LangSwitch.astro  ThemeToggle.astro
    LangDispatch.astro    / 与 8 个旧路径共用的分发骨架
    home/
      Hero.astro  CoverageMatrix.astro  ClosingBand.astro
      FeatureSearch.astro  FeatureTrends.astro  FeatureAbstract.astro
      FeatureTimeline.astro  FeatureAwards.astro
  scripts/
    boot.js               统一启动点，按 data-page 分派
    settings-store.js  theme.js  reveal.js  nav.js
    papers.js  highlight.js
    paper-table.js  abstract-view.js  trends-chart.js  timeline.js  awards.js
  i18n/
    zh.json  en.json      从 src/locales/ 原样搬来
    index.js              t(lang, key) + 路径工具
  lib/
    cdn.js                CDN_DATA_BASE，从 src/service/cdn.js 搬来（唯一保留的 service 文件）
  styles/
    tokens.css  global.css
  data/
    changelog.js          从 AboutService.js 抽出
    sites.js              从 MoreSites.vue 抽出
  assets/
    data/                 ← 原封不动，Python 管道继续写这里
    fonts/Inter-roman.var.woff2
public/
  .nojekyll  favicon.ico  flags/
```

### 4.2 路由与 i18n

- `[lang]` 动态路由 + `getStaticPaths` 返回 `[{params:{lang:'zh'}}, {params:{lang:'en'}}]`。一个 `.astro` 文件同时产出 `/zh/search/` 与 `/en/search/`，文案在**构建时**由 `t(lang, key)` 填好。不复制页面、不复制文案、运行时零切换、零闪动。
- `/` 渲染极简骨架（仅 logo），内联脚本读 `localStorage.lang`，值不是 `zh` 或 `en` 时一律视为无记录、转而看 `navigator.language`（`zh` 前缀 → zh，其余 → en），然后 `location.replace()` 跳转。**必须用 `replace` 而非 `href`**，否则浏览器后退键会困在分发页。同时输出 `hreflang` 供搜索引擎抓两语，`<noscript>` 用 meta refresh 兜到 `/en/`。
- 旧路径 8 个各出一个占位页，复用 `LangDispatch.astro`，按语言跳到对应新路径。清单：`/paper/search`、`/paper/trends`、`/paper/view-abstract`、`/paper/submission-timeline`、`/reputation/awards`、`/misc/about`、`/misc/more-sites`、`/misc/settings`。
- 语言切换组件在两语的同名路径间互跳，并把选择写入 `localStorage.lang` 供下次 `/` 分发使用。

### 4.3 构建与部署

- `base` 从 `'./'` 改回 `'/'`。`'./'` 是当年 SPA 的权宜做法，MPA 的多级真实路径下相对 base 会算错。
- 删除 `vercel.json` —— 它把所有路径 rewrite 到 `index.html`，正是 MPA 最怕的东西。
- `public/404.html` 换成 `src/pages/404.astro`，Astro 产出 `dist/404.html`，GH Pages 照样识别。404 页面同样需要客户端语言判断（它可能在任何路径下被触发）。
- `npm run deploy` 保持不变：`gh-pages -d dist -f --cname sec.c01dkit.com`。
- 加 `@astrojs/sitemap`。选路由分语言本来就是为了 SEO，顺手补齐。
- Python 侧零改动：`src/assets/data/` 路径不变，`main.py --analyze/--upload`、`oss_upload_cache.json`、`.gitignore` 里的 data 规则全部继续有效。仅 `CLAUDE.md` 的前端命令段需要更新。

## 5. 设计系统

### 5.1 字体

- **发现**：`src/assets/fonts/LXGWWenKaiScreen.ttf` 是 **0 字节空文件**，一直没生效，不能依赖它。
- 标题用系统衬线栈 `Georgia, 'Times New Roman', 'Songti SC', serif`，零字节。
- 正文保留 `Inter-roman.var.woff2`（227KB）。**删除 `Inter-italic.var.woff2`（245KB）** —— A 风格里斜体只出现在衬线大标题上，系统衬线自带真斜体。

### 5.2 Token

`tokens.css` 定义语义变量，由 `[data-theme]` × `[data-accent]` 组合覆盖。

```
明色  bg #fbfaf8   band #f5f2eb   ink #17150f   muted #5d5648
      faint #8c7f66   hairline #e3ded4   hairline-soft #f0ece3
暗色  bg #14120f   band #1b1815   ink #f0ebe2   muted #b3a898
      faint #857a69   hairline #302b24   hairline-soft #221e19
```

暗色是**暖的**（偏黄的墨黑）而非纯黑，才接得住「纸感」这个前提。

4 个强调色各带明暗两版（深色底上 `#2f4858` 会糊掉）：

| slug | 名称 | 明 | 暗 |
|---|---|---|---|
| `slate` | 深石青（默认） | `#2f4858` | `#7fa8bd` |
| `indigo` | 墨蓝 | `#3a3f7a` | `#9aa0dd` |
| `oxblood` | 赤赭 | `#7d3038` | `#d9868f` |
| `pine` | 松绿 | `#2f5744` | `#83bda1` |

关键词高亮底色**独立于强调色**（明 `#e8dfc8` / 暗 `#4a3f20`），否则换色时高亮会与强调色打架。

### 5.3 三条纪律

贯穿全站：**圆角最大 2px**、**任何地方不用阴影**、**层次只靠发丝线和底色深浅**。这是 A 风格能立住的关键，一旦破例就滑向通用产品官网观感。

## 6. 模块拆分

浏览器端全部为原生 ESM，职责单一：

| 模块 | 职责 | 对外接口 |
|---|---|---|
| `settings-store.js` | **全站唯一**碰 IndexedDB 的地方 | `getSettings()` / `patchSettings(partial)` / `getFavorites()` / `toggleFavorite(id)` |
| `papers.js` | 论文数据加载 + 筛选 + 排序 + 分页，**纯函数、不碰 DOM** | `loadPapers()` / `applyFilters(rows, criteria)` / `paginate(rows, page, size)` |
| `highlight.js` | 关键词切段，纯函数 | `highlightSegments(text, extraTerms)` |
| `theme.js` | `data-theme` / `data-accent` 读写与持久化 | `initTheme()` |
| `reveal.js` | 滚动淡入 | `initReveal()` |
| `nav.js` | 移动端汉堡 + `其他 ▾` 下拉 | `initNav()` |
| `paper-table.js` | 检索页 DOM 渲染 | `init()` |
| `abstract-view.js` | 摘要页 | `init()` |
| `trends-chart.js` | Chart.js 封装 | `init()` |
| `timeline.js` | 投稿时间线 + 倒计时 | `init()` |
| `awards.js` | 获奖页交互（筛选/折叠） | `init()` |

拆分意图：

- `papers.js` 与 `highlight.js` 是纯数据函数，可直接单测，不需要浏览器。DataTable 那颗「脑子」重写后最容易出错的就是筛选与分页边界，隔离出来才测得动。
- 除 `settings-store.js` 外，**其他模块都不知道 IndexedDB 存在**。将来换存储只动一个文件。
- 页面控制器只做 DOM 渲染与事件绑定，不含数据逻辑。

**统一启动点**：`BaseLayout` 中一个 `<script>` 引入 `boot.js`，按 `<main data-page="search">` 分派到对应 `init()`，整体绑在 `astro:page-load` 上。这一步是**必须的** —— ClientRouter 做软导航时不会重新执行脚本。所有 `init()` 必须能被重复调用而不重复绑事件（用 `dataset.bound` 守卫）。

## 7. 首页结构

自上而下 8 段，逐段淡入，功能块左右交替：

| # | 段 | 布局 | 媒体侧内容 |
|---|---|---|---|
| 1 | 首屏 | 左对齐 | kicker + 衬线大标题 + 两个按钮 + 4 个数字（15,600 / 10 / 2001–26 / 月度） |
| 2 | 覆盖矩阵 | 整幅铺满 | 10 会议 × 2015–2026 共 12 列热力网格，**格内写真实录用数，年份四位**；SOSP 的 2001–2013 数据在行标上以「◂01–13」标注，不单独占列 |
| 3 | 01 检索 | 文左 · 媒体右 | 迷你搜索结果（真标题 + 命中高亮 + 星标） |
| 4 | 02 趋势 | 媒体左 · 文右 | 手写 SVG 面积图（894 → 2,342 篇/年） |
| 5 | 03 摘要 | 文左 · 媒体右 | 论文卡（标题 + 摘要 + 关键词高亮 + 主题标签） |
| 6 | 04 时间线 | 媒体左 · 文右 | 最近 3 条截止日 + 倒计时天数 |
| 7 | 05 名望 | 文左 · 媒体右 | 2 张获奖卡（取自 `awards.json`）+ 1 张汇总卡 |
| 8 | 收尾 | 深色通栏 | 三格：更多网站 / 个人偏好 / 数据管道开源 + CTA |

覆盖矩阵的两个要点：

- 表格 `width:100%` 铺满，`table-layout:fixed`，格内写真实数值 —— 否则表格只有约 350px 宽，右侧留白。
- **深浅两组分别归一**：安全四大峰值 USENIX Sec 2025 = 439，软工/系统峰值 ASE 2025 = 389。共用一个 max 会让 ISSTA（44–170）和 SOSP（17–66）整行淡得看不出变化。

## 8. 数据流

管道前半段不变：`main.py --analyze` → `src/assets/data/*.json` → `--upload` → CDN。变的是前端取法，按体积劈成构建时与运行时两半：

| 数据 | 体积 | 用法 |
|---|---|---|
| `data-statistics.json` | 12KB | **构建时** → 首页覆盖矩阵、首屏数字、趋势迷你图、各页选择器选项 |
| `awards.json` | 48KB | **构建时** → 首页获奖卡 + 整个获奖页 |
| `submission-timeline.json` | 8KB | **构建时** → 时间线页 + 首页倒计时日期源 |
| `data-quick-view.json` | 292KB | **构建时**取最新 30 条（按年份降序、同年按 id 升序），预渲染成检索页首屏表格 |
| `data.json` | 4.5MB | **运行时**从 CDN 拉，换入完整可交互表格 |
| `meta_json/*.json` | 26MB | **运行时**按所选会议 + 年份单个拉 |

收益：**获奖页与投稿时间线页变成纯静态 HTML，零数据加载 JS**；检索页在大文件到达前就有 30 行真内容可看。

倒计时天数在客户端按本地时区计算，日期本身构建时嵌入。论文标题与摘要本身是英文、与界面语言无关，两语共用同一份数据，不需要翻译。

构建时读取用 frontmatter 里的 `import`（直读本地文件）；运行时读取沿用 `CDN_DATA_BASE`，DEV 下走本地、PROD 下走 CDN。

## 9. 降级规则

1. **CDN 拉不到 `data.json`** → 检索页保留预渲染的 30 行，顶部出非阻塞提示 + 重试按钮。绝不出现空表格。
2. **IndexedDB 不可用**（隐私模式、Safari 限制）→ `settings-store.js` 每个方法**只 resolve、永不 reject**：主题/语言/强调色退到 localStorage，收藏退成本次会话有效并提示一次。
3. **JS 完全禁用** → 首页、关于、更多网站、时间线、获奖**全部完整可读**（相比现在 SPA 关 JS 整站白屏是净提升）。检索页可读首 30 行但不能筛选；摘要页与趋势页给 `<noscript>` 提示。
4. **`prefers-reduced-motion`** → reveal 全部直接置为可见，转场淡入关闭。
5. **某个 `meta_json` 不存在** → 选择器只列 `data-statistics.json` 里真实存在的会议 × 年份组合，从源头避免 404；万一仍 404，显示「该年份暂无摘要数据」。
6. **时间线数据过期** → 首页只显示**未来**的截止日；不足 3 条则补最近的已过期项并标灰；**一条未来的都没有**时整块替换为「下一轮日期待公布」，绝不显示「还剩 −30 天」。

## 10. 动效与转场

**页面转场**：`<ClientRouter />` 置于 `<head>`，整文档 0.22s 交叉淡入淡出，顶栏**不做** `transition:persist`。

不 persist 是刻意的：persist 能让顶栏不闪，但被保留的 DOM 上 `aria-current` 不随软导航更新，需额外脚本纠正；不 persist 则高亮态由服务端渲染，天生正确，代价只是极轻微的顶栏重绘。必须照搬 `agent-design-atlas` 的 `astro:before-swap` 钩子，把 `data-theme` / `data-accent` / `reveal-on` **抄到即将换入的 document 上**，否则每次导航主题都会闪回默认值。

**滚动淡入**：`IntersectionObserver` 观察 `[data-reveal]`，同一父级内按序号错开 `min(i,5) × 70ms`，`rootMargin: '0px 0px -6% 0px'`，`threshold: 0.1`，触发后 `unobserve`。

必须写死的细节：`opacity:0` 只能挂在 `html.reveal-on [data-reveal]` 上，而 `reveal-on` 由 `<head>` 内联脚本添加，且**只在允许动效时添加**。这样没有 JS 或开启减少动效时内容默认可见。反过来写（默认 0、靠 JS 变 1）会让无 JS 用户看到白页 —— 这是此类效果最常见的翻车方式。

## 11. 测试

现在前端零测试，本次补上 vitest：

- `papers.js` —— 筛选/排序/分页边界：空查询、零命中、页码越界、会议与年份多选取交集、仅看收藏。
- `highlight.js` —— 重叠词、大小写、**关键词含正则特殊字符**（用户可在设置里输入任意字符串）。
- 时间线规则 —— 全部过期→占位文案、部分过期→未来优先、不足 3 条→补灰显示。
- **文案漂移守卫** —— 遍历所有用到的 `t()` key，断言 `zh.json` 与 `en.json` 都存在。237 行文案表 × 两语预渲染，漏一个 key 就是线上出现裸 key。
- `astro build` 零警告作为门禁。

手工验收：两语 × 明暗 × 4 强调色 × 9 页共 72 组合不逐一枚举。按「每个主题/强调色抽一个代表页 + 单一语言主题下走完 9 页」覆盖。

## 12. 清理与兼容

- **IndexedDB 原样保留**：库名 `spc-settings`、store `config`、key `app` / `favorites`、版本 1 全部不动。现有用户的收藏与关键词不能丢 —— **硬约束**。
- `theme` 字段语义变化（PrimeVue 预设名 `indigo` → 强调色 slug `slate`），加迁移：认不出的值回落到默认 `slate`。
- 删除死配置 `llmEndpoint` / `llmApiKey` —— 全站无任何消费方，LLM 分析实际由 Python 侧读 `.env` 执行。
- 保留在用的设置：`keywords`（`highlight.js` 消费）、`showStatusDots`、`darkTheme`、`remember*` 系列。
- 修掉 `package.json` 两个自己指向自己的坏依赖：`"primeblocks-vue": "file:"`、`"sec-papers-collection-new": "file:"`。
- 删除：`src/{layout,views,components,composables,router,locales}`、`src/service/`（仅 `cdn.js` 迁往 `src/lib/`，其余删除）、`src/assets/{layout,demo}`、`styles.scss`、`tailwind.css`、`App.vue`、`main.js`、`index.html`、`vite.config.js`、`vercel.json`、`public/404.html`、`Inter-italic.var.woff2`、0 字节的 `LXGWWenKaiScreen.ttf`、`.eslintrc.cjs`（换成 Astro 的 lint 配置）、`postcss.config.js`、`tailwind.config.js`。
- 版本推到 **0.4.0**（对齐 0.2.0 那次 Vue 重构的里程碑量级），在 `changelog.js` 补一条。
- 更新 `CLAUDE.md`、`README.md`、`README_zh.md` 的前端命令与架构段。

## 13. 页面清单与对应关系

| 新路径 | 旧路径 | 数据 | 需要 JS |
|---|---|---|---|
| `/{lang}/` | `/` | 构建时（统计 + 获奖 + 时间线） | 动效 + 倒计时天数 |
| `/{lang}/search/` | `/paper/search` | 构建时 30 行 + 运行时 `data.json` | 是（筛选/分页/收藏） |
| `/{lang}/trends/` | `/paper/trends` | 构建时统计 | 是（Chart.js） |
| `/{lang}/abstract/` | `/paper/view-abstract` | 运行时 `meta_json` | 是 |
| `/{lang}/timeline/` | `/paper/submission-timeline` | 构建时 | 仅倒计时 |
| `/{lang}/awards/` | `/reputation/awards` | 构建时 | 是（按年份/奖项筛选） |
| `/{lang}/sites/` | `/misc/more-sites` | 构建时 | 否 |
| `/{lang}/about/` | `/misc/about` | 构建时 | 否 |
| `/{lang}/settings/` | `/misc/settings` | — | 是 |
| `/404` | `public/404.html` | — | 是（按语言给出返回链接） |

`/misc/i18n-test` 不迁移（原本就是开发期测试页，已在菜单中注释掉）。

## 14. 不做的事

- 不引入任何 UI 框架或组件库（含 Vue 岛屿）。
- 不引入 Pagefind 等全文搜索 —— 检索限于标题子串匹配，与现状一致。
- 不改动 Python 数据管道的任何行为与路径。
- 不做服务端语言协商（GH Pages 静态托管无此能力，`/` 的分发只能在客户端）。
- 不保留任意主色调色能力，只提供 4 个精选强调色。
