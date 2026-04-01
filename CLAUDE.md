# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Vue 3 + Vite web app displaying curated academic security papers from top-tier conferences (IEEE S&P, USENIX Security, ACM CCS, NDSS) and related venues (ICSE, ISSTA, FSE, ASPLOS, SOSP). Deployed to GitHub Pages at sec.c01dkit.com.

## Commands

### Frontend (JavaScript/Vue)
```bash
npm run dev           # Start Vite dev server
npm run build         # Production build to dist/
npm run preview       # Preview production build
npm run lint          # ESLint with auto-fix
npm run format        # Prettier formatting
npm run deploy        # Deploy dist/ to GitHub Pages
npm run deploy:build  # Build then deploy
```

### Backend (Python data processing)
```bash
uv sync                             # Install Python deps
uv run main.py --analyze            # Crawl/parse papers and generate JSON data files
uv run main.py --llm-analyze        # Analyze abstracts with LLM (requires .env)
uv run main.py --zip                # Create encrypted zip of crawl cache
uv run main.py --unzip              # Unzip crawl cache
```

### Full publish cycle
```bash
uv run main.py --analyze --zip && npm run build && npm run deploy
```

## Architecture

**Data flow:** `data.yml` (conference config) → `main.py` (Python processing) → JSON files in `src/assets/data/` → Vue frontend

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

### Vue frontend (`src/`)
- **Router:** `src/router/index.js`
- **Layout:** `src/layout/` — AppLayout wrapping AppTopbar, AppSidebar, AppFooter; layout state via `composables/layout.js`
- **Views:** `src/views/` — Dashboard, paper/Search, paper/Trends, paper/ViewAbstract, paper/SubmissionTimeline, reputation/Awards, misc/About, misc/Settings
- **Services:** `src/service/` — pure JS modules for data loading (SettingsService uses IndexedDB for theme/language persistence)
- **i18n:** English/Chinese via `src/locales/`; locale persisted in localStorage

### Key tech
- Vue 3 Composition API, Vue Router 4, Vue-i18n
- PrimeVue 4 + Tailwind CSS 3 for UI
- Chart.js for trend visualizations
- IndexedDB for user settings (theme, dark mode, language, LLM config)

## Paper Status Values

Papers in the data pipeline have a `status` field: `notchecked` → `inprogress` → `done` → `advanced` (LLM-analyzed with topics).

## Environment

Copy `.env.example` to `.env` for LLM analysis and cache encryption:
- `OPENAI_API_KEY`, `MODEL`, `BASE_URL` — for `--llm-analyze`
- `PRIVATE_ZIP_PASSWD` — for cache zip encryption

## Adding a New Conference/Year

Edit `data.yml` to add the conference entry (with XPath selectors or official file references), place any official CSV/BIB files in `official_cache/`, then run `uv run main.py --analyze`.
