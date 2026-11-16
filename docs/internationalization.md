# Languages

## Current publication policy

The source enables **English, Spanish, French, German, Portuguese, Arabic, Hindi and Filipino**. `publishedLocales` in `src/lib/i18n/config.ts` contains all eight supported locales. Every calculator, guide and static site content change must include matching translations in all enabled languages. Database-authored blog articles and the private admin dashboard remain English; links from other languages open their existing English routes. The [October 22 release record](adsense-release-2026-10-22.md) records the historical English-only release; it does not establish deployment of this change.

English keeps its unprefixed URLs. Other languages serve their content under `/es`, `/fr`, `/de`, `/pt`, `/ar`, `/hi` and `/tl`. Full document navigation updates the page language, direction and fonts while preserving the path, query and fragment. Browser preferences, favorites and saved calculations stay in local storage. Unknown routes return 404. Canonical aliases such as `/en` and `/en/*` continue to use permanent redirects.

The language menu uses `availablePageLocales`, which includes translated search, workspace and status pages. Sitemap entries and alternate metadata use `publishedPageLocales`, which includes indexable translated content only. This distinction keeps every language selectable on useful pages without adding private workspace or search URLs to the sitemap. If a language is later withdrawn from `publishedLocales`, the existing request proxy and renderer guards temporarily redirect its URLs to English without clearing browser data.

## Translation implementation

Dictionaries cover calculator names and guidance, navigation, search, directory descriptions, shared controls, validation messages and guide/policy content. New or revised English messages must be translated in all seven non-English dictionaries. The release audit fails for missing messages and damaged placeholders, numbers or formulas; regenerating manifests is allowed only after the checks pass.

The original extended dictionaries used local OPUS models. Hindi and Filipino also received SMALL100 and selected MADLAD refinements, followed by direct revisions. The multilingual restoration combines Google Translate drafts, local OPUS translation for Spanish, French, German and Portuguese, and directly authored revisions. Review includes technical labels, negation, linked sentences, placeholders, numbers and formula notation. Translations are stored in repository dictionaries; visitors do not make translation-service requests. Machine-assisted translation and automated checks do not establish comprehensive native-speaker or licensed professional review. Regional assumptions and calculation algorithms remain those of the English source. User-entered strings, identifiers and scientific notation are preserved.

Standard currency names were checked against the installed runtime's CLDR data through `Intl.DisplayNames`, with direct revisions retaining historical qualifiers, manual-only entries and metal-ounce units from the source. The reviewed labels are stored in the dictionaries.

All locales use Gregorian calendars with localized controls. Arabic uses RTL and Noto Sans Arabic; Hindi uses Noto Sans Devanagari. Other languages use Manrope. Filipino uses `tl` in URLs and `fil-PH` for number/date formatting. There is no browser-language detection redirect, added cookie or visitor-facing translation API.

## Country, currency and browser storage

A published language suggests a default country and currency unless the visitor has saved a preference. The language menu offers country and currency controls, and eligible calculators also have a currency selector. A country selection suggests its currency; an explicit currency override remains available. Preferences persist in local storage across pages, reloads and languages. “Use language defaults” removes the saved choice. No location lookup, exchange-rate request, cookie or new service is needed.

Reviewed general financial and cost models use the selected currency for input labels, results, detailed table headings and CSV exports. Currency changes leave the entered numbers unchanged and do not perform conversion; a visible note states this. Monetary presentation uses the currency's fractional digits capped at two per the requested display policy: JPY remains whole units; KWD displays two places. Calculation precision is retained. Regional tax, retirement and mortgage models retain their required currencies and rules, with a visible explanation. A mixed-purpose calculator applies this policy per mode: the historical US CPI mode remains USD while an assumed inflation scenario supports the selected currency. The currency converter and modes with explicit currency inputs keep their own controls. Fixed editorial worked examples identify their reference currency.

Preferences do not change measurement units, tax jurisdictions, effective years, assumptions or calculation algorithms. Form values, option identifiers and ISO date values are unchanged. String result values and user data in table cells are preserved verbatim, including decoded text, generated passwords and user-supplied names. Tables may explicitly mark columns of application-owned labels for translation; the BTU surface column uses this in both the displayed table and CSV export. Geographic option labels retain their source spelling. CSV uses UTF-8 with a BOM for non-Latin characters and a currency metadata row for eligible monetary results. Country and currency preferences persist automatically when selected. Favorites and named calculations persist only when explicitly saved in My workspace; this device storage is shared across language pages.

