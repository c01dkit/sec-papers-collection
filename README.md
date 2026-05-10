# A Collection of Security Papers on Top-Tier Conferences

> [中文文档 / Chinese README](./README_zh.md)

## TLDR

A curated collection of academic papers in cybersecurity (and adjacent fields), sorted by venue and year, deployed via GitHub Pages.

**[Visit the website at sec.c01dkit.com](https://sec.c01dkit.com)**

Pull requests and issues are warmly welcomed.

## Included publications

Top-tier security ("the Big Four"):

- IEEE S&P (Oakland)
- USENIX Security Symposium (USENIX Sec)
- ACM CCS
- NDSS

Software-engineering venues with security-relevant content:

- ICSE
- ISSTA
- FSE
- ASE

System venues:

- ASPLOS
- SOSP
- OSDI (TODO)

## Website features

The site is a Vue 3 + Vite single-page app deployed at `sec.c01dkit.com`. From the left sidebar you can reach:

- **Home** — paper totals, per-conference yearly breakdown, recent updates, status badges (verified / pending / require-updates / advanced).
- **Search** — full title search across all included papers, filter by venue and year, click a row to copy the title, click the paperclip to open the paper, click the star to favorite. A "Favorites Only" toggle filters to your starred entries.
- **Trends** — yearly accepted-paper trend charts grouped by category (top-tier, software engineering, system).
- **Abstract** — pick a venue and year to read accepted papers with their abstracts, with the user's preferred keywords highlighted in the theme color.
- **Submission Timeline** — full submission/notification/camera-ready timeline for each Big-Four venue, kept in sync with the official CFPs.
- **Awards** — best-paper / distinguished-paper awards across years, grouped by year or by award type.
- **About** — changelog and the list of supporters.
- **More Sites** — curated links to related resources (best-paper-awards aggregators, CCF deadlines, Connected Papers, WisPaper, CS Papers, etc.).
- **Settings** — theming and personal preferences (see below).

### Personalization (Settings page)

All preferences are persisted in your browser's IndexedDB only — nothing is uploaded.

- Light / dark mode toggle, primary color picker, menu mode (static / overlay).
- Language toggle: English / 中文 (vue-i18n).
- Remember-preference switches for language, dark mode, and theme color.
- Show/hide the colored status dots on the home page (off by default).
- Preferred keywords for highlighting in Search and Abstract pages.
- LLM endpoint URL and API key (used by the in-browser features that talk to an OpenAI-compatible API).
- Paper favorites stored locally; surfaced in the Search page.

## Repository layout

```
analyzers/                Python crawl/parse/LLM analysis modules
cache/                    pickled crawl cache (SHA-256 keyed; see cache.zip)
official_cache/           official CSV/BIB files from venues
src/assets/data/          generated JSON consumed by the frontend
  data.json               full paper list (no abstracts, for size)
  data-quick-view.json    100 latest papers per publication
  data-statistics.json    aggregated counts by publication / year / category
  meta_json/<Pub>-<Yr>.json   per-conference details with abstracts
src/views/                Vue pages
src/service/              data-loading services and IndexedDB wrapper
src/locales/              en.json / zh.json
data.yml                  master config (venues, years, XPaths, official files)
main.py                   orchestrator entry point
```

## How to contribute?

Paper data is processed via [`uv`](https://docs.astral.sh/uv/). Clone the repo, edit `data.yml`, run `uv run main.py --analyze` locally to verify, and open a pull request. All contributors will be credited in the repository and on the website's About page.

### Updating paper details

```bash
uv sync                     # set up the Python environment
# ...edit data.yml...
uv run main.py --analyze    # crawl/parse and regenerate JSON in src/assets/data/
```

To speed up local crawling, unzip `cache.zip` into the repo root so the cached HTML/JSON is reused.

### Updating key information

- Since v0.3.6, the `status` keyword in `data.yml` marks each conference's processing state: `notchecked` (default) / `inprogress` / `done` / `advanced`, surfaced as `Not verified` / `Require updates` / `Verified` / `Advanced processed` on the home page.
- Since v0.3.0, files under `src/service/*Service.js` hold information that is not derived from papers themselves (changelog, sponsor list, submission timeline, awards). Edit them directly to publish news.

### LLM-assisted topic classification

`uv run main.py --llm-analyze` reads paper abstracts and tags topics via an OpenAI-compatible API. Configure it via a local `.env`:

```
OPENAI_API_KEY=...
MODEL=...
BASE_URL=...
PRIVATE_ZIP_PASSWD=...   # password for cache.zip
```

Results are cached as JSONL to avoid re-querying.

### `bib` files without cite keys

Some venues (e.g., recent IEEE Xplore exports for Oakland) ship `.bib` files where each entry's cite key is empty (`@INPROCEEDINGS {,`). `bibtexparser` cannot parse those, so run:

```bash
uv run analyzers/bib_analyzer.py official_cache/<file>.bib
```

This rewrites empty cite keys with random UUIDs in place. Cite keys are not used downstream — only `title`, `author`, `abstract`, and `url` are consumed.

## Frontend development

```bash
npm install
npm run dev              # Vite dev server
npm run build            # production build → dist/
npm run preview          # preview the build
npm run lint             # ESLint with --fix
npm run format           # Prettier
npm run deploy           # publish dist/ to GitHub Pages (--cname sec.c01dkit.com)
npm run deploy:build     # build + deploy
```

UI components are from [PrimeVue 4](https://primevue.org/) with Tailwind CSS 3; charts are Chart.js. See `primevue-document.md` for component-usage notes used while developing this site.

## Full publish cycle

```bash
uv run main.py --analyze --zip
npm run build
npm run deploy           # update package.json's --cname if you fork this
git add .
git commit -m "update $DATE"
git push origin main
```
