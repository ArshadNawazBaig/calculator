# Languages

Finflo supports English, Spanish, French, German, Portuguese and Arabic. English retains its existing unprefixed addresses. Other languages use `/es`, `/fr`, `/de`, `/pt` and `/ar`. The menu keeps the current page, query and fragment when switching language; full document navigation updates `html.lang`, text direction and fonts. Explicit language URLs are stable for visitors and crawlers. There are no automatic language redirects, new cookies, translation API calls, database requirements or paid translation subscriptions.

## Coverage

- All 204 calculator names, category and subcategory names, localized homepages and directories.
- Header, footer, language menu, live search, category filters and search results.
- Calculator instructions, mode and field labels, hints, result labels and explanations, formulas, worked examples, FAQs and source labels for all 201 implemented calculators.
- The three guides and nine information/policy pages, including privacy, terms, accessibility and methodology.
- Shared calculator actions, validation messages, dropdown/calendar controls, file and coordinate tools, and export actions.
- Locale-aware result numbers and currency formatting; calendars use the Gregorian calendar with localized month/day controls. Arabic uses RTL and Noto Sans Arabic alongside the existing Manrope Latin font.
- Localized error, missing-page and connection/maintenance page introductions.

The extended content dictionaries were generated with local OPUS translation models and corrected where the numerical, placeholder and sample content checks found problems. They have not undergone a comprehensive native-speaker or licensed professional review. Formulas, source URLs, regional assumptions and calculation algorithms remain those of the English source. User-entered strings, identifiers and scientific notation are intentionally preserved.

Language suggests a default country and currency unless the visitor has saved a preference. The language menu offers country and currency controls, and eligible calculators also have a currency selector. A country selection suggests its currency; an explicit currency override remains available. Preferences persist in local storage across pages, reloads and languages. “Use language defaults” removes the saved choice. No location lookup, exchange-rate request, cookie or new service is needed.

Reviewed general financial and cost models use the selected currency for input labels, results, detailed table headings and CSV exports. Currency changes leave the entered numbers unchanged and do not perform conversion; a visible note states this. Currency-specific fractional digits are used for monetary presentation (for example JPY and KWD). Regional tax, retirement and mortgage models retain their required currencies and rules, with a visible explanation. A mixed-purpose calculator applies this policy per mode: the historical US CPI mode remains USD while an assumed inflation scenario supports the selected currency. The currency converter and modes with explicit currency inputs keep their own controls. Fixed editorial worked examples identify their reference currency.

Preferences do not change measurement units, tax jurisdictions, effective years, assumptions or calculation algorithms. Form values, option identifiers and ISO date values are unchanged. String result values and table cells are preserved verbatim, including decoded text, generated passwords and user-supplied names. CSV uses UTF-8 with a BOM for non-Latin characters and a currency metadata row for eligible monetary results. Only country and currency preferences are persisted; calculator inputs and outputs are not saved.

Suggested countries are US for English, Spain for Spanish, France for French, Germany for German, Brazil for Portuguese and UAE for Arabic. These are editable product defaults, not detected visitor locations. Currency references include the [ECB euro overview](https://www.ecb.europa.eu/euro/intro/html/index.fr.html), [Banco Central do Brasil currency information](https://www.bcb.gov.br/cedulasemoedas) and [CBUAE currency definition](https://rulebook.centralbank.ae/en/rulebook/article-52-currency-unit).

## Structure and search

`src/lib/i18n/config.ts` owns locales, paths and translation lookup. `src/data/locales/*.json` contains the five checked-in dictionaries. English source labels are fallback keys; calculator names use `tool.<slug>`. Each locale loads only its shared interface dictionary into `LanguageProvider`. Longer content lives in `src/data/locales/content/<locale>.json` and is translated during server rendering. Calculator forms receive only their page messages and relevant category engine messages through `TranslationMessages`; the entire article library is not shipped to the client. Shared components and the locale-aware Link keep internal navigation in the selected language.

`scripts/i18n-source.mjs` extracts source content and engine/UI messages. `npm run i18n:check` fails for missing translations or interpolation placeholders. After editing translations, `node scripts/check-translations.mjs --write-manifests` refreshes page/category message bundles and the indexable route manifest only when every language passes coverage. Dynamic engine messages use anchored templates; raw string result values never pass through this matcher.

`src/lib/i18n/preferences.ts` validates the country/currency allowlists and language defaults. The client preferences provider uses a stable server snapshot so static HTML and hydration agree, synchronizes storage changes across tabs, and falls back to in-memory preferences when storage is blocked. `src/lib/calculators/currency-policy.ts` contains the reviewed selectable models and fixed regional exceptions; new algorithms must be reviewed before accepting a currency override. Preferences do not affect canonical URLs, indexing or static caching.

English pages live in the `(en)` route group without changing their public URLs. Each other language has a small static route wrapper using shared layout and page factories. Every sitemap page in each language is included in the prerender list; other valid system or unavailable-tool routes can render on demand and remain excluded from indexing. Unknown paths return 404. `/en/*` and legacy calculator aliases redirect permanently to the canonical path.

Search includes translated names and the original English names/slugs. Unicode normalization ignores accents and Arabic vowel marks while keeping category restrictions. Adding a new calculator requires a name in every dictionary; the coverage test enforces this.

## Indexing

All 242 sitemap paths have versions in six languages, for **1,452 URLs**: 242 each in English, Spanish, French, German, Portuguese and Arabic. Each version has a self-canonical URL, reciprocal `hreflang` links and English `x-default`. The same manifest controls localized metadata, sitemap expansion and static generation.

Search, status and unavailable-tool pages remain **noindex** and outside the sitemap. Unknown paths return 404. `NEXT_PUBLIC_INDEXABLE=false` still disables indexing and returns an empty sitemap; noncanonical-host HTTP noindex protections also remain in place.

## Verification

The October 10, 2026 local production check passed for all 1,452 sitemap URLs: HTTP 200, canonical URLs, indexing permission, document languages and seven language alternates. All 2,868 unit tests, TypeScript, lint and the production build passed. The eight language browser checks passed, including a focused rerun after fixing the localized 401(k) redirect loop. See the [expanded sitemap validation](validation/multilingual-content.json).

The translation tests cover dictionary coverage, placeholder substitution, raw user-output preservation, localized server articles, all 1,452 sitemap entries, reciprocal alternates and preview indexing protection. The language browser suite covers translated calculator articles, guides and policies alongside existing navigation, calculation, RTL, accessibility and responsive-layout checks.

Run `npm run i18n:check`, `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`. Browser checks use `TEST_URL=<running-site> npx playwright test tests/e2e/languages.spec.ts`.

The earlier [live audit](validation/live-indexing-readiness.json) records the previous 377-URL deployment. Local verification of the expanded sitemap does not imply deployment or that Google has indexed its URLs. Submit the existing `/sitemap.xml` address after deployment; Search Console will need to fetch and process the expanded file.
