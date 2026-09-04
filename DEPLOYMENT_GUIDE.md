# Development Guide

## Prepare Data

```shell
uv run main.py --analyze --upload
```

## Publish Website (GitHub Pages)

```shell
npm run deploy
```

## Publish Website (Cloudflare Pages, direct upload)

```shell
npm run deploy:cf
```

Needs wrangler installed and `CLOUDFLARE_API_TOKEN` in `.env` (see `.env.example`); no `wrangler login`. Cloudflare's git-connected build cannot work for this repo: the data JSON under `src/assets/data/` is git-ignored, so keep automatic deployments disabled on the Pages project and direct-upload `dist/` instead.