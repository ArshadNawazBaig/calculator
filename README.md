# Finflo

A modular Next.js calculator website for **finflo.org**, using Finflo's existing green palette, typography, and shared calculator components. This is a working implementation with an explicit coverage record; it is not a claim of complete competitor parity or public launch readiness.

The source enables English, Spanish, French, German, Portuguese, Arabic, Hindi and Filipino. Calculator content and shared controls use the selected language, with matching localized routes and search metadata. The [October 22 release record](docs/adsense-release-2026-10-22.md) describes the earlier English-only release; source changes and local validation do not establish what is deployed.

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
npm run check:repo
npm run typecheck
npm run lint
npm test
npm run i18n:check
npm run build
TEST_URL=http://127.0.0.1:3000 npm run test:e2e
node scripts/export-coverage.mjs
```

Generated audit reports, screenshots, implementation snapshots, and search-map CSV exports are kept locally and ignored by Git. Historical evidence links point to the last committed copies. Put working notes in `docs/local/`. Run `npm run audit:content` before `node scripts/audit-calculator-browser.mjs`, and `npm run audit:value` before `npm run audit:value:rendered`, to regenerate their input reports on a fresh checkout.

`npm run check:repo` rejects tracked files that match repository ignore rules, including files added with `git add -f`. It runs before the local verification suite and in pull-request/main-branch CI. Keep future commits focused on required project files, as documented in [AGENTS.md](AGENTS.md); retain historical artifacts locally or in Git history.

Next.js generates `next-env.d.ts`; it is also ignored. The typecheck command runs `next typegen` first so it works on a fresh checkout before a build or development server has run.

Content illustrations are local WebP files under `public/illustrations/`, rendered as HTML images with descriptive, translated alt text. Small selector pictures and homepage backdrops are decorative and use empty alt text beside their visible labels. Mathematical symbols remain in the artwork; surrounding explanations stay selectable and translated. Interactive charts, maps and wheels retain their drawing controls.

Edit the maintained artwork in `scripts/illustrations/sources/`, then run `npm run illustrations:generate` to export the images and `src/data/illustrations.json`. The exporter uses Sharp, preserves transparent fills, and produces 3× measurement images and 4× selector pictures. Keep these required public assets and their manifest in Git. Retain the homepage Lucide attribution in `public/illustrations/home/LICENSE.txt`. After changing descriptions, update all enabled dictionaries and run the translation audit before regenerating message bundles. The application does not rasterize diagrams at request time.

Most calculator topic illustrations and their social previews use the catalog's Lucide symbols. Run `npm run illustrations:calculators` after changing the catalog, its icons, or `src/data/calculator-visual-themes.json`. Commit the resulting WebP files, JPEG share images, and `src/data/calculator-visuals.json`. The generator checks the symbol descriptions in `scripts/illustrations/sources/calculator-symbols.json` and their translations in `src/data/locales/calculator-symbols.json`. Add a description for every new symbol in each published language, and retain the Lucide license in the output directory. The pregnancy calculator keeps its separate artwork and visual explanation. `tests/calculator-visuals.test.ts` checks catalog coverage and localized descriptions.

The worked examples in `src/data/calculator-examples/` supply both the accessible HTML tables and the figures in `public/illustrations/examples/`. When changing a scenario, update its inputs and arithmetic together, translate its title and labels in the content dictionaries, and run `npm run illustrations:calculators` and `npm run i18n:check`. The volume guide has three dedicated diagrams managed by `npm run illustrations:generate`.

The volume calculator cover and share image use the geometry theme. Its tank, planter, and pipe illustrations use the same tile layout from `scripts/illustrations/sources/calculator-artwork.tsx`. Edit their measurements and drawings in `scripts/illustrations/sources/volume-examples.tsx` and export them with `npm run illustrations:generate`.

The browser suite requires Playwright Chromium (`npx playwright install chromium`). Tests include independently derived fixtures, numerical boundaries, composed ledgers, versioned tax rules, invalid inputs, UI interactions, offline use and accessibility checks. Default catalog execution is a smoke check, not independent proof of every mode.

Pass `caret: 'initial'` to Playwright page and locator screenshots: the default caret hiding temporarily changes input styles and can race with hydration. Before client-controlled interactions, wait for the control's actual hydrated readiness, such as an initially disabled slider becoming enabled. Check `console.error` messages for hydration diagnostics as well as `pageerror`; attribute mismatches may not throw an exception.

`publishedLocales` in `src/lib/i18n/config.ts` enables all eight supported languages. English uses unprefixed URLs; other languages use `/es`, `/fr`, `/de`, `/pt`, `/ar`, `/hi` and `/tl`. Language switching preserves the current page, query, fragment and browser preferences. The menu also supports translated search, workspace and status pages, which remain outside the sitemap. `npm run i18n:check` requires every enabled dictionary to contain the current source messages and preserve placeholders, numbers and formulas. Update translations whenever English content changes, then regenerate the message manifests with `npm run i18n:check -- --all-locales --write-manifests`.

- [Coverage manifest](docs/audit/coverage-manifest.json) and [captured competitor controls](docs/audit/catalog.json)
- [Architecture and design](docs/architecture.md)
- [Languages and translation coverage](docs/internationalization.md)
- [Costs and database decision](docs/costs.md)
- [Verification evidence](docs/verification.md)
- [Launch and search plan](docs/launch.md)
- [Deployment instructions](docs/deployment.md)

## Local workspace

Visitors can favorite calculators, save named calculations, reopen their inputs, and compare up to three scenarios using the same calculator, mode, and currency. `/workspace` stores these items in the current browser only, with no account or database. JSON backups can be exported and imported on another device; clearing site data removes the local copy. Password and encoding tools do not save inputs or results. Saved summaries retain their original calculation date; reopening restores inputs and requires Calculate to refresh the full result.

## Blog and super admin

`/blog` publishes database-backed articles in English. Blog articles and the private admin dashboard remain English; language selection applies to calculator content, guides and static site pages. Open `/admin/sign-in` to write and preview articles in Finflo's visual editor. The private dashboard supports publishing, unpublishing, archiving and permanent deletion. The dashboard reuses the site's own components and theme; the editor retains Markdown storage and an advanced source view. Public signup is disabled. Articles receive a real author, publication date, canonical metadata and published-only sitemap entries. The empty blog stays out of search until an article is published. See the [dashboard/editor update](docs/dashboard-editor-2026-11-10.md) for supported formatting and verification.

Use a new Finflo Neon PostgreSQL project with the native Node.js deployment. Set private `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`, apply `npm run db:migrate`, then run `npm run admin:create` from a trusted terminal. See [blog setup and operations](docs/blog-admin.md) for exact configuration, account provisioning, backups and verification. Calculator visitors still need no account; calculator inputs and the workspace stay in their browser.

## Source layout

- `src/app`: App Router pages, metadata routes, error boundaries and public-reference APIs.
- `src/components`: reusable branding, navigation, calculator inputs, results, tables and page sections.
- `src/lib/calculators`: typed registry, validation, units and independent calculation engines.
- `src/data`: original editorial content, sources and versioned reference data.
- `tests`: numerical/reference fixtures and browser checks.
- `docs/audit` and `docs/research`: discovery, coverage, source provenance and unresolved work.

Core calculations run in the browser. No account, database, advertising network or analytics service is required. AdSense ownership is verified using a metadata tag and `public/ads.txt`; the ad-serving script is not loaded during site review. Optional Cloudflare analytics is controlled by its public environment token. Currency-reference endpoints fetch shared public snapshots without receiving the entered amount or pair. Optional browser-assistant tools are described in the privacy page.

The [AdSense content remediation notes](docs/adsense-content-review.md) describe the worked guides and verification setup. Use the [October 22 release record](docs/adsense-release-2026-10-22.md) for the final checks and any steps remaining before requesting another Google review.

The [search growth changes](docs/seo-growth-2026-10-22.md) document the subsequent calculator titles, worked references, framework patch, and local validation. Analyze a new Search Console export with `npm run audit:search -- /path/to/export-folder`; the seven standard CSV files produce an ignored local report at `test-results/search-console.json`. Keep raw account exports and reports outside the public repository.

A local build does not deploy the site or submit an AdSense/Search Console review. Search foundations improve eligibility and usability; indexing, ranking speed, AI citations and revenue cannot be guaranteed.
