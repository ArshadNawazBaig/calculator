# Languages

Finflo supports English, Spanish, French, German, Portuguese and Arabic. English retains its existing unprefixed addresses. Other languages use `/es`, `/fr`, `/de`, `/pt` and `/ar`. The menu keeps the current page, query and fragment when switching language; full document navigation updates `html.lang`, text direction and fonts. Explicit language URLs are stable for visitors and crawlers. There are no automatic language redirects, new cookies, translation API calls, database requirements or paid translation subscriptions.

## Coverage

- All 204 calculator names, category and subcategory names, localized homepages and directories.
- Header, footer, language menu, live search, category filters and search results.
- Shared calculator actions, common field/mode labels, result labels, dropdown controls, calendar controls and export actions. The eight featured calculators have expanded mode, field and result-label coverage.
- Locale-aware result numbers and currency formatting; calendars use the Gregorian calendar with localized month/day controls. Arabic uses RTL and Noto Sans Arabic alongside the existing Manrope Latin font.
- Localized error, missing-page and connection/maintenance page introductions.

This is interface and discovery localization, not a claim that every article and specialized method has been fully translated. Technical explanations, formula references, guides, policies and some specialized field/mode labels retain English source content. Mixed-language pages display an explicit notice and a link to the English version. Original reference text is marked `lang="en"` and `dir="ltr"`. Full legal, editorial and specialist-calculator translation remains separate work.

Language suggests a default country and currency unless the visitor has saved a preference. The language menu offers country and currency controls, and eligible calculators also have a currency selector. A country selection suggests its currency; an explicit currency override remains available. Preferences persist in local storage across pages, reloads and languages. “Use language defaults” removes the saved choice. No location lookup, exchange-rate request, cookie or new service is needed.

Reviewed general financial and cost models use the selected currency for input labels, results, detailed table headings and CSV exports. Currency changes leave the entered numbers unchanged and do not perform conversion; a visible note states this. Currency-specific fractional digits are used for monetary presentation (for example JPY and KWD). Regional tax, retirement and mortgage models retain their required currencies and rules, with a visible explanation. A mixed-purpose calculator applies this policy per mode: the historical US CPI mode remains USD while an assumed inflation scenario supports the selected currency. The currency converter and modes with explicit currency inputs keep their own controls. Fixed editorial worked examples identify their reference currency.

Preferences do not change measurement units, tax jurisdictions, effective years, assumptions or calculation algorithms. Form values, option identifiers and ISO date values are unchanged. String result values and table cells are preserved verbatim, including decoded text, generated passwords and user-supplied names. CSV uses UTF-8 with a BOM for non-Latin characters and a currency metadata row for eligible monetary results. Only country and currency preferences are persisted; calculator inputs and outputs are not saved.

Suggested countries are US for English, Spain for Spanish, France for French, Germany for German, Brazil for Portuguese and UAE for Arabic. These are editable product defaults, not detected visitor locations. Currency references include the [ECB euro overview](https://www.ecb.europa.eu/euro/intro/html/index.fr.html), [Banco Central do Brasil currency information](https://www.bcb.gov.br/cedulasemoedas) and [CBUAE currency definition](https://rulebook.centralbank.ae/en/rulebook/article-52-currency-unit).

## Structure and search

`src/lib/i18n/config.ts` owns locales, paths and translation lookup. `src/data/locales/*.json` contains the five checked-in dictionaries. English source labels are fallback keys; calculator names use `tool.<slug>`. Each locale loads only its own dictionary into `LanguageProvider`. Shared components and the locale-aware Link keep internal navigation in the selected language.

`src/lib/i18n/preferences.ts` validates the country/currency allowlists and language defaults. The client preferences provider uses a stable server snapshot so static HTML and hydration agree, synchronizes storage changes across tabs, and falls back to in-memory preferences when storage is blocked. `src/lib/calculators/currency-policy.ts` contains the reviewed selectable models and fixed regional exceptions; new algorithms must be reviewed before accepting a currency override. Preferences do not affect canonical URLs, indexing or static caching.

English pages live in the `(en)` route group without changing their public URLs. Each other language has a small static route wrapper using shared layout and page factories. Home/category pages and popular calculators are prerendered; other existing tools are rendered on demand and cached. Unknown paths return 404. `/en/*` and legacy calculator aliases redirect permanently to the canonical path.

Search includes translated names and the original English names/slugs. Unicode normalization ignores accents and Arabic vowel marks while keeping category restrictions. Adding a new calculator requires a name in every dictionary; the coverage test enforces this.

## Indexing

The 27 complete discovery/landing pages have reciprocal `hreflang` links for all six languages and English `x-default`. Their localized versions are self-canonical and included in the sitemap. The current sitemap contains 377 URLs: 242 existing English pages and 135 translated landing pages.

Mixed-language tool, guide and policy pages are self-canonical but **noindex**. They are not included in the sitemap or advertised as completed language alternates. Original English calculator pages remain indexable. Expand this coverage only after the corresponding article, methods, examples and specialist interface strings are translated and checked. Preview hostname HTTP noindex protections continue to apply to every language.

## Verification

- Production build succeeds with indexing enabled: 411 prerendered routes plus on-demand localized routes.
- Full calculator/unit suite: 2,858 passing tests, including translation coverage, route/search behavior, currency policies and preservation of textual calculator outputs.
- Country/currency controls, persistence, exports, regional exceptions, blocked storage and hydration were checked in the production build. The language and existing site regression suites also passed (30 browser checks in total). See [currency preference validation](validation/currency-preferences.json).
- Seven language browser checks passed locally and on the deployed Railway origin. They cover waiting for interactive handlers on slow connections, switching, translated suggestions and category filters, query preservation, Arabic calculation/RTL, French date picker, localized metadata, 404s, accessibility and layouts from 360px to 1440px.
- Existing English site and search browser checks were run; a category-message regression was corrected and the search suite passed.
- Local production crawl: all 377 sitemap pages and 1,450 internal paths resolve, with correct canonical/indexing behavior. See [the report](validation/multilingual-indexing.json). This does not establish custom-domain DNS/TLS or Google indexing.
- Live HTTPS audit: all 377 sitemap pages and 30 representative mixed-language calculator pages passed, using normal TLS verification against `https://finflo.org`. See [the live report](validation/live-indexing-readiness.json). Google Search Console ownership and indexing remain separate account actions.

Run `npm test`, `npm run lint` and `npm run build`. Browser checks use `TEST_URL=<running-site> TEST_INDEXABLE=true npx playwright test tests/e2e/languages.spec.ts tests/e2e/search.spec.ts` against an indexable production build.
