# Search discovery and calculator improvements — 11 October 2026

The public-site audit identified specific improvements to existing pages. The owner authorized implementation and prioritized English; private Search Console, analytics and Bing data were unavailable. This release retains existing URLs, eight language versions and the 1,944-URL sitemap.

## Changes and reasons

| Change | Evidence and resulting behavior | Scope |
| --- | --- | --- |
| Compound-interest starting mode | Previously opened the equivalent-rate converter. Now opens savings growth with deposits, time, compounding, tax and inflation inputs. The converter remains available. The introduction and descriptions match the new order. | Eight versions of `/compound-interest-calculator` |
| Related calculators | Category/catalog ordering produced weak recommendations, including anorexic BMI beside general adult BMI. Curated task families now select valid, distinct tools, with category fallbacks. Percentages connect to discounts, fractions and ratios; mortgages connect to amortization, payoff and affordability. | Calculator templates |
| Calculator-to-guide links | Three existing guides linked to tools, but relevant tools lacked matching guide links. Server-rendered links now connect 19 tools to their relevant guide in each language. | Mortgage, compounding and adult-BMI clusters |
| Guide identity | Guides now visibly credit Finflo and link to methodology/editorial information. Article markup identifies Finflo as the organizational author. No individual reviewer, credentials or publication dates were invented. | Three guides × eight languages |
| Breadcrumbs | Translated calculators lacked the breadcrumb schema already present on English calculators. They now expose matching localized URLs and labels. Guides have visible breadcrumbs and corresponding markup. | Localized tools and all guides |
| Homepage identity | English homepage title lacked the brand. Page titles now consistently include Finflo; the English homepage identifies its four main calculator categories. Homepage Organization markup uses existing brand information. | Shared metadata and homepages |
| Translation delivery | Every translated page received all 203 card descriptions. Root context now retains navigation/search names; nested providers send descriptions only for displayed cards. Full directories and search keep all required descriptions. | Seven translated languages |
| Font delivery | All pages preloaded Latin, Arabic and Devanagari fonts. Arabic and Hindi fonts now belong to their language layouts and load through CSS when used. Their global preloads are disabled because the production bundler combines font preload lists across routes. The shared Latin preload remains. | All layouts |
| Hindi privacy corrections | Repaired corrupted cookie/file/provider labels and a mistranslated negation that could imply inputs were stored. Preserved actual provider names. | Hindi privacy and related provider references |
| Additional crawl findings | Distinguished the Hindi financial-tool title from the finance category. Gave translated HTML sitemaps a specific description. Localized homepage privacy answers now disclose map-service requests. | Translation metadata and localized homepages |
| Repeatable validation | Added a full-sitemap HTML audit and repaired the performance script's obsolete homepage interaction. Layout-shift aggregation uses session windows. Browser assertions now reflect existing two-decimal output formatting. | Scripts and regression checks |

## Validation

The release's machine-readable evidence is in `docs/validation/seo-improvements-2026-10-11.json`. Local production validation covers:

- TypeScript, ESLint and the complete calculator/unit test suite.
- Translation key coverage, placeholders, numbers and mathematical notation. These checks do **not** establish native-language editorial quality.
- Production compilation and prerendering.
- Browser calculation/reset/export behavior, translated search and navigation, keyboard/date controls, responsive layouts and sampled axe accessibility checks.
- All sitemap URLs: HTTP status, self-canonical URL, indexability, title/description, H1, document language, reciprocal hreflang and JSON-LD parsing; unique internal path targets; expected search/collection noindex and real 404s.
- Before/after compressed document sizes under the same local Chromium setup. These are payload measurements, not field Core Web Vitals or organic-growth results.

Measured compressed HTML fell from 61,124 to 49,557 bytes on Spanish BMI (18.9%) and from 40,675 to 26,736 bytes on Hindi privacy (34.3%). English homepage font downloads fell from 311,916 to 24,576 bytes (92.1%). The compound-interest document grew from 15,819 to 18,951 bytes because its default growth scenario includes a schedule; that is a deliberate product tradeoff. JavaScript transfer size is essentially unchanged.

### Reproduce

```sh
npm run typecheck
npm run lint
npm test
npm run i18n:check
NEXT_PUBLIC_SITE_URL=https://finflo.org NEXT_PUBLIC_INDEXABLE=true npm run build
NEXT_PUBLIC_SITE_URL=https://finflo.org NEXT_PUBLIC_INDEXABLE=true npm run start -- --port 3104
```

In another terminal:

```sh
TEST_URL=http://127.0.0.1:3104 TEST_INDEXABLE=true npx playwright test tests/e2e/seo-discovery.spec.ts tests/e2e/site.spec.ts tests/e2e/languages.spec.ts tests/e2e/form-controls.spec.ts
TEST_URL=http://127.0.0.1:3104 SEO_OUTPUT=/tmp/finflo-seo-crawl.json npm run audit:seo
TEST_URL=http://127.0.0.1:3104 LAB_OUTPUT=/tmp/finflo-lab-performance.json npm run audit:performance
```

Run the performance command after other browser/crawl jobs finish to avoid resource contention. Its timings are single-run lab diagnostics. Do not report them as p75 Core Web Vitals or INP. The crawl checks server HTML and link paths, not external references, fragments, JavaScript behavior or actual search-engine indexing.

## Deployment and rollback

Production uses the existing Railway service, with `main` as its deployment branch. No infrastructure, domain, analytics, database or environment-variable change is required. Keep `NEXT_PUBLIC_INDEXABLE=true` and the canonical site URL in the production build; previews retain their noindex safeguards.

Risks are limited to the changed default compound-interest mode, relevance of related-tool choices, and translation availability at client boundaries. Regression tests cover those paths. Calculator algorithms and mode IDs remain unchanged. There are no URL migrations, content removals or new tracking requests.

After deployment, verify the new homepage title, compound-interest default, Hindi privacy text, guide markup and translated card descriptions on the public domain. Recheck sitemap and canonical-host behavior. If a regression appears, revert the release commit and redeploy through the same branch; there is no data migration to reverse.

## Evidence still needed

Search visibility, clicks, impressions, indexed/excluded URL counts, geographic demand, AI referrals and revenue remain unknown. Sitemap membership is not proof of indexing. No ranking or citation improvement is claimed.

The next measurement work depends on owner-provided Search Console/Bing access or exports. Compare equivalent periods and segment English calculators by category, device and country. Review impressions and CTR for the changed pages after recrawling; compare calculator usage only once a privacy-consistent measurement design is chosen. Field performance needs CrUX data where available or an explicitly selected measurement service.

Secondary-language content still needs editorial review by competent speakers, particularly finance, health and privacy material. The corrected Hindi examples demonstrate why complete string coverage alone is insufficient. Do not expand the language/page inventory until that maintenance capacity exists.

## Official references

- [Google Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article): use relevant properties and accurate author information.
- [Google breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb): describe a real navigation path.
- [Google Organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization): identify the existing organization consistently.
- [Investor.gov compound-interest calculator](https://www.investor.gov/use-financial-tools-and-calculators/calculators/compound-interest-calculator): the compound-interest page now references the relevant tool instead of generic mortgage material.

These changes improve clarity and discoverability; structured data does not guarantee search enhancements, rankings or AI citations.
