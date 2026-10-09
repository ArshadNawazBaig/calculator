# Calculator.net catalog audit

Audit date: 2026-10-09T11:28:44.492191+00:00

This is a public-page structure audit. It is not an assertion of independently verified formulas or complete interaction parity. The manifest marks those checks pending.

## Counts

- xml_sitemap_urls: 222
- html_sitemap_tools: 204
- tool_count: 204
- embed_page_count: 10
- total_pages_fetched: 223
- total_tool_forms: 340
- total_visible_fields: 3802
- multi_form_tool_count: 72

Category counts: {"finance": 75, "health": 31, "math": 44, "everyday": 54, "null": 0}

## Category-list omissions

- Anorexic BMI Calculator (`anorexic-bmi-calculator`)
- Average Calculator (`average-calculator`)
- Basic Calculator (`basic-calculator`)
- Canadian Mortgage Calculator (`canadian-mortgage-calculator`)
- Common Factor Calculator (`common-factor-calculator`)
- Long Division Calculator (`long-division-calculator`)
- Mortgage Amortization Calculator (`mortgage-amortization-calculator`)
- Mortgage Calculator UK (`mortgage-calculator-uk`)
- Overweight Calculator (`overweight-calculator`)
- P-value Calculator (`p-value-calculator`)
- Percent Off Calculator (`percent-off-calculator`)
- Prime Factorization Calculator (`prime-factorization-calculator`)
- Weight Watcher Points Calculator (`weight-watchers-points-calculator`)

## Evidence and boundaries

- Sitemap: https://www.calculator.net/sitemap.html
- XML sitemap: https://www.calculator.net/sitemap.xml
- Categories: financial-calculator.html, fitness-and-health-calculator.html, math-calculator.html, other-calculator.html.
- All tool pages and related HTML links were fetched with at most 3 concurrent requests. robots.txt declares the XML sitemap and no restrictions.
- Inputs, option values, defaults, form headings, radio modes, unit tabs, initial result labels, table headers, chart containers, print/download links, and external references were extracted.
- The full catalog separates competitor outbound sources from independently verified formula sources. Formula verification has not been performed in this audit.
- Hidden controls and regional variants are recorded. JS-generated controls, runtime validation, output correctness, print/export behavior, and individual mode transitions require browser interaction and independent test vectors.
- Raw HTML remains private temporary audit evidence under private-html. Do not copy article content, source scripts, or calculation code into Finflo.
- Category subgroups are native where available. Groups absent from category listings or general math are marked inferred.
- Query strings are recorded on links for mode evidence but are not counted as separate tools.
- The 204 named catalog targets comprise 203 interactive tools and one Real Estate directory. Embed offerings and four project widget endpoints are tracked separately.

## Unavailable pages

[]

## Artifacts

- catalog.json: detailed structural inventory for every tool.
- coverage-manifest.json: compact integration registry with honest pending implementation/test states.
- embeds.json: separately tracked embed/widget pages.
- all-pages.json: all fetched pages and discovery links.
- summary.json: counts and category reconciliation.
- audit.py / enrich.py: reproducible extraction scripts.
