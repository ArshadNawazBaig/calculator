# Launch and search plan

Finflo has server-rendered descriptions, methods, assumptions, worked examples, primary references, useful FAQs, canonical URLs, crawlable category links, breadcrumbs, social images and visible-content JSON-LD. Search pages are noindex. Dedicated preview builds remain noindex with an empty XML sitemap. The production build uses indexable metadata, but all noncanonical hostnames retain an HTTP noindex header. Unavailable tool pages are always noindex. No ratings, expert reviews, special AI schema or ranking guarantees are invented.

## Current release and indexing readiness

The October 22 release source has **216 calculators, 572 modes, six guides and one directory hub**. Its indexable sitemap contains **721 English URLs**. Spanish, French, German, Portuguese, Arabic, Hindi and Filipino remain draft implementations; their dictionaries and code are preserved. `publishedLocales` in `src/lib/i18n/config.ts`, currently `['en']`, controls publication. The [October 22 release record](adsense-release-2026-10-22.md) is the source for current validation, deployment and live-check results. Do not infer deployment from these source counts.

Draft language addresses return temporary HTTP 307 redirects to the equivalent English path, retaining queries, browser fragments and existing local storage. Their responses carry `X-Robots-Tag: noindex, follow` and are not cached. Navigation, alternate metadata and sitemap entries include only published languages. English-only publication emits no translated alternatives. Reintroduce a language only after content review and the required translation, browser and indexing checks; regenerating manifests does not publish it.

Historical 249-, 377-, 1,458-, 1,944- and 1,956-URL reports document earlier site versions. The prior SEO and desktop export release through commit `400f8f0` and the [October 11 growth and quality report](growth-quality-2026-10-11.md) also retain their own validation scope. Use the newest dated full crawl and release evidence rather than treating an older count as the current inventory. No public crawl establishes how many pages Google or Bing indexed.

The apex custom domain and www redirect are connected to Railway with HTTPS. The temporary Railway hostname remains noindex. Search, status and unavailable paths are excluded from the sitemap; the removed WeightWatchers English destination returns 404. The old placeholder and unresolved named-method promotion were removed before the current release.

Search Console and Bing ownership, sitemap submission, impressions, clicks and CTR still require connected accounts or exports. Follow [measurement setup](measurement.md) for exact Domain versus URL-prefix verification options and the canonical sitemap. Do not invent verification values, indexed-page counts or traffic statistics.

## Release and operating checks

- Build with `NEXT_PUBLIC_SITE_URL=https://finflo.org` and `NEXT_PUBLIC_INDEXABLE=true` for public production. Dedicated previews remain noindex. Confirm actual-host metadata, redirects, sitemap and missing-page behavior.
- Run the relevant numerical, translation, browser and crawl checks; review [verification](verification.md) and the [current release record](adsense-release-2026-10-22.md). `npm run i18n:check` enforces active locales and explicitly reports draft diagnostics; `npm run i18n:check -- --all-locales` is the strict draft check. Local lab performance does not establish field Core Web Vitals.
- Keep removed/unimplemented methods unavailable. Historical gap and licensing audits remain evidence of limits, not a request to recreate placeholders.
- Public operator identity is supplied as Erush, United States, with the authorized contact email. Railway hosting is disclosed. Exact account log settings, plan terms and any additional legal business details require account evidence; none are guessed.
- Follow [maintenance responsibilities](maintenance.md), including the configured weekly source audit and policy-year triggers. Review blocked source responses manually.
- Analytics and advertising stay off unless actual configuration is deliberately supplied. Measurement readiness is documented separately from measured results.

## Search and answer quality

Keep concise direct answers, explicit definitions/units, formula assumptions and meaningful worked examples as ordinary HTML text. Update rules by effective year and source; a deployment date is not an expert-review date. Cite original research and official publications beside relevant methods. Valid schema.org vocabulary does not guarantee eligibility for a Google search feature.

Google's current AI guidance uses the same useful-content and crawling foundations; no special AI file or markup is required. FAQ search rich results stopped appearing in May 2026, so useful on-page FAQs are retained without a rich-result promise. See [Google AI features](https://developers.google.com/search/docs/appearance/ai-features), [search updates](https://developers.google.com/search/updates) and [structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

US mortgage costs, extra payments, refinance, salary/take-home, savings and retirement comparisons are initial editorial hypotheses. Canada mortgage compounding/renewal, UK repayment/interest-only, and international units/dates/math provide genuine regional relevance. Australia is a market to validate, not evidence of a particular publisher RPM. Do not create near-identical country doorway pages or add hreflang without real equivalent localized pages.