Suggested countries are US for English, Spain for Spanish, France for French, Germany for German, Brazil for Portuguese, UAE for Arabic, India for Hindi and the Philippines for Filipino. Hindi and Filipino default to INR and PHP respectively. These are editable product defaults, not detected visitor locations. Currency references include the [ECB euro overview](https://www.ecb.europa.eu/euro/intro/html/index.fr.html), [Banco Central do Brasil currency information](https://www.bcb.gov.br/cedulasemoedas) and [CBUAE currency definition](https://rulebook.centralbank.ae/en/rulebook/article-52-currency-unit).

## Structure and translation maintenance

`src/lib/i18n/config.ts` owns supported locales, the publication allowlist, path handling and translation lookup. `src/data/locales/*.json` holds shared interface dictionaries; longer content lives in `src/data/locales/content/<locale>.json` and is translated during server rendering. English source labels are fallback keys, and calculator names use `tool.<slug>`. `LanguageProvider` receives only the active shared dictionary. Calculator forms receive page and category engine messages through `TranslationMessages`; the article library is not shipped wholesale to the client.

`scripts/i18n-source.mjs` extracts current source content and engine/UI messages. Run:

```sh
# Release check: every enabled language is required.
npm run i18n:check

# Require every supported dictionary, even if a locale is later withdrawn.
npm run i18n:check -- --all-locales

# Refresh page and runtime bundles after the required checks pass.
node scripts/check-translations.mjs --write-manifests

# Require all supported dictionaries before refreshing bundles.
node scripts/check-translations.mjs --all-locales --write-manifests
```

The audit checks missing messages, interpolation placeholders, numbers, formula notation, technical symbols and identifiers, unreadable output and accidentally introduced text from unrelated writing systems. Case-sensitive unit prefixes and currency codes stay intact; written unit names can translate. All seven non-English locales are currently published, so every dictionary is required by the default release check. `--all-locales` also checks a language if it is later withdrawn. Neither command changes publication. The generated `page-keys`, runtime-key and `translated-pages` manifests describe current translation coverage; keep them synchronized with source content.

Dynamic engine messages use anchored templates. Only application-owned metric values marked `translateValue` are translated; raw user strings bypass that matcher. `src/data/calculator-content.json` and `src/data/directory-content.json` own calculator guidance and directory explanations, with server-rendered contextual links. The translation extractor includes these datasets.

Guidance tables mark exact sample columns with zero-based `literalColumns` indices. The extractor excludes those cells and the renderer preserves them verbatim, including case and whitespace, with left-to-right isolation. Use this for executable expressions, Base64/URL examples, numeral strings and input-normalization samples. Captions, headers and explanatory columns still translate; the same word outside a literal column remains eligible for translation.

`src/lib/i18n/preferences.ts` validates country/currency allowlists and language defaults. Its provider uses a stable server snapshot, synchronizes storage across tabs and falls back to memory when storage is blocked. `src/lib/calculators/currency-policy.ts` owns selectable models and fixed regional exceptions. Preferences do not change canonical URLs, indexing or static caching.

English pages live in the `(en)` route group. Other language wrappers use shared layout/page factories and generate localized public pages. Shared links and metadata use locale helpers. Removing a tool restriction does not independently publish a language; `publishedLocales` remains the publication gate.

Search retains support for translated names and original English names/slugs, accent normalization and Arabic vowel-mark normalization. Public search uses the selected language. New tool names and edited guidance must be translated in every enabled dictionary in the same change.

## Indexing and verification

The production sitemap includes every enabled language for translated public content, with a canonical destination in that language. The historical 721-English-URL total no longer describes the multilingual source. Search, workspace, status and unavailable-tool pages remain noindex and outside the sitemap. `NEXT_PUBLIC_INDEXABLE=false` disables indexing and returns an empty sitemap; noncanonical-host noindex protection remains in place.

Run the active translation audit, unit tests, type checks, lint, a production build and the browser checks against that build. Publication tests cover all eight languages, sitemap alternatives, metadata, the language menu, query/fragment preservation and browser storage. Locale browser cases run for all enabled languages. Renderer tests retain withdrawal-redirect coverage with a simulated disabled locale.

Record the built commit, deployment result and live crawl separately in a dated release record; preserve the [October 22 record](adsense-release-2026-10-22.md) as historical evidence. A local check does not establish deployment, native-language review, Google indexing or AdSense approval.

## Historical evidence

These records describe earlier source revisions and publication policies. Their route counts and test results are retained as history, not as the current sitemap or draft approval evidence.

| Earlier scope | Evidence |
| --- | --- |
| 377 live sitemap URLs | [Historical live indexing audit](https://github.com/ArshadNawazBaig/calculator/blob/f7b79ba0d13dbbc6166c2d9703311faa950a0f85/docs/validation/live-indexing-readiness.json) |
| 1,452 multilingual URLs | [Expanded translation validation](https://github.com/ArshadNawazBaig/calculator/blob/f7b79ba0d13dbbc6166c2d9703311faa950a0f85/docs/validation/multilingual-content.json) |
| 1,458 multilingual URLs and successive feature changes | [Remaining features](https://github.com/ArshadNawazBaig/calculator/blob/f7b79ba0d13dbbc6166c2d9703311faa950a0f85/docs/validation/remaining-features.json), [US BTU](https://github.com/ArshadNawazBaig/calculator/blob/f7b79ba0d13dbbc6166c2d9703311faa950a0f85/docs/validation/btu-us-design.json), [health alternatives](https://github.com/ArshadNawazBaig/calculator/blob/f7b79ba0d13dbbc6166c2d9703311faa950a0f85/docs/validation/free-health-alternatives.json), [removed placeholders](https://github.com/ArshadNawazBaig/calculator/blob/f7b79ba0d13dbbc6166c2d9703311faa950a0f85/docs/validation/removed-unready-features.json) |
| 202 calculators and 1,944 URLs after Hindi/Filipino expansion | [Content and language validation](https://github.com/ArshadNawazBaig/calculator/blob/f7b79ba0d13dbbc6166c2d9703311faa950a0f85/docs/validation/content-languages.json) |
| October 14 toolkit: 214 calculators, one directory and 1,956 URLs | [Planning toolkit](planning-toolkit.md) |

The historical Hindi/Filipino work added 202 calculator guidance sections and 26 directory explanations, with 9,651 source messages checked per draft language at that revision. Later result/export/toolkit checks used different counts. Those automated checks did not establish professional translation review and do not override the current publication gate.

## Result display precision

Ordinary result cards, worked examples, detailed tables and numeric CSV cells display at most two decimal places. Tiny nonzero values use scientific notation instead of appearing as zero. This is display rounding: calculations, stored result values and chart data retain their precision. Numeric CSV cells use ungrouped ASCII numbers for spreadsheet compatibility; metric-only exports use the same formatted result text as the screen.

Engine-owned composite answers such as matrix values, coordinates, approximate fraction decimals, sequences and IRR lists explicitly opt into numeric-text formatting. User text, IP addresses, dates, exact integers and fractions are preserved. Dedicated rounding, random-decimal and scientific-precision tools honor the selected precision; decimal arithmetic defaults to two decimal places and scientific arithmetic to three significant digits. The Army ratio mode retains its prescribed three-decimal recorded value and threshold.

Final-grade modes retain the equation result internally but present an unattainable-target message when it exceeds 100%, alongside the highest possible overall grade. Already-secured targets have a zero minimum score. Translation dictionaries include these messages in every supported language. Percentage change, return, markup and similar ratios are not globally capped at 100%; valid results can exceed it. The two-event probability mode removes floating-point excursions outside its validated zero-to-one domain.

Historical verification of this feature is recorded in [result formatting validation](https://github.com/ArshadNawazBaig/calculator/blob/f7b79ba0d13dbbc6166c2d9703311faa950a0f85/docs/validation/result-formatting.json); its test and translation counts apply to that earlier source revision.

## Mobile calculator exports

CSV exports keep a usable download link, with native file sharing offered when supported. The PDF action creates a printable report locally, including metrics, notes and complete tables. It uses the page’s fonts and browser text shaping for Hindi and Arabic, and matches localized result and currency precision. PDF pages contain rendered images; CSV remains available for machine-readable data. Desktop printing remains available.

Historical verification is recorded in [mobile export validation](https://github.com/ArshadNawazBaig/calculator/blob/f7b79ba0d13dbbc6166c2d9703311faa950a0f85/docs/validation/mobile-exports.json), including the limits of browser emulation. Export checks run for every enabled language, including Hindi and Arabic text shaping.
