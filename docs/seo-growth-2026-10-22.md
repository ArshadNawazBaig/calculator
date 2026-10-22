# Search growth release — October 22, 2026

This release prioritizes existing calculator pages with observed search exposure. The supplied Search Console export is analyzed locally; raw account exports and the generated metrics report remain outside version control. It is not a claim that a local change has changed Google's rankings or that the production service has deployed it.

## Changes

- Replaced bare search titles and technical descriptions on ten calculators: area, ratio, volume, square footage, surface area, hours, rounding, scientific notation, long division, and exponents. Titles identify the actual task, and the same description appears in metadata and the visible page introduction.
- Added original, server-rendered answers and formula/example tables to the area, ratio, and volume pages. The content covers measurements, mixed units, composite shapes, missing proportion terms, equivalent ratios, and container capacity. Numerical fixtures check the examples against the working calculation engine. The explanatory content follows the calculator so visitors can reach the tool first.
- Added homepage links to ratio and volume, and explicit related-tool recommendations for all three priority pages. Existing canonical URLs remain the content destinations; no near-duplicate keyword pages were created.
- Added language, actual supported modes, and Finflo creator information to calculator WebApplication structured data. Ratings and external expert credentials are not invented.
- Added fixed sitemap modification dates only to the three substantially edited English articles. The dates reflect the content edit, not build or request time. Update the corresponding `modifiedAt` value when that article changes materially.
- Switched public route links, search navigation and city-clock route selection to standard browser document navigation. Browser testing exposed a timing bug where early client navigation could retain the previous page's title, description and canonical alongside the destination's. The same problem was reproduced on the existing live release. Native links avoid that hydration race while retaining ordinary browser history, modified clicks and same-page anchors. The tradeoff is a full document load between routes; calculator controls still work interactively within each page. Regression coverage includes immediate navigation with CPU throttling.
- Added a reusable Search Console CSV analysis command and regression coverage. It separates property totals from page/query totals, recomputes CTR from counts, identifies incomplete date windows and possible row truncation, and reports review priorities without treating them as traffic predictions.

The main calculator implementations already exposed useful HTML, self-canonicals, robots rules, and structured data. This work improves their content and presentation; it does not portray those working foundations as newly repaired defects.

## Measurement

```sh
npm run audit:search -- /path/to/search-console-export
```

The folder must contain the seven English-named standard exports: `Chart.csv`, `Pages.csv`, `Queries.csv`, `Countries.csv`, `Devices.csv`, `Filters.csv`, and `Search appearance.csv`. The default output, `test-results/search-console.json`, is ignored by Git. `--output` can select another local report path; avoid checking account data into a public repository.

The chart is the property baseline. Page and appearance aggregation can differ from it. Query rows can omit anonymized data and hit export limits. Independent page/query/country/device files are not a joined dataset. A low CTR beside an average position does not, by itself, prove a particular title or page defect.

After deployment, record the deployment time and use Search Console URL Inspection to request recrawling of the area, ratio, and volume URLs. Recheck the sitemap submission in the existing verified property. Neither action was submitted by this local workflow.

Compare complete seven-day windows for early diagnostics, then equivalent 28-day windows for decisions. Review each priority page's clicks, impressions, CTR and average position together; export page-filtered queries and split device/country within Search Console before attributing a change to a query or market. Avoid changing a title every few days before Google has recrawled it.

The requested 30,000 daily impressions and 500 daily clicks correspond to 1.67% CTR and 15,000 clicks per 30 days. One million monthly visits is a separate target, approximately 33,333 visits per day. Clicks and visits are different measurements. The report records these as arithmetic scenarios, not projections.

## Release status

The owner requested local preparation and testing only. No changes have been committed, pushed or deployed by this work. The production site still needs a later release of the verified checkout.

The public-site audit found the older release still serving 5,744 sitemap URLs, translated pages and the broken `/en` redirect. The existing October 22 remediation changes in this checkout address those problems and withdraw unreviewed translations; the intended sitemap contains 721 English URLs. Deploy the whole verified checkout, not just the new copy files.

Railway rejected the saved CLI login as expired. Its official outage update at October 22, 18:49 UTC still reported Hobby builds unavailable. Refresh the account login locally and confirm current provider status before deploying to the existing service. Do not change plans, domains, or hosting providers as an implicit workaround. See [deployment instructions](deployment.md) and the [earlier release record](adsense-release-2026-10-22.md).

