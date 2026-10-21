# AdSense remediation release — October 22, 2026

The supplied account screenshot identifies **Low-value content** and an authorized ads.txt entry. This release addresses the concrete issues found in the public-site and source reviews. Google evaluates the whole site; automated checks and these corrections do not certify approval or reveal its private review criteria.

## Published content and language availability

The release contains 216 calculator pages, 572 calculation modes, six guides, and 721 English sitemap URLs. Three new worked guides explain discount comparisons, weighted grades/final targets, and concrete quantities with independently checked numerical examples, assumptions, comparison tables, and links to the relevant tools. Their substantive content is present in server-rendered HTML.

The seven machine-assisted translations contained meaning-changing errors that a completeness check could not detect. A focused sample corrected 137 labels, but that does not establish the quality of the full dictionaries. Spanish, French, German, Portuguese, Arabic, Hindi, and Filipino are therefore **temporarily unpublished** for visitors and crawlers alike. Their files remain in the repository for correction. Their existing addresses return a temporary 307 redirect to the matching English page, preserving queries and browser fragments; unknown English destinations still return 404. Saved calculations, favorites, and country/currency preferences remain on the same origin and are preserved.

`publishedLocales` in `src/lib/i18n/config.ts` is the explicit publication allowlist. Navigation, sitemaps, hreflang, static generation, and metadata all respect it. Unpublished routes have no-store redirects and noindex headers; the English destinations remain normally indexable in production. This changes the publicly served content rather than merely adding noindex to unfinished articles.

`npm run i18n:check` checks published language completeness and reports the unpublished dictionaries' outstanding entries separately. Use `npm run i18n:check -- --all-locales` for the strict draft audit. Regenerating translation manifests cannot publish a language. Before restoring one, complete a fluent, subject-aware editorial review of explanations, formulas, negation, units, labels, FAQs, errors, and disclosures; resolve draft diagnostics; then run its browser, calculation, navigation, and indexing checks. No such complete review is claimed in this release.

## Corrections to calculations and explanations

- Credit-card payoff now opens with a $5,000 balance, 20% rate, and $200 payment. The repayment tool opens with $10,000, 8%, and $300 per month; the payment tool uses a three-year term. Their independent defaults do not change the mortgage/loan fields.
- Future value opens with a $10,000 lump sum, 5% annual compounding, and no ongoing contribution. The regular-savings scenario retains its own contribution defaults.
- Loan and payoff explanations explicitly convert percentage rates to monthly decimal rates and cover zero interest. Final-grade formulas explicitly divide percentage weights by 100 and explain how to exclude an unfinished final from the current average.
- Calorie/TDEE and body-input macro modes start with the sedentary 1.2 activity factor rather than equating maintenance with resting expenditure. BMR remains a resting estimate. The supported energy formulas, units, and population-estimate limitations are stated.
- Incorrect or unrelated method references were replaced on the affected finance, grading/GPA, height, reference-weight, and health pages. The dead Army announcement and old Investor.gov guide address were replaced, and the PVWatts host was updated. The [external reference report](validation/adsense-release-sources-2026-10-22.md) distinguishes successful responses, blocked/challenged sources, and unresolved access checks.
- `/en` and nested English aliases now resolve to their canonical destinations without the former empty redirect loop.
- Fixed a reproduced input-initialization race: a delayed hash check no longer resets an already active calculator mode and erases an early edit. A regression deliberately delays that callback, enters a zero grade, and verifies that the value and result survive. Genuine mode changes and Reset still apply their normal defaults.

## Advertising and privacy

The unconditional ad-serving script has been removed from both page layouts. The existing `google-adsense-account` ownership metadata and authorized `/ads.txt` entry remain. The site's statements that it does not currently load advertising networks now match its behavior. Enabling ads and consent messaging is a separate integration; this release does not submit an AdSense review or change the account's approval status.

Google documents metadata and ads.txt as supported [site connection methods](https://support.google.com/adsense/answer/7584263?hl=en). Its [site readiness guidance](https://support.google.com/adsense/answer/7299563?hl=en) emphasizes original, useful content and usable navigation; its [publisher-content policy](https://support.google.com/publisherpolicies/answer/11112688) also addresses low-value and unfinished content and manual review of automatically generated material. These pages were checked on October 22, 2026.

## Verification and release evidence

- Type checking, lint, all **3,294 unit tests in 55 files**, and the production build passed with indexing enabled.
- The local production-HTML SEO crawl checked **721 sitemap URLs and 723 internal paths**, with zero reported errors, duplicate titles, or duplicate descriptions.
- The rendered-content crawl checked **all 721 published pages**, with no reported missing content sections. Content and page-value inventories also passed. These checks establish structural coverage, not an editorial score.
- The complete final production-browser suite passed **173 tests**, with **76 unpublished-language cases explicitly skipped** and zero failures. It includes the deterministic input-reset regression, mode changes, saved-calculation restore, query/fragment preservation, currency preferences, actual ad-request checks, mobile exports/layout, accessibility, and server-rendered guide content. The earlier eight failures were resolved through the documented test-fixture corrections and the reproduced input-initialization fix; this is a full final rerun, not only targeted retries.

The initial crawls preceded the last Investor.gov reference correction and the input-initialization fix. Final build and browser results are recorded in the [release evidence](validation/adsense-release-2026-10-22.json); the earlier crawl is not represented as a crawl of that later build.

The [October 21 review](adsense-content-review.md) and its evidence remain historical records of the earlier local changes and the previously deployed site. Use the release commit and actual production checks to establish what finflo.org serves. Requesting another AdSense review remains an account action after deployment; no guaranteed score, word count, page count, traffic level, or waiting period is asserted.
