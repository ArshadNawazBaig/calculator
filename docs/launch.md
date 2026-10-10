# Launch and search plan

Finflo has server-rendered descriptions, methods, assumptions, worked examples, primary references, useful FAQs, canonical URLs, crawlable category links, breadcrumbs, social images and visible-content JSON-LD. Search pages are noindex. Dedicated preview builds remain noindex with an empty XML sitemap. The production build uses indexable metadata, but all noncanonical hostnames retain an HTTP noindex header. Unavailable tool pages are always noindex. No ratings, expert reviews, special AI schema or ranking guarantees are invented.

## Current indexing readiness

The production build was checked with indexing enabled and the `finflo.org` Host header. All 377 sitemap URLs returned HTTP 200, had matching canonical URLs, titles, descriptions and one H1, and allowed indexing. All 1,450 distinct internal link paths resolved. Search, status, unavailable and partially translated pages remain noindex and excluded from the sitemap; unknown pages return a real 404. The www redirect preserves paths and query strings, and the temporary Railway hostname retains noindex. See [the multilingual indexing audit](validation/multilingual-indexing.json). These checks establish application behavior, not live custom-domain connectivity or Google's indexing decision.

The current source adds calculator articles, specialist interfaces, guides and policy translations in Spanish, French, German, Portuguese and Arabic. With production indexing enabled, the sitemap expands to 1,458 URLs: 243 in each language, with reciprocal alternates and English `x-default`. English URLs remain unchanged. See [translation coverage and review limits](internationalization.md). The 377-URL audit records above and below describe the earlier deployment; they do not certify the expanded version as deployed.

**Live domain verified:** Railway reports both custom domains verified with valid certificates. Normal HTTPS requests to `https://finflo.org` succeed, HTTP redirects to HTTPS, and www permanently redirects to the apex while preserving paths and queries. The [live indexing audit](validation/live-indexing-readiness.json) checked all 377 sitemap pages and 30 representative mixed-language calculator pages with no failures. Robots, canonical/indexing metadata, missing-page responses and preview-host protections were also checked. The site is technically ready for Search Console submission; these checks do not establish Google's indexing decision.

Add a Domain property for `finflo.org` in Google Search Console and publish the exact verification TXT record Google provides in Vercel DNS. Once verified, submit `https://finflo.org/sitemap.xml`. Use URL Inspection's live test on the homepage and representative calculator pages, then request indexing. Verification and sitemap submission have not been performed; the user is handling Search Console registration. See [Google's sitemap submission guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

## Release prerequisites

- Review [remaining material modes](audit/remaining-modes.json). WeightWatchers is the only unavailable whole tool. Khamis–Roche and Borg scales retain specific unresolved data or licence requirements. US BTU county and assembly presets now have a verified, dated reference model; their steady estimates do not size equipment or establish Manual J/current-code compliance. Preserve honest page limitations and noindex for unavailable tools.
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

## Road-routing operation

The mileage calculator now uses a Node route handler at `/api/road-route`. The default providers are Nominatim for explicit place searches and FOSSGIS/OSRM for driving routes. No route request runs during page generation or on typing. Users select matching locations before requesting mileage. Requests identify Finflo, include attribution, and are paced at least 1.1 seconds apart for each provider; an excessive queue returns 429. There is no straight-line fallback.

The in-memory limiter covers one Node process only. Run **one server process and one replica** when using the default public providers. For multiple processes, replicas or sustained traffic, configure `ROAD_GEOCODER_URL` (a Nominatim-compatible search endpoint) and `ROAD_ROUTER_URL` (an OSRM-compatible base endpoint) through an operated service or a shared gateway that enforces provider-wide quotas. These environment settings require a server restart. Set `ROAD_ROUTING_ENABLED=false` to disable requests. Provider swaps must also update the visible attribution and privacy policy.

Search responses expire from the bounded server-memory cache after 24 hours; route responses after five minutes. No calculator input database or application request-body logging is added. Hosting logs and provider retention are separate. The [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) and [FOSSGIS policy](https://routing.openstreetmap.de/about.html) govern the defaults; the public services have no availability guarantee. The local live smoke test succeeded, but deployment configuration has not been changed or verified in this pass.

The verified feature additions and remaining limitations are recorded in [the implementation update](research/remaining/implementation-update-2026-10-10.json), with [validation evidence](validation/remaining-features.json).

The US-first BTU follow-up adds 3,146 county reference rows and seven dated assembly profiles, with room/whole-building geometry, unit conversion and separately entered cooling gains. See the [BTU source and scope record](research/remaining/btu-us-design-2026-10-10.json) and [validation](validation/btu-us-design.json). No deployment was performed.

The free-only follow-up adds a CDC talk-test mode to the heart-rate calculator and localized links from the unavailable WeightWatchers page to the existing calorie and macro calculators. The existing midparent height estimate remains available. These alternatives do not implement the unresolved named Khamis–Roche, Borg or WeightWatchers methods. See the [free source and scope record](research/remaining/free-health-alternatives-2026-10-10.json) and [validation](validation/free-health-alternatives.json). No paid service, package dependency, license application or deployment was introduced.

At the user's subsequent request, the WeightWatchers placeholder, its nutrition-links panel and its catalog/search entry have been removed in all languages. Its former URLs return 404. Public references to the unimplemented Khamis–Roche and Borg methods have also been removed; the working parent-based height, heart-rate, talk-test, calorie and macro calculators remain available. The public catalog now has 203 entries (202 calculators and one directory hub), while the historical audit retains all 204 original entries. See [removal validation](validation/removed-unready-features.json). These changes have not been deployed.