Validate demand with country-filtered Keyword Planner and actual Search Console query/page/country data after launch. Advertiser CPC is not publisher revenue. No measured volumes, ranking difficulty scores or income forecasts are claimed.

## First 90 days of operation

During the first two weeks, review crawl/index eligibility, canonical selection, broken links, application errors, contact delivery and rate-source freshness. Fix actual causes of failures. Over the following 30–90 days, improve explanations and internal links using observed questions and query data; assess field LCP, INP and CLS when sufficient traffic exists. Target p75 LCP≤2.5s, INP≤200ms and CLS≤0.1. These intervals are operating tasks, not ranking deadlines.

Review time-dependent datasets before their effective year changes and whenever a primary source announces a relevant amendment. Preserve old supported years. Keep dependency/security checks and numerical regression tests in release review.

## Advertising

The release source retains the supplied AdSense ownership metadata and authorized `ads.txt` entry, and removes ad-serving script requests during review. Confirm this behavior on the deployed build before requesting another review. The [AdSense remediation notes](adsense-content-review.md) and [October 22 release record](adsense-release-2026-10-22.md) distinguish content changes, checks and remaining account actions. Approval remains Google's decision.

Before activating ads, use the actual publisher configuration and appropriate consent controls. Google publisher ads for EEA/UK/Swiss traffic require its current certified-CMP/TCF arrangements; see [Google's requirement](https://support.google.com/adsense/answer/13554020?hl=en). Test actual network behavior, withdrawal and reserved layout space. Never send calculator inputs or results in ad/analytics payloads.

## Road-routing operation

The mileage calculator now uses a Node route handler at `/api/road-route`. The default providers are Nominatim for explicit place searches and FOSSGIS/OSRM for driving routes. No route request runs during page generation or on typing. Users select matching locations before requesting mileage. Requests identify Finflo, include attribution, and are paced at least 1.1 seconds apart for each provider; an excessive queue returns 429. There is no straight-line fallback.

The in-memory limiter covers one Node process only. Run **one server process and one replica** when using the default public providers. For multiple processes, replicas or sustained traffic, configure `ROAD_GEOCODER_URL` (a Nominatim-compatible search endpoint) and `ROAD_ROUTER_URL` (an OSRM-compatible base endpoint) through an operated service or a shared gateway that enforces provider-wide quotas. These environment settings require a server restart. Set `ROAD_ROUTING_ENABLED=false` to disable requests. Provider swaps must also update the visible attribution and privacy policy.

Search responses expire from the bounded server-memory cache after 24 hours; route responses after five minutes. No calculator input database or application request-body logging is added. Hosting logs and provider retention are separate. The [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/) and [FOSSGIS policy](https://routing.openstreetmap.de/about.html) govern the defaults; the public services have no availability guarantee. Historical provider checks and the current single-replica configuration are recorded in the deployment evidence; verify provider availability again when changing this feature.

The verified feature additions and remaining limitations are recorded in [the implementation update](research/remaining/implementation-update-2026-10-10.json), with [validation evidence](validation/remaining-features.json).

The US-first BTU follow-up adds 3,146 county reference rows and seven dated assembly profiles, with room/whole-building geometry, unit conversion and separately entered cooling gains. See the [BTU source and scope record](research/remaining/btu-us-design-2026-10-10.json) and [validation](validation/btu-us-design.json). That standalone report predates the later public deployment.

The historical free-only follow-up added a CDC talk-test mode to the heart-rate calculator and localized links from the then-unavailable WeightWatchers page to the existing calorie and macro calculators. The existing midparent height estimate remains available. These alternatives do not implement the unresolved named Khamis–Roche, Borg or WeightWatchers methods. See the [free source and scope record](research/remaining/free-health-alternatives-2026-10-10.json) and [validation](validation/free-health-alternatives.json). That standalone follow-up introduced no paid service, package dependency or license application; its report predates the later public deployment.

At the user's subsequent request, the WeightWatchers placeholder, its nutrition-links panel and its catalog/search entry were removed in all languages. Its former English URL returns 404; draft language versions now redirect to that unavailable English destination. Public references to the unimplemented Khamis–Roche and Borg methods were also removed; the working parent-based height, heart-rate, talk-test, calorie and macro calculators remain available. That removal left 203 entries at the time (202 calculators and one directory hub), while the historical audit retains all 204 original entries. See [removal validation](validation/removed-unready-features.json). These removals were included in the deployed release preceding `400f8f0`.
