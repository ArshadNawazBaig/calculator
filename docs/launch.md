# Launch and search plan

Finflo has server-rendered descriptions, methods, assumptions, worked examples, primary references, useful FAQs, canonical URLs, crawlable category links, breadcrumbs, social images and visible-content JSON-LD. Search pages are noindex. Dedicated preview builds remain noindex with an empty XML sitemap. The production build uses indexable metadata, but all noncanonical hostnames retain an HTTP noindex header. Unavailable tool pages are always noindex. No ratings, expert reviews, special AI schema or ranking guarantees are invented.

## Current indexing readiness

The production build was checked with indexing enabled and the `finflo.org` Host header. All 377 sitemap URLs returned HTTP 200, had matching canonical URLs, titles, descriptions and one H1, and allowed indexing. All 1,450 distinct internal link paths resolved. Search, status, unavailable and partially translated pages remain noindex and excluded from the sitemap; unknown pages return a real 404. The www redirect preserves paths and query strings, and the temporary Railway hostname retains noindex. See [the multilingual indexing audit](validation/multilingual-indexing.json). These checks establish application behavior, not live custom-domain connectivity or Google's indexing decision.

English keeps its existing URLs. Complete home, directory and category translations are available in Spanish, French, German, Portuguese and Arabic with reciprocal language alternates and an English `x-default`. The sitemap contains 242 English URLs and 135 translated landing pages. Calculator interfaces are available in all six languages, but technical/reference and policy content still has explicit English fallbacks. These mixed-language pages remain noindex and do not advertise complete translated alternates. See [translation coverage](internationalization.md).

**Remaining blocker:** the `.org` registry now publishes Vercel's nameservers and all four Vercel DNS records are configured. Recursive DNS propagation and Railway verification/certificates still need to finish. Follow [the domain setup](deployment.md#custom-domain), then verify HTTPS, redirects, headers, `/robots.txt`, and `/sitemap.xml` on the actual domain. Do not report the website as ready for Google to crawl until that succeeds.

After the domain works, add a Domain property for `finflo.org` in Google Search Console and publish the exact verification TXT record Google provides at the active DNS provider. Once verified, submit `https://finflo.org/sitemap.xml`. Use URL Inspection's live test on the homepage and representative calculator pages, then request indexing. Verification and sitemap submission have not been performed; the user is handling Search Console registration. See [Google's sitemap submission guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Release prerequisites

- Review [remaining material modes](audit/remaining-modes.json). Two tools are unavailable; several specific advanced methods need authorized data or an independently verified specification. Preserve honest page limitations and noindex for unavailable tools.
- Review numerical, UI, accessibility, metadata and production build evidence in [verification](verification.md). Lab measurements do not establish real-user p75 Core Web Vitals.
- Confirm the public operator identity, applicable contact/business disclosures and the actual hosting provider's logging, retention and processing arrangements. The authorized email is erushbaig@gmail.com. No company address or legal entity was supplied or invented.
- Confirm hosting pricing, commercial use, external data reuse/attribution, runtime bindings and operational limits. The private preview does not establish a paid production account contract.
- Connect finflo.org on the selected host, verify ownership and DNS/TLS, and choose one canonical HTTPS hostname. Redirect real host duplicates. Do not change DNS blindly or use a guessed target.
- Build with `NEXT_PUBLIC_SITE_URL=https://finflo.org` and enable `NEXT_PUBLIC_INDEXABLE=true` only for the intended public release. Recheck canonical/meta/HTTP headers on the actual host. Ensure maintenance is off and test its 503/Retry-After behavior.
- Confirm sitemap URLs resolve to canonical successful indexable pages. A robots disallow is not a substitute for a crawlable noindex response; no calculator values belong in URL query strings.
- Verify Search Console domain ownership, submit `/sitemap.xml`, and inspect representative financial, health, math, everyday and regional pages. These account actions have not been performed.

## Search and answer quality

Keep concise direct answers, explicit definitions/units, formula assumptions and meaningful worked examples as ordinary HTML text. Update rules by effective year and source; a deployment date is not an expert-review date. Cite original research and official publications beside relevant methods. Valid schema.org vocabulary does not guarantee eligibility for a Google search feature.

Google's current AI guidance uses the same useful-content and crawling foundations; no special AI file or markup is required. FAQ search rich results stopped appearing in May 2026, so useful on-page FAQs are retained without a rich-result promise. See [Google AI features](https://developers.google.com/search/docs/appearance/ai-features), [search updates](https://developers.google.com/search/updates) and [structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

US mortgage costs, extra payments, refinance, salary/take-home, savings and retirement comparisons are initial editorial hypotheses. Canada mortgage compounding/renewal, UK repayment/interest-only, and international units/dates/math provide genuine regional relevance. Australia is a market to validate, not evidence of a particular publisher RPM. Do not create near-identical country doorway pages or add hreflang without real equivalent localized pages.

Validate demand with country-filtered Keyword Planner and actual Search Console query/page/country data after launch. Advertiser CPC is not publisher revenue. No measured volumes, ranking difficulty scores or income forecasts are claimed.

## First 90 days of operation

During the first two weeks, review crawl/index eligibility, canonical selection, broken links, application errors, contact delivery and rate-source freshness. Fix actual causes of failures. Over the following 30–90 days, improve explanations and internal links using observed questions and query data; assess field LCP, INP and CLS when sufficient traffic exists. Target p75 LCP≤2.5s, INP≤200ms and CLS≤0.1. These intervals are operating tasks, not ranking deadlines.

Review time-dependent datasets before their effective year changes and whenever a primary source announces a relevant amendment. Preserve old supported years. Keep dependency/security checks and numerical regression tests in release review.

## Advertising

Ad placements are modular and disabled. No publisher ID, analytics endpoint, cookie banner or ad request is fabricated. Before activation, use the actual publisher configuration, required ads.txt entry and appropriate consent controls. Google publisher ads for EEA/UK/Swiss traffic require its current certified-CMP/TCF arrangements; see [Google's requirement](https://support.google.com/adsense/answer/13554020?hl=en). Test actual network behavior, withdrawal and reserved layout space. Never send calculator inputs or results in ad/analytics payloads.
