# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Astro static site displaying curated academic security papers from top-tier conferences (IEEE S&P, USENIX Security, ACM CCS, NDSS) and related venues (ICSE, ISSTA, FSE, ASPLOS, SOSP). Deployed to GitHub Pages at sec.c01dkit.com. As of v0.4.0 the site is prerendered per-language (`/zh/`, `/en/`) with no client-side framework — pages ship hand-written CSS and small vanilla-JS controllers.

## Commands

### Frontend (Astro)
```bash
npm run dev      # Astro dev server (includes a /data/** -> src/assets/data/** dev middleware)
npm run build    # Static build to dist/
npm run preview  # Preview the build
npm run check    # astro check
npm test         # vitest run
npm run deploy   # Deploy dist/ to GitHub Pages
npm run deploy:build
```

Frontend is Astro 7 with hand-written CSS (no UI framework, no Tailwind). Design tokens live in `src/styles/tokens.css`; the visual direction is "academic editorial" — warm off-white paper, serif headlines, hairline rules, **no box-shadow anywhere**, max 2px radius.

### Backend (Python data processing)
```bash
uv sync                             # Install Python deps
uv run main.py --analyze            # Crawl/parse papers and generate JSON data files
uv run main.py --llm-analyze        # Analyze abstracts with LLM (requires .env)
uv run main.py --zip                # Create encrypted zip of crawl cache
uv run main.py --unzip              # Unzip crawl cache
uv run main.py --upload             # Upload CHANGED src/assets/data/ JSON to Aliyun OSS (served via CDN)
uv run main.py --seed-upload-cache  # Mark current JSON as already-uploaded (skips them on next --upload)
```

`--upload` hashes each JSON (SHA256) against `oss_upload_cache.json` (git-ignored, local only) and only uploads files whose content changed. After a manual/first upload, run `--seed-upload-cache` once so subsequent uploads are incremental.

### Full publish cycle
```bash
uv run main.py --analyze --upload --zip && npm run build && npm run deploy
```

## Architecture

**Data flow:** `data.yml` (conference config) → `main.py` (Python processing) → JSON files in `src/assets/data/` → uploaded to Aliyun OSS (`--upload`) → served to the frontend, split between build time and runtime:

- **Build time:** a handful of pages read `src/assets/data/` directly off disk while Astro prerenders (e.g. the search page's first-30-rows fallback, the home page's coverage matrix) — this data is baked into the static HTML and works even if the CDN is down.
- **Runtime (client-side fetch):** the search page's full list and the abstract page's per-conference `meta_json` are fetched in-browser at `DATA_BASE`. In DEV that resolves to `/data/**`, served by a Vite dev middleware in `astro.config.mjs` that maps it straight to `src/assets/data/**` (never symlinked into `public/`, which would copy the ~26MB `meta_json` tree into `dist/`). In PROD it resolves to the CDN (`cdn.c01dkit.com/sec-papers/`). The single DEV/PROD branch lives in `src/lib/cdn.js` (`DATA_BASE`) — no other file may reference `import.meta.env.DEV/PROD`; a guard test (`tests/no-legacy.test.js`) enforces this.

OSS credentials and endpoint live in `.env` (`OSS_*`); objects are stored under the `sec-papers/` key prefix in the `premium-cdn` bucket.

### Python backend (`analyzers/`)
- `main.py` — orchestrates scraping, parsing, and JSON generation
- `data.yml` — master config defining conferences with XPath selectors for web scraping, or references to official CSV/BIB files
- Crawl results cached in `cache/` (pickle files, SHA256-keyed); official data in `official_cache/`
- `llm_analyzer.py` — uses OpenAI API (configurable via `.env`) to classify paper topics; results cached in JSONL

### Generated JSON assets (`src/assets/data/`)
- `data.json` — full paper list (no abstracts for size)
- `data-quick-view.json` — 100 latest papers per publication
- `data-statistics.json` — aggregated stats by publication/year/category
- `meta_json/[Publication - Year].json` — full per-conference details with abstracts

### Astro frontend (`src/`)
- **Pages:** `src/pages/[lang]/*.astro` — prerendered for both `zh` and `en` via `getStaticPaths`. `src/pages/index.astro` is a client-side language dispatcher; `src/pages/{paper,reputation,misc}/*.astro` are redirect stubs for pre-0.4.0 URLs.
- **Layouts:** `src/layouts/BaseLayout.astro` (head + ClientRouter transitions + TopNav + Footer), `src/layouts/PageLayout.astro` (shared content-page header)
- **Pure logic (`src/lib/`)** — no DOM, fully unit-tested: `papers`, `highlight`, `coverage`, `sparkline`, `deadlines`, `awards-model`, `venue-groups`, `trend-series`, `settings-schema`, `nav-model`, `chart-palette`, `cdn`
- **Browser side (`src/scripts/`)** — `boot.js` is the single entry point; it dispatches by `<main data-page>` and is bound to `astro:page-load` (soft navigation does not re-run page `<script>` tags, so every page's `init()` must guard idempotency with `dataset.bound`)
- **i18n:** `src/i18n/{zh,en}.json` + `index.js`; `t()` **throws** on a missing key so a missing translation fails the build instead of shipping a bare key
- **Storage:** `src/scripts/settings-store.js` is the only file in the codebase that touches IndexedDB. DB `spc-settings` / store `config` / keys `app` + `favorites` / version `1` — **do not change these**, existing users' data lives under them. Theme, accent color, and language are additionally mirrored to localStorage because prerendered pages need to read them synchronously before any script runs.

### Key tech
- Astro 7 (static output), hand-written CSS (no UI framework)
- Chart.js for trend visualizations
- IndexedDB (+ localStorage mirror) for user settings: theme, dark mode, accent color, language, favorites, preferred keywords
- Vitest + jsdom + fake-indexeddb for testing

## Paper Status Values

Papers in the data pipeline have a `status` field: `notchecked` → `inprogress` → `done` → `advanced` (LLM-analyzed with topics).

## Environment

Copy `.env.example` to `.env` for LLM analysis and cache encryption:
- `OPENAI_API_KEY`, `MODEL`, `BASE_URL` — for `--llm-analyze`
- `PRIVATE_ZIP_PASSWD` — for cache zip encryption

## Adding a New Conference/Year

Edit `data.yml` to add the conference entry (with XPath selectors or official file references), place any official CSV/BIB files in `official_cache/`, then run `uv run main.py --analyze`.
