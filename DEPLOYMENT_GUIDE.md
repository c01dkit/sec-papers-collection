# Development Guide

## Prepare Data

```shell
uv run main.py --analyze --llm-analyze --llm-tag   # 第一次 --analyze：转换 official_cache 的 CSV/BIB，新场次要靠它
uv run main.py --analyze --upload                   # 第二次：把 LLM 结果写进 JSON，再上传
npm run deploy                                      # predeploy 会先自动 build，然后部署到 Cloudflare Pages
```

## Publish Website (Cloudflare Pages, direct upload)

```shell
npm run deploy
```

Needs wrangler installed and `CLOUDFLARE_API_TOKEN` in `.env` (see `.env.example`); no `wrangler login`. Cloudflare's git-connected build cannot work for this repo: the data JSON under `src/assets/data/` is git-ignored, so keep automatic deployments disabled on the Pages project and direct-upload `dist/` instead.