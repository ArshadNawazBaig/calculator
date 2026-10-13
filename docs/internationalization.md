# Languages

Finflo supports English, Spanish, French, German, Portuguese, Arabic, Hindi and Filipino. English retains its existing unprefixed addresses. Other languages use `/es`, `/fr`, `/de`, `/pt`, `/ar`, `/hi` and `/tl`. Filipino uses the ISO language code `tl` in URLs and language alternatives, with `fil-PH` for number and date formatting. The menu keeps the current page, query and fragment when switching language; full document navigation updates `html.lang`, text direction and fonts. Explicit language URLs are stable for visitors and crawlers. There are no automatic language redirects, new cookies, translation API calls, database requirements or paid translation subscriptions.

## Coverage

- All 203 catalog names (202 calculators and one directory hub), category and subcategory names, localized homepages and directories.
- Header, footer, language menu, live search, category filters and search results.
- Calculator instructions, mode and field labels, hints, result labels and explanations, formulas, worked examples, FAQs and source labels for all 202 implemented calculators.
- The three guides and nine information/policy pages, including privacy, terms, accessibility and methodology.
- Shared calculator actions, validation messages, dropdown/calendar controls, file and coordinate tools, and export actions.
- Locale-aware result numbers and currency formatting; calendars use the Gregorian calendar with localized month/day controls. Arabic uses RTL and Noto Sans Arabic; Hindi uses Noto Sans Devanagari. Other languages retain the Manrope Latin font.
- Localized error, missing-page and connection/maintenance page introductions.

The extended content dictionaries started with local OPUS translation models. Hindi and Filipino longer passages also received local SMALL100 and selected MADLAD refinements, followed by direct revisions to every new calculator guidance section, directory explanation, calculator name and shared interface message. Selected existing descriptions and technical notes were revised as well. Numerical, placeholder and formula checks cover every source message. These are machine-assisted translations; they have not undergone a comprehensive native-speaker or licensed professional review. Formulas, source URLs, regional assumptions and calculation algorithms remain those of the English source. User-entered strings, identifiers and scientific notation are intentionally preserved. Translation runs add no runtime service, subscription or application dependency.

Language suggests a default country and currency unless the visitor has saved a preference. The language menu offers country and currency controls, and eligible calculators also have a currency selector. A country selection suggests its currency; an explicit currency override remains available. Preferences persist in local storage across pages, reloads and languages. “Use language defaults” removes the saved choice. No location lookup, exchange-rate request, cookie or new service is needed.

Reviewed general financial and cost models use the selected currency for input labels, results, detailed table headings and CSV exports. Currency changes leave the entered numbers unchanged and do not perform conversion; a visible note states this. Monetary presentation uses the currency's fractional digits capped at two per the requested display policy: JPY remains whole units; KWD displays two places. Calculation precision is retained. Regional tax, retirement and mortgage models retain their required currencies and rules, with a visible explanation. A mixed-purpose calculator applies this policy per mode: the historical US CPI mode remains USD while an assumed inflation scenario supports the selected currency. The currency converter and modes with explicit currency inputs keep their own controls. Fixed editorial worked examples identify their reference currency.

Preferences do not change measurement units, tax jurisdictions, effective years, assumptions or calculation algorithms. Form values, option identifiers and ISO date values are unchanged. String result values and user data in table cells are preserved verbatim, including decoded text, generated passwords and user-supplied names. Tables may explicitly mark columns of application-owned labels for translation; the BTU surface column uses this in both the displayed table and CSV export. Geographic option labels retain their source spelling. CSV uses UTF-8 with a BOM for non-Latin characters and a currency metadata row for eligible monetary results. Country and currency preferences persist automatically when selected. Favorites and named calculations persist only when explicitly saved in My workspace; this device storage is shared across language pages.

