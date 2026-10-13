# Finflo

A modular Next.js calculator website for **finflo.org**, using the approved Emerald composition, Cobalt palette and four-bar Finflo mark. This is a working implementation with an explicit coverage record; it is not a claim of complete competitor parity or public launch readiness.

The October 9, 2026 audit accounts for **204 Calculator.net entries**: **201 implemented calculator pages**, **548 calculation modes**, one real-estate directory and two explicitly unavailable tools. Remaining advanced capabilities and the evidence needed to finish them are recorded in [the mode review](docs/audit/remaining-modes.json).

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
npm run build
TEST_URL=http://127.0.0.1:3000 npm run test:e2e
node scripts/export-coverage.mjs
```

The browser suite requires Playwright Chromium (`npx playwright install chromium`). Tests include independently derived fixtures, numerical boundaries, composed ledgers, versioned tax rules, invalid inputs, UI interactions, offline use and accessibility checks. Default catalog execution is a smoke check, not independent proof of every mode.

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

Core calculations run in the browser. No account, database, advertising network or analytics service is required or configured. Currency-reference endpoints fetch shared public snapshots without receiving the entered amount or pair. Optional browser-assistant tools are described in the privacy page.

No DNS change, Search Console submission, paid subscription, ad-account setup or public audience change is included in the local build. Search foundations improve eligibility and usability; indexing, ranking speed, AI citations and revenue cannot be guaranteed.
