# Languages

## Current publication policy

The October 22 release publishes **English only**. Its source inventory contains **216 calculators, 572 modes, six guides and 721 English sitemap URLs** when indexing is enabled. Spanish, French, German, Portuguese, Arabic, Hindi and Filipino remain unpublished drafts: their dictionaries, routing implementations and tests are preserved. The [October 22 release record](adsense-release-2026-10-22.md) records validation and deployment status; this document describes the source policy, not proof of a live rollout.

`publishedLocales` in `src/lib/i18n/config.ts` is the explicit publication allowlist, currently `['en']`. The separate `locales` list records implementation support and does not make a language public. Adding data or regenerating translation manifests cannot publish a language. A language should enter the publication allowlist only after editorial review and translation, browser and indexing verification.

English keeps its unprefixed URLs. Requests for draft pages under `/es`, `/fr`, `/de`, `/pt`, `/ar`, `/hi` and `/tl` temporarily redirect with **HTTP 307** to the corresponding English path. For example, `/es/search?q=loan#main` lands at `/search?q=loan#main`. The server retains the query and sends no replacement fragment, allowing the browser to retain the fragment. Redirects carry `Cache-Control: no-store` and `X-Robots-Tag: noindex, follow`. They do not clear country/currency preferences, favorites or saved calculations in local storage. Unknown destinations remain genuine English 404s. Canonical aliases such as `/en` and `/en/*` continue to use permanent redirects.

The language menu, sitemap, localized static generation and alternate metadata follow the publication allowlist. With English alone, translated `hreflang` alternatives are absent. The menu still offers country and currency preferences. There is no browser-language detection redirect, translation API call, added cookie, database or paid translation subscription.

## Retained translation implementation

The draft dictionaries contain calculator names and guidance, navigation, search, directory descriptions, shared controls, validation messages and older guide/policy content. Their presence does not establish current editorial coverage or publication readiness. New or revised English content can leave draft messages missing or stale; the audit reports these gaps explicitly.

The extended content dictionaries started with local OPUS translation models. Hindi and Filipino passages also received local SMALL100 and selected MADLAD refinements, followed by direct revisions. These are machine-assisted translations without a comprehensive native-speaker or licensed professional review. Numeric, formula and placeholder checks detect structural problems but do not establish fluency, accuracy or usefulness. Regional assumptions and calculation algorithms remain those of the English source. User-entered strings, identifiers and scientific notation are preserved.

Retained locale behavior includes Gregorian calendars with localized controls, Arabic RTL and Noto Sans Arabic, and Hindi Noto Sans Devanagari. Other languages use Manrope. Filipino uses `tl` in URLs and `fil-PH` for number/date formatting. If a reviewed language is published later, full document navigation updates its language, direction and fonts while preserving the current path, query and fragment.

## Country, currency and browser storage

A published language suggests a default country and currency unless the visitor has saved a preference. The language menu offers country and currency controls, and eligible calculators also have a currency selector. A country selection suggests its currency; an explicit currency override remains available. Preferences persist in local storage across pages, reloads and languages. “Use language defaults” removes the saved choice. No location lookup, exchange-rate request, cookie or new service is needed.

Reviewed general financial and cost models use the selected currency for input labels, results, detailed table headings and CSV exports. Currency changes leave the entered numbers unchanged and do not perform conversion; a visible note states this. Monetary presentation uses the currency's fractional digits capped at two per the requested display policy: JPY remains whole units; KWD displays two places. Calculation precision is retained. Regional tax, retirement and mortgage models retain their required currencies and rules, with a visible explanation. A mixed-purpose calculator applies this policy per mode: the historical US CPI mode remains USD while an assumed inflation scenario supports the selected currency. The currency converter and modes with explicit currency inputs keep their own controls. Fixed editorial worked examples identify their reference currency.

Preferences do not change measurement units, tax jurisdictions, effective years, assumptions or calculation algorithms. Form values, option identifiers and ISO date values are unchanged. String result values and user data in table cells are preserved verbatim, including decoded text, generated passwords and user-supplied names. Tables may explicitly mark columns of application-owned labels for translation; the BTU surface column uses this in both the displayed table and CSV export. Geographic option labels retain their source spelling. CSV uses UTF-8 with a BOM for non-Latin characters and a currency metadata row for eligible monetary results. Country and currency preferences persist automatically when selected. Favorites and named calculations persist only when explicitly saved in My workspace; this device storage is shared across language pages.