## Framework patch and verification

The initial production build compiled successfully but surfaced a Next.js security advisory. The installed 16.4.0 release was in the affected range of published Next.js advisories. Next.js and `eslint-config-next` are now pinned to 16.4.2. The adapter compatibility guard was reverified for that exact version while preserving its content-hash assertions. The [official image-optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) and [cache-function advisory](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr) identify the patched release range.

The post-update production dependency audit reports zero known advisories. The full development audit still identifies the braces advisory through the ESLint dependency chain (five affected package nodes, one underlying development-tool advisory). No forced downgrade or broad dependency update was applied. This dependency result is not a comprehensive security assessment.

Completed verification includes TypeScript, ESLint, 3,330 unit tests across 57 files (`npm test -- --maxWorkers=2`), and the production build. One existing localization test exceeded its five-second timeout during the concurrent four-worker run; the complete two-worker rerun passed. The published-English translation check passed; the seven unpublished translations still have existing draft diagnostics. The final content review reran the 36 formula/content and CSV-analysis tests successfully.

The initial-HTML crawl checked all 721 sitemap pages and 723 internal path targets: zero errors, zero duplicate titles, and zero duplicate descriptions. It also checked robots rules, canonicals, language metadata, structured-data parsing, missing-page responses and excluded utility pages. This verifies the local build's outputs, not Google's indexing state.

Independent timing checks passed 12/12 immediate-navigation samples, including six with 4× CPU throttling. Each began while the old server metadata was still unclaimed by React and ended with one correct title, description and canonical. Keyboard search selection, search submission and header navigation also passed with no browser errors. This targets the actual failure window rather than hiding it behind a delay.

Document navigation resets transient page state. Saved plans and preferences keep their existing browser-storage behavior; the city-clock page's unsaved 12/24-hour toggle resets when selecting another city's route. There is no metadata DOM cleanup or dependency on private React fields in application code. The [matching upstream report](https://github.com/vercel/next.js/issues/97472#issuecomment-5653284177) also describes why hydration delays and disabled metadata streaming are insufficient.

The complete Chromium browser suite passed: 180 tests passed and 76 translation-specific checks were skipped because those languages are unpublished. This includes the seven new search-growth checks, mobile layouts, accessibility, calculation results, keyboard search, saved plans, browser history, and navigation metadata. The local report is `test-results/search-growth-browser-final.json`.

The final `npm run build:sites` passed the OpenNext build, Wrangler deployment dry run and staging of both WASM modules. The staged local worker passed eight HTTP checks and two browser checks: the three updated pages and their formula tables, private `noindex`, 404 handling, both redirect cases, health response, empty private sitemap, ratio calculation, and immediate navigation with 4× CPU throttling. The report is `test-results/search-growth-worker.json`. These are local compatibility checks; no deployment occurred. The exact native build that passed the full browser suite was restored and is available at `http://localhost:3100` while its local server is running.

## Next growth decisions

Start with the existing area, ratio and volume pages, then the adjacent geometry and arithmetic tools already linked from them. Use stable page/query comparisons to decide whether the next problem is low click-through at comparable positions, poor matching to the search task, or insufficient visibility. Preserve separate metrics for each of those questions.

Useful next product improvements include original labeled measurement diagrams, a proportion layout that visually shows A:B = C:D, and explicit radius/diameter input choices. These are identified follow-up opportunities, not features claimed in this release. Research actual page-filtered demand before creating additional landing pages. A separate backlink and distribution review would need evidence beyond the supplied performance CSVs.

## Public guidance used

Google recommends descriptive, concise [title links](https://developers.google.com/search/docs/appearance/title-link) and page-specific [meta descriptions](https://developers.google.com/search/docs/appearance/snippet). It can choose different titles and snippets from page content, so these values are editorial inputs, not controlled search-result output.

Google's [AI features guidance](https://developers.google.com/search/docs/appearance/ai-features) emphasizes ordinary search eligibility, accessible text, internal links and useful content; it does not require a special AI text file or special schema. The new answers and worked examples follow that approach.

Google's [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) requires accurate modification dates for meaningful page changes. No artificial daily timestamps, priority scores, mass-generated pages or fabricated authority signals are part of this release.