Suggested countries are US for English, Spain for Spanish, France for French, Germany for German, Brazil for Portuguese, UAE for Arabic, India for Hindi and the Philippines for Filipino. The new defaults are INR and PHP respectively. These are editable product defaults, not detected visitor locations. Currency references include the [ECB euro overview](https://www.ecb.europa.eu/euro/intro/html/index.fr.html), [Banco Central do Brasil currency information](https://www.bcb.gov.br/cedulasemoedas) and [CBUAE currency definition](https://rulebook.centralbank.ae/en/rulebook/article-52-currency-unit).

## Structure and search

`src/lib/i18n/config.ts` owns locales, paths and translation lookup. `src/data/locales/*.json` contains the seven checked-in translation dictionaries. English source labels are fallback keys; calculator names use `tool.<slug>`. Each locale loads only its shared interface dictionary into `LanguageProvider`. Longer content lives in `src/data/locales/content/<locale>.json` and is translated during server rendering. Calculator forms receive only their page messages and relevant category engine messages through `TranslationMessages`; the entire article library is not shipped to the client. Shared components and the locale-aware Link keep internal navigation in the selected language.

`scripts/i18n-source.mjs` extracts source content and engine/UI messages. `npm run i18n:check` fails for missing translations or interpolation placeholders. After editing translations, `node scripts/check-translations.mjs --write-manifests` refreshes page/category message bundles and the indexable route manifest only when every language passes coverage. Dynamic engine messages use anchored templates. Only application-owned metric values explicitly marked `translateValue` are translated; raw user string results bypass the matcher.

`src/lib/i18n/preferences.ts` validates the country/currency allowlists and language defaults. The client preferences provider uses a stable server snapshot so static HTML and hydration agree, synchronizes storage changes across tabs, and falls back to in-memory preferences when storage is blocked. `src/lib/calculators/currency-policy.ts` contains the reviewed selectable models and fixed regional exceptions; new algorithms must be reviewed before accepting a currency override. Preferences do not affect canonical URLs, indexing or static caching.

English pages live in the `(en)` route group without changing their public URLs. Each other language has a small static route wrapper using shared layout and page factories. Every sitemap page in each language is included in the prerender list; other valid system or unavailable-tool routes can render on demand and remain excluded from indexing. Unknown paths return 404. `/en/*` and legacy calculator aliases redirect permanently to the canonical path.

Search includes translated names and the original English names/slugs. Unicode normalization ignores accents and Arabic vowel marks while keeping category restrictions. Adding a new calculator requires a name in every dictionary; the coverage test enforces this.

## Indexing

All 243 sitemap paths have versions in eight languages, for **1,944 URLs**: 243 each in English, Spanish, French, German, Portuguese, Arabic, Hindi and Filipino. Each version has a self-canonical URL, reciprocal `hreflang` links and English `x-default`. The same manifest controls localized metadata, sitemap expansion and static generation.

Search, status and unavailable-tool pages remain **noindex** and outside the sitemap. Unknown paths return 404. `NEXT_PUBLIC_INDEXABLE=false` still disables indexing and returns an empty sitemap; noncanonical-host HTTP noindex protections also remain in place.

## Verification

The earlier October 10, 2026 local production check passed for all 1,452 sitemap URLs: HTTP 200, canonical URLs, indexing permission, document languages and seven language alternates. All 2,868 unit tests, TypeScript, lint and the production build passed. The eight language browser checks passed, including a focused rerun after fixing the localized 401(k) redirect loop. See the [expanded sitemap validation](validation/multilingual-content.json).

The translation tests cover dictionary coverage, placeholder substitution, raw user-output preservation, localized server articles, all 1,944 sitemap entries, reciprocal alternates and preview indexing protection. The language browser suite covers translated calculator articles, guides and policies alongside existing navigation, calculation, RTL, accessibility and responsive-layout checks.

Run `npm run i18n:check`, `npm test`, `npm run typecheck`, `npm run lint` and `npm run build`. Browser checks use `TEST_URL=<running-site> npx playwright test tests/e2e/languages.spec.ts`.

The earlier [live audit](validation/live-indexing-readiness.json) records the previous 377-URL deployment. Local verification of the expanded sitemap does not imply deployment or that Google has indexed its URLs. Submit the existing `/sitemap.xml` address after deployment; Search Console will need to fetch and process the expanded file.

The remaining-feature update adds 251 translated messages per language and makes road mileage available in all six languages, expanding the sitemap to 1,458 URLs. That update checked 8,970 source messages in each translated language, including numeric and formula preservation. The same translation review limits apply. Its local production-build crawl passed for all 1,458 URLs, and all 17 focused browser checks and 2,957 unit tests passed. Those tests are recorded in [remaining-feature validation](validation/remaining-features.json); the older 1,452-URL crawl is retained as historical evidence.

The US BTU follow-up now checks **9,079 messages per translated language**, with county names kept in their source spelling and application-owned surface labels translated in the table and CSV. All 2,983 unit tests, 26 production browser checks, and six BTU-page metadata checks passed. The sitemap remains at 1,458 URLs. See [BTU validation](validation/btu-us-design.json). These are local production-build checks, not a deployment or a native-speaker review.

The free health alternatives follow-up checks **9,102 messages per translated language**. The CDC talk test and nutrition links work in all six languages, including localized talk-test results and CSV export. All 2,990 unit tests, 14 production browser checks and metadata checks for the 12 changed pages passed. The sitemap remains at 1,458 URLs; the unavailable WeightWatchers pages remain excluded. See [free health alternatives validation](validation/free-health-alternatives.json). No deployment or independent native-speaker review was performed.

The subsequent removal request retires the WeightWatchers placeholder in every language and removes public Khamis–Roche/Borg references. The active catalog has 203 entries, including 202 calculators and one directory hub. Translation coverage is now **9,095 messages per translated language**; the sitemap remains at 1,458 URLs because the retired tool was already excluded. The earlier nutrition-links panel has been removed with its page. See [removal validation](validation/removed-unready-features.json).


## Page guidance and Hindi / Filipino expansion

Every implemented calculator now has a distinct section explaining how to interpret its result, compare scenarios, or avoid a relevant input mistake. These 202 sections add 13,219 English words alongside the existing formulas, worked examples, FAQs and references. The 26 calculator directory, category and subcategory pages have another 2,475 words of selection guidance and contextual internal links. No minimum word count or keyword density is used as a ranking rule. Google's [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide) prioritizes useful content and discourages keyword stuffing.

`src/data/calculator-content.json` owns the calculator guidance and FAQs. `CalculatorGuidance` renders the same sections in the English and translated server articles. `src/data/directory-content.json` owns directory explanations and unique descriptions; `DirectoryGuidance` localizes its links as well as its text. The extraction script includes both datasets. Long editorial content remains on the server rather than joining the shared client dictionary.

Hindi and Filipino share the existing routing, search, calendar, calculation, preference and indexing behavior. Their calculator names, shared interface messages, all 202 new calculator guidance sections, and all 26 directory descriptions and explanations have been revised directly. The real-estate hub also renders the mortgage and real-estate directory guidance. Automated checks cover all 9,651 source messages in each of the seven translated languages. Translation coverage and formula preservation do not establish native fluency or professional validation; the existing translation-review limitation still applies. Regional tax and lending tools retain their stated jurisdiction, even when displayed in Hindi or Filipino.

The final local production build passed all 2,993 unit tests, TypeScript, lint and 22 browser checks. A crawl of all 1,944 sitemap URLs passed HTTP status, canonical, language, alternate-link, indexing and guidance-presence checks. See [content and language validation](validation/content-languages.json). These changes have not been deployed.

## Result display precision

Ordinary result cards, worked examples, detailed tables and numeric CSV cells display at most two decimal places. Tiny nonzero values use scientific notation instead of appearing as zero. This is display rounding: calculations, stored result values and chart data retain their precision. Numeric CSV cells use ungrouped ASCII numbers for spreadsheet compatibility; metric-only exports use the same formatted result text as the screen.

Engine-owned composite answers such as matrix values, coordinates, approximate fraction decimals, sequences and IRR lists explicitly opt into numeric-text formatting. User text, IP addresses, dates, exact integers and fractions are preserved. Dedicated rounding, random-decimal and scientific-precision tools honor the selected precision; decimal arithmetic defaults to two decimal places and scientific arithmetic to three significant digits. The Army ratio mode retains its prescribed three-decimal recorded value and threshold.

Final-grade modes retain the equation result internally but present an unattainable-target message when it exceeds 100%, alongside the highest possible overall grade. Already-secured targets have a zero minimum score. All new messages are translated. Percentage change, return, markup and similar ratios are not globally capped at 100%; valid results can exceed it. The two-event probability mode removes floating-point excursions outside its validated zero-to-one domain.

This follow-up passed 3,006 unit tests, 14 production browser checks, TypeScript, lint and the production build. Translation coverage is 9,654 messages per translated language. See [result formatting validation](validation/result-formatting.json). No deployment was performed.

## Mobile calculator exports

CSV exports keep a usable download link, with native file sharing offered when supported. The PDF action creates a printable report locally, including metrics, notes and complete tables. It uses the page’s fonts and browser text shaping for Hindi and Arabic, and matches localized result and currency precision. PDF pages contain rendered images; CSV remains available for machine-readable data. Desktop printing remains available.

This follow-up passed 3,012 unit tests, 16 mobile browser checks, 15 desktop regression checks, TypeScript, lint and the production build. Translation coverage is 9,661 messages per translated language. See [mobile export validation](validation/mobile-exports.json) for coverage and the limits of browser emulation. No deployment was performed.