Suggested countries are US for English, Spain for Spanish, France for French, Germany for German, Brazil for Portuguese, UAE for Arabic, India for Hindi and the Philippines for Filipino. The retained Hindi and Filipino defaults are INR and PHP respectively; those languages are currently unpublished. These are editable product defaults, not detected visitor locations. Currency references include the [ECB euro overview](https://www.ecb.europa.eu/euro/intro/html/index.fr.html), [Banco Central do Brasil currency information](https://www.bcb.gov.br/cedulasemoedas) and [CBUAE currency definition](https://rulebook.centralbank.ae/en/rulebook/article-52-currency-unit).

## Structure and translation maintenance

`src/lib/i18n/config.ts` owns supported locales, the publication allowlist, path handling and translation lookup. `src/data/locales/*.json` holds shared draft interface dictionaries; longer content lives in `src/data/locales/content/<locale>.json` and is translated during server rendering. English source labels are fallback keys, and calculator names use `tool.<slug>`. `LanguageProvider` receives only the active shared dictionary. Calculator forms receive page and category engine messages through `TranslationMessages`; the article library is not shipped wholesale to the client.

`scripts/i18n-source.mjs` extracts current source content and engine/UI messages. Run:

```sh
# Release check: published locales are required; drafts are reported explicitly.
npm run i18n:check

# Review all supported dictionaries, including unpublished drafts, strictly.
npm run i18n:check -- --all-locales

# Refresh translation-development bundles after the required checks pass.
node scripts/check-translations.mjs --write-manifests

# Require clean drafts as well before refreshing those bundles.
node scripts/check-translations.mjs --all-locales --write-manifests
```

The audit checks missing messages, interpolation placeholders, numbers, formula notation and unreadable output. By default, only published-locale failures fail the release check; every draft still receives coverage diagnostics. `--all-locales` makes draft failures fail too. Neither command enables publication. The generated `page-keys`, runtime-key and `translated-pages` manifests describe translation-development coverage. A route in those manifests remains unpublished when its locale is absent from `publishedLocales`.

Dynamic engine messages use anchored templates. Only application-owned metric values marked `translateValue` are translated; raw user strings bypass that matcher. `src/data/calculator-content.json` and `src/data/directory-content.json` own calculator guidance and directory explanations, with server-rendered contextual links. The translation extractor includes these datasets.

`src/lib/i18n/preferences.ts` validates country/currency allowlists and language defaults. Its provider uses a stable server snapshot, synchronizes storage across tabs and falls back to memory when storage is blocked. `src/lib/calculators/currency-policy.ts` owns selectable models and fixed regional exceptions. Preferences do not change canonical URLs, indexing or static caching.

English pages live in the `(en)` route group. Draft language wrappers retain shared layout/page factories but do not generate published locale pages. The request proxy redirects draft URLs to English. Shared links and page metadata use the publication-aware locale helpers. The existing `english-only-tools.json` scope remains translation-development data; removing an entry from it does not publish a language.

Search retains support for translated names and original English names/slugs, accent normalization and Arabic vowel-mark normalization. Current public navigation and search use English. New tool names and edited guidance must be reviewed in a draft dictionary before that language can return to publication.

## Indexing and verification

The current production sitemap target is **721 English URLs**, not the historical multilingual total. Every listed URL has an English canonical destination. Search, status and unavailable-tool pages remain noindex and outside the sitemap. Draft-language redirects carry their own noindex header. `NEXT_PUBLIC_INDEXABLE=false` disables indexing and returns an empty sitemap; noncanonical-host noindex protection remains in place.

Run the active translation audit, unit tests, type checks, lint, a production build and the browser checks against that build. Publication tests cover the sitemap, metadata, language menu and draft-to-English redirects, including query/fragment and storage behavior. Existing locale-only browser cases remain explicitly skipped for unpublished languages, while English calculations, preferences, saved workspaces, accessibility and exports remain active. Direct dictionary/component tests still help maintain the draft implementation.

Record the built commit, deployment result and live crawl separately in the [current release record](adsense-release-2026-10-22.md). A local check does not establish deployment, native-language review, Google indexing or AdSense approval.

## Historical evidence

These records describe earlier source revisions and publication policies. Their route counts and test results are retained as history, not as the current sitemap or draft approval evidence.

| Earlier scope | Evidence |
| --- | --- |
| 377 live sitemap URLs | [Historical live indexing audit](validation/live-indexing-readiness.json) |
| 1,452 multilingual URLs | [Expanded translation validation](validation/multilingual-content.json) |
| 1,458 multilingual URLs and successive feature changes | [Remaining features](validation/remaining-features.json), [US BTU](validation/btu-us-design.json), [health alternatives](validation/free-health-alternatives.json), [removed placeholders](validation/removed-unready-features.json) |
| 202 calculators and 1,944 URLs after Hindi/Filipino expansion | [Content and language validation](validation/content-languages.json) |
| October 14 toolkit: 214 calculators, one directory and 1,956 URLs | [Planning toolkit](planning-toolkit.md) |

The historical Hindi/Filipino work added 202 calculator guidance sections and 26 directory explanations, with 9,651 source messages checked per draft language at that revision. Later result/export/toolkit checks used different counts. Those automated checks did not establish professional translation review and do not override the current publication gate.

## Result display precision

Ordinary result cards, worked examples, detailed tables and numeric CSV cells display at most two decimal places. Tiny nonzero values use scientific notation instead of appearing as zero. This is display rounding: calculations, stored result values and chart data retain their precision. Numeric CSV cells use ungrouped ASCII numbers for spreadsheet compatibility; metric-only exports use the same formatted result text as the screen.

Engine-owned composite answers such as matrix values, coordinates, approximate fraction decimals, sequences and IRR lists explicitly opt into numeric-text formatting. User text, IP addresses, dates, exact integers and fractions are preserved. Dedicated rounding, random-decimal and scientific-precision tools honor the selected precision; decimal arithmetic defaults to two decimal places and scientific arithmetic to three significant digits. The Army ratio mode retains its prescribed three-decimal recorded value and threshold.

Final-grade modes retain the equation result internally but present an unattainable-target message when it exceeds 100%, alongside the highest possible overall grade. Already-secured targets have a zero minimum score. Translation dictionaries retain these messages for future review. Percentage change, return, markup and similar ratios are not globally capped at 100%; valid results can exceed it. The two-event probability mode removes floating-point excursions outside its validated zero-to-one domain.

Historical verification of this feature is recorded in [result formatting validation](validation/result-formatting.json); its test and translation counts apply to that earlier source revision.

## Mobile calculator exports

CSV exports keep a usable download link, with native file sharing offered when supported. The PDF action creates a printable report locally, including metrics, notes and complete tables. It uses the page’s fonts and browser text shaping for Hindi and Arabic, and matches localized result and currency precision. PDF pages contain rendered images; CSV remains available for machine-readable data. Desktop printing remains available.

Historical verification is recorded in [mobile export validation](validation/mobile-exports.json), including the limits of browser emulation. English export checks remain active; browser checks requiring draft languages are explicitly skipped until those languages are published.
