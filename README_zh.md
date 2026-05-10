# 安全顶会论文集合

> [English README](./README.md)

## 简介

本项目持续整理网络与系统安全方向（及相关领域）顶级会议的录用论文，按会议和年份分类，并通过 GitHub Pages 部署为可在线访问的网站。

**网站访问地址：[https://sec.c01dkit.com](https://sec.c01dkit.com)**

欢迎通过 Issue 或 Pull Request 反馈与贡献。

## 收录的会议

安全四大会议（Top-tier）：

- IEEE S&P（俗称 Oakland）
- USENIX Security Symposium（USENIX Sec）
- ACM CCS
- NDSS

由于软工方向部分议题与安全相关，因此也收录：

- ICSE
- ISSTA
- FSE
- ASE

此外还包括两个系统类会议：

- ASPLOS
- SOSP
- OSDI（待补充）

## 网站使用指南

网站基于 Vue 3 + Vite 实现，采用 PrimeVue 4 组件库，支持中英双语、明暗模式与主题色自定义。所有用户偏好仅保存在本机浏览器的 IndexedDB 中，不会上传到任何服务器。

进入网站后，可通过左侧菜单访问以下页面：

### 首页（总览）

- 展示论文总数、收录会议数、项目星标数、最近更新时间。
- **会议年度统计**：按会议与年份展示每年的收录论文数量，并以彩色圆点标记每个会议年份的处理状态：
  - `已校对`（绿）：人工核对完成
  - `待校对`（黄）：尚未核对
  - `待补充`（橙）：缺少链接或摘要等关键信息
  - `已分析`（蓝）：经过 LLM 分析、带有主题标签
- 状态圆点默认隐藏（避免密集恐惧症不适），可在「设置」中开启。

### 论文 → 标题检索

- 全量论文标题检索；可按会议、年份多选筛选。
- 点击列表行即可一键复制论文标题。
- 点击纸夹图标 `pi-paperclip` 在新标签页打开论文链接。
- 点击星标可将论文加入个人收藏；顶部的「仅看收藏」按钮可一键过滤出已收藏论文。
- 偏好关键词会以主题色高亮显示在标题中。

### 论文 → 近年录用趋势

- 以图表方式展示历年各会议录用论文数量的趋势。
- 按分组（安全四大 / 软工会议 / 系统会议）切换查看，便于横向对比。

### 论文 → 论文摘要

- 选择会议与年份后，列表展示该届录用论文的标题、链接以及摘要。
- 标题与摘要中会高亮你在「设置」中配置的偏好关键词。
- 点击列表项可在新标签页打开论文官方链接。

### 论文 → 会议全流程时间线

- 展示安全四大每个 Cycle 的完整时间线：投稿截止、Round 2 通知、首轮录用通知、Major Revision 重投与通知、Camera Ready 等关键节点。
- 数据与各会议官方 CFP 同步，每条时间线注明 `update` 字段表示最近一次同步日期，并标注 `Tentative`（暂定）状态。

### 名望 → 获奖论文

- 汇总各会议历年的最佳论文、杰出论文、Pwnie 等奖项。
- 支持按「年份」或「奖项种类」分组查看。

### 其他 → 关于

- 项目更新日志（Changelog）。
- 赞助者名单（自 v0.3.0 起）。

### 其他 → 更多网站

- 精选学术安全研究与会议追踪相关的实用资源，包含：
  - **Best Paper Awards in Computer Science**（Jeff Huang 维护的最佳论文汇总）
  - **CCF Conference Deadlines**（CCF 推荐会议截稿日期追踪）
  - **CCF 推荐目录镜像**
  - **Connected Papers**（论文关联图谱）
  - **WisPaper**（基于 AI 的文献检索）
  - **CS Papers**（csrankings.org 收录会议的论文搜索引擎）
- 卡片形式呈现，点击在新标签页中打开。

### 其他 → 设置

所有偏好均保存在本机浏览器的 IndexedDB 中，不会用于追踪、识别或分析访问者，也不会上传到任何服务器。

- **记住语言选择**：保存中英文偏好，下次访问自动恢复。
- **记住明暗模式**：保存亮色 / 暗色模式选择。
- **记住主题色**：保存主色调选择。
- **显示状态圆点**：开启或关闭首页论文统计中的彩色圆点。
- **偏好关键词**：添加感兴趣的关键词，会在标题检索与论文摘要中以主题色高亮。
- **大模型接口**：可配置 OpenAI 兼容的 API 地址与 Key（用于浏览器内调用 LLM 的功能）。
- **论文收藏**：在「标题检索」中收藏的论文以本地 IndexedDB 持久化。

### 顶部工具栏

- 切换中英文。
- 切换明暗模式。
- 打开主题配置面板（自定义主色调、菜单模式等）。
- 跳转到反馈表单与项目仓库。

## 仓库结构

```
analyzers/                Python 数据爬取/解析/LLM 分析模块
cache/                    爬取缓存（pickle, SHA-256 索引；见 cache.zip）
official_cache/           来自官方的 CSV / BIB 文件
src/assets/data/          前端使用的 JSON 数据
  data.json               全量论文（不含摘要，节省体积）
  data-quick-view.json    每个会议的最近 100 篇论文
  data-statistics.json    按会议 / 年份 / 分类的聚合统计
  meta_json/<会议>-<年份>.json   每届完整数据，含摘要
src/views/                Vue 页面
src/service/              数据加载服务与 IndexedDB 封装
src/locales/              en.json / zh.json
data.yml                  会议主配置（年份、XPath、官方文件等）
main.py                   后端入口
```

## 如何贡献？

论文数据通过 [`uv`](https://docs.astral.sh/uv/) 处理。Fork / Clone 仓库后，修改 `data.yml`，本地运行 `uv run main.py --analyze` 验证无误后即可提 PR。所有贡献者都会被记录在仓库 README 和网站「关于」页面。

### 更新论文数据

```bash
uv sync                     # 安装 Python 依赖
# 修改 data.yml ……
uv run main.py --analyze    # 爬取/解析并重新生成 src/assets/data/ 下的 JSON
```

为加快本地爬取速度，可解压 `cache.zip` 至仓库根目录复用缓存。

### 更新非论文信息

- 自 v0.3.6 起，可在 `data.yml` 中通过 `status` 字段标注会议状态：`notchecked`（默认） / `inprogress` / `done` / `advanced`，分别在首页显示为 `待校对` / `待补充` / `已校对` / `已分析`。
- 自 v0.3.0 起，`src/service/xxxService.js` 系列文件存放与论文本身无直接关系的关键信息（更新日志、赞助名单、投稿时间线、获奖论文等）。直接编辑这些文件即可发布最新内容。

### LLM 主题分析

`uv run main.py --llm-analyze` 会读取论文摘要并通过 OpenAI 兼容接口为论文打标签。需要复制 `.env.example` 为 `.env` 并配置：

```
OPENAI_API_KEY=...
MODEL=...
BASE_URL=...
PRIVATE_ZIP_PASSWD=...   # 用于 cache.zip 加密
```

分析结果会缓存为 JSONL，避免重复请求。

### 缺失 cite key 的 BIB 文件

部分会议官方提供的 BIB（如近年来 IEEE Xplore 导出的 Oakland）每条 `@INPROCEEDINGS` 缺失 cite key，导致 `bibtexparser` 无法解析。可运行：

```bash
uv run analyzers/bib_analyzer.py official_cache/<文件>.bib
```

脚本会用随机 UUID 原地补全空 cite key。下游处理只用 `title`、`author`、`abstract`、`url`，因此 cite key 是否稳定不影响最终结果。

## 前端开发

```bash
npm install
npm run dev              # 启动 Vite 开发服务器
npm run build            # 生产构建到 dist/
npm run preview          # 预览构建结果
npm run lint             # ESLint --fix
npm run format           # Prettier 格式化
npm run deploy           # 将 dist/ 发布到 GitHub Pages（--cname sec.c01dkit.com）
npm run deploy:build     # 构建后立即发布
```

界面基于 [PrimeVue 4](https://primevue.org/) 与 Tailwind CSS 3，图表使用 Chart.js。`primevue-document.md` 中记录了开发本站时使用的组件用法。

## 完整发布流程

```bash
uv run main.py --analyze --zip
npm run build
npm run deploy           # Fork 后请同步修改 package.json 中的 --cname
git add .
git commit -m "update $DATE"
git push origin main
```
