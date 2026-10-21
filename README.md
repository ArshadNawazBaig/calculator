# Finflo

A modular Next.js calculator website for **finflo.org**, using Finflo's existing green palette, typography, and shared calculator components. This is a working implementation with an explicit coverage record; it is not a claim of complete competitor parity or public launch readiness.

The current release source contains **216 calculator pages**, **572 calculation modes**, **six guides**, and one real-estate directory. With production indexing enabled, it publishes **721 English sitemap URLs**. The seven other supported languages remain unpublished drafts. The [October 22 release record](docs/adsense-release-2026-10-22.md) records validation and deployment status; these source counts alone do not establish what is live.

The historical audit accounts for 204 Calculator.net entries, including the subsequently removed WeightWatchers placeholder; later original tools are recorded separately. See the [planning toolkit](docs/planning-toolkit.md), [coverage manifest](docs/audit/coverage-manifest.json), and [mode review](docs/audit/remaining-modes.json).

## Run locally

Requires Node.js 22 and npm. From this directory:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. For a production build:

```sh
npm run build
npm run start
```

The contact address is **erushbaig@gmail.com**. `NEXT_PUBLIC_SITE_URL` controls absolute canonical/social URLs. `NEXT_PUBLIC_INDEXABLE=false` keeps previews out of search and produces an empty XML sitemap. Change public variables **before building**, since static pages embed them. `MAINTENANCE_MODE=true` enables the tested 503 maintenance response in native Next; see deployment notes for adapter handling.

## Verify and maintain

```sh
npm run typecheck
npm run lint
npm test
npm run i18n:check
npm run build
TEST_URL=http://127.0.0.1:3000 npm run test:e2e
node scripts/export-coverage.mjs
```

The browser suite requires Playwright Chromium (`npx playwright install chromium`). Tests include independently derived fixtures, numerical boundaries, composed ledgers, versioned tax rules, invalid inputs, UI interactions, offline use and accessibility checks. Default catalog execution is a smoke check, not independent proof of every mode.

`publishedLocales` in `src/lib/i18n/config.ts` is the publication allowlist, currently `['en']`. Draft language URLs temporarily redirect with HTTP 307 to the equivalent English path, preserving queries, browser fragments and existing browser storage. Redirect responses carry `X-Robots-Tag: noindex, follow`. Navigation, metadata and sitemap entries advertise only published languages. Translation files and tests remain available for review; `npm run i18n:check` reports draft diagnostics without treating unpublished drafts as release failures. Use `npm run i18n:check -- --all-locales` to require all dictionaries to pass. Generating translation manifests does not publish languages.

- [Coverage manifest](docs/audit/coverage-manifest.json) and [captured competitor controls](docs/audit/catalog.json)
- [Architecture and design](docs/architecture.md)
- [Languages and translation coverage](docs/internationalization.md)
- [Costs and database decision](docs/costs.md)
- [Verification evidence](docs/verification.md)
- [Launch and search plan](docs/launch.md)
- [Deployment instructions](docs/deployment.md)

## Local workspace

Visitors can favorite calculators, save named calculations, reopen their inputs, and compare up to three scenarios using the same calculator, mode, and currency. `/workspace` stores these items in the current browser only, with no account or database. JSON backups can be exported and imported on another device; clearing site data removes the local copy. Password and encoding tools do not save inputs or results. Saved summaries retain their original calculation date; reopening restores inputs and requires Calculate to refresh the full result.

## Project layout

- `src/app`: App Router pages, metadata routes, error boundaries and public-reference APIs.
- `src/components`: reusable branding, navigation, calculator inputs, results, tables and page sections.
- `src/lib/calculators`: typed registry, validation, units and independent calculation engines.
- `src/data`: original editorial content, sources and versioned reference data.
- `tests`: numerical/reference fixtures and browser checks.
- `docs/audit` and `docs/research`: discovery, coverage, source provenance and unresolved work.

Core calculations run in the browser. No account, database, advertising network or analytics service is required. AdSense ownership is verified using a metadata tag and `public/ads.txt`; the ad-serving script is not loaded during site review. Optional Cloudflare analytics is controlled by its public environment token. Currency-reference endpoints fetch shared public snapshots without receiving the entered amount or pair. Optional browser-assistant tools are described in the privacy page.

The [AdSense content remediation notes](docs/adsense-content-review.md) describe the worked guides and verification setup. Use the [October 22 release record](docs/adsense-release-2026-10-22.md) for the final checks and any steps remaining before requesting another Google review.

A local build does not deploy the site or submit an AdSense/Search Console review. Search foundations improve eligibility and usability; indexing, ranking speed, AI citations and revenue cannot be guaranteed.
