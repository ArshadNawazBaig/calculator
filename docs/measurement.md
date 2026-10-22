# Search and visitor measurement

Updated October 22, 2026: public crawl checks and local analysis of supplied Search Console CSV exports are available. There is no connected Search Console/Bing account or configured visitor-analytics token. Missing measurements are unknown, not zero. See the [search growth release](seo-growth-2026-10-22.md) for the current implementation and verification status.

Run `npm run audit:search -- /path/to/export-folder` to analyze the seven standard CSV exports. The generated `test-results/search-console.json` stays outside version control. It preserves property/page/query aggregation differences, reports complete seven-day trends and flags possible export truncation. Compare exports with matching search type, dates and filters; the independent CSV tables do not provide joined page/query/device data.

## Search ownership and reporting

1. Add a Domain property for `finflo.org` in Google Search Console. Publish Google's exact TXT value in the active Vercel DNS zone. A Domain property does not use an HTML verification tag.
2. Alternatively, verify a URL-prefix property for `https://finflo.org/` using `GOOGLE_SITE_VERIFICATION`. Add the actual Bing verification value as `BING_SITE_VERIFICATION`. Both values affect generated HTML and require a rebuild. Never use account passwords or API tokens as these public values.
3. Submit `https://finflo.org/sitemap.xml` in each verified account. Check submission status and inspect a representative English finance, health, math, everyday and regional page. A successful sitemap fetch is not evidence that a search engine indexed it.
4. Export Search Console Search results by date, page, query, country and device, with clicks, impressions, CTR and position; also export Page indexing and Core Web Vitals reports. Preserve the property, date range, search type and filters. Keep account exports outside the public repository.
5. Once data exists, compare equivalent 28-day windows, preferably also year over year when seasonality matters. Start with English pages, then US/Canada/UK and device segments. Treat impressions as opportunity evidence and compare CTR at similar positions. Do not average row CTRs or interpret average position as a fixed rank.

The 203-page keyword inventory and 46 researched query candidates are in [the search map](research/search/english-page-map.csv) and [query assignments](research/search/english-query-map.csv). The three Australian queries have no approved regional landing page. Prioritize actual demand before developing one.

The supplied performance export establishes its own dated observations; it does not prove current sitemap submission, current indexing coverage, account ownership or the effect of an undeployed change. Live account access is still needed for URL Inspection and submission actions. [Google setup guidance](https://developers.google.com/search/docs/monitor-debug/search-console-start).

## Optional visitor statistics

The prepared option is Cloudflare Web Analytics: page visits and loading performance. It is disabled until the operator adds the actual public site token to `NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` and rebuilds the site. Setting up this measurement does not require moving DNS. Create the Finflo site in Cloudflare, choose manual beacon installation, and copy only the site's 32-character token. Do not paste an account API token.

When enabled, the application only loads the beacon on the canonical hostname in an indexable build, and skips visitors who send Do Not Track or Global Privacy Control. The privacy/cookies pages automatically disclose the provider in every supported language. The component passes no form values, calculation results, selected files or custom calculator events. Cloudflare describes this service as not using cookies or local storage to identify visitors; this is a provider statement, not a general legal-compliance certification. [Setup](https://developers.cloudflare.com/web-analytics/get-started/), [privacy information](https://developers.cloudflare.com/web-analytics/about/), [query-string handling](https://developers.cloudflare.com/web-analytics/faq/).

Before enabling, check the actual provider settings and applicable notice requirements. After deployment verify requests, disclosures, preview-host exclusion and privacy signals in a browser. Clear the variable and rebuild to disable it. There is no paid subscription, advertising service or custom engagement collection configured by this work.

Calculator engagement remains unmeasured. A future engagement specification may count only a fixed calculator identifier and action such as `calculate` or `export`, with no values, results, free text, filenames, coordinates, query strings, user identifiers or persisted tracking identifier. It needs a chosen service and an explicit data/notice review before implementation. Page visits alone cannot establish calculator completion or satisfaction.

## Field Core Web Vitals

Run `npm run audit:field` with a Google Cloud API key for the Chrome UX Report API in the local `CRUX_API_KEY` environment variable. It requests origin-level PHONE and DESKTOP LCP, INP and CLS records and writes `test-results/field-performance.json`. The script does not log the key. Keep API keys out of public environment variables and source control.

Without a key, the script records `requires_api_key`. A 404 response means no matching record from that request; a permission, quota or network error does not establish insufficient traffic. The anonymous PageSpeed request on October 11 returned HTTP 429, so field performance remains unknown. CrUX records contain collection dates and percentiles; interpret those periods instead of substituting lab samples. [CrUX API documentation](https://developer.chrome.com/docs/crux/api).

Lab results remain useful for release regressions. They do not establish real-user p75 values or an SEO outcome.
