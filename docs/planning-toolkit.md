# Browser-based planning toolkit

Implemented October 14, 2026. The public catalog now contains 214 calculators, 571 modes, and one directory. These 12 original tools are additions to Finflo's historical competitor audit, not newly claimed competitor parity.

| Route | Implemented behavior |
| --- | --- |
| `/freelance-rate-calculator` | Annual revenue, hourly/day rates, project time allowance, and explicit planning tax reserve |
| `/invoice-generator` | Invoices and quotations; line items, discounts, shipping, tax, prior payments; branded preview and locally generated multipage PDF |
| `/payment-fee-calculator` | Custom fees and dated US Stripe example; net receipts and minimum rounded charge for a target net |
| `/break-even-calculator` | Contribution, whole-unit break-even, revenue threshold, target profit, and margin of safety |
| `/net-worth-tracker` | Asset and liability rows, liquidity flags, dated saved snapshots, history chart, and same-currency comparisons |
| `/emergency-fund-calculator` | Essential-expense rows, coverage target, gap, existing coverage, and monthly deposit schedule |
| `/subscription-cost-tracker` | Weekly/four-weekly/monthly/quarterly/yearly costs; keep/cancel/annual-offer scenarios |
| `/expense-splitter` | Multiple payers, weighted and per-expense subsets, exact smallest-unit allocation, and settlement transfers |
| `/cash-flow-calculator` | Monthly forecast, growth, variable expenses, one-time movements, buffer breaches, and recurring-burn runway |
| `/seller-profit-calculator` | Custom marketplace fees and dated US Etsy example; shipping, advertising, returns, overhead, and operating profit |
| `/solar-savings-calculator` | Generation, self-use and exports, degradation, tariffs, maintenance, fixed-rate financing, and separate unfinanced payback |
| `/ev-vs-petrol-calculator` | Metric/US conversion, charging loss and charging mix, maintenance, insurance, final resale, and total ownership cost |

## Storage and exports

No new API endpoint, database, account system, paid service, or runtime external data request is introduced. Each tool uses the existing explicit Save calculation action, workspace comparison, and JSON backup/import. Net-worth history selects the most recent save for each snapshot date in the selected currency. Saved personal data remains in the browser.

All new row-based inputs accept a bounded CSV import and provide a matching template. Imports replace only the relevant section after a complete parse. Calculation validation still checks row values and cross-field constraints. Spreadsheet-like text is escaped in exported CSV cells without changing negative numeric values.

The invoice generator creates its own document PDF with business/customer details, line items, totals, dates, optional local PNG/JPEG logo, color, and terms. Logo/color are not persisted in saved calculations. It does not send email, assign invoice numbers centrally, collect money, or track customer views. Subscription actions only model cost changes; expense settlements only describe transfers.

## Design consistency

The tools use Finflo's established green palette and shared page, form, button, dropdown, result-panel, and table components. Invoice and snapshot panels reuse the same `ResultSection` and `ResultDataTable` as existing calculator breakdowns. Upload controls use the shared button patterns, invoice colors resolve from the site's color tokens, and direct-answer summaries share the existing formula-callout styling and article typography. The design was compared with the mortgage calculator at desktop and phone widths.

## Editorial and discovery

Each new page contains roughly 800 words of original explanatory guidance and FAQs, plus formula and calculated worked-example sections. Content includes a direct answer, four topic-specific sections, a numerical scenario, six questions with answers, model boundaries, primary references, Finflo authorship, and a review date. Reference fees carry a separate October 13, 2026 check date.

Page titles and descriptions are distinct. Catalog registration supplies directory listings, search, and sitemap discovery. Search aliases include terms such as Stripe, Etsy, gasoline, and rainy day. Related-tool families connect the freelance, household, and energy workflows. Article structured data identifies authorship, review date, citations, and the same questions/answers visible on the page; WebApplication and breadcrumb markup remain present. No fabricated ratings or professional credentials are added.

The implementation follows the ordinary crawlability and useful-content principles described in [Google's guidance for AI search features](https://developers.google.com/search/docs/appearance/ai-features). Markup and content improve machine readability; they are not a claim of ranking, rich-result eligibility, or AI citation.

The new long-form pages are English-only in this release. Their names are translated for the existing language directories, and those links lead to the English canonical pages. Unsupported language variants are not advertised in hreflang or the sitemap. Existing translated pages retain their coverage. See [internationalization](internationalization.md).

## Numerical scope

- Monetary invoice components and fee calculations use Decimal rounding; supported amount precision is zero or two decimal places. Expense allocation uses integer smallest units and largest remainders, with deterministic tie breaking.
- The tax reserve and invoice tax rate are user assumptions; no additional jurisdiction-specific tax engine is implied.
- Stripe and Etsy presets have narrow, visible US scopes. Custom modes accept other verified rates; preset modes keep USD fixed.
- Cash-flow gaps are projected deficits, not assumed credit lines. Solar cumulative cash shows outstanding debt separately. EV resale is credited only at the selected final year.
- Emergency timelines exclude interest and inflation. Subscription savings compare steady full-year scenarios, not dated cancellation refunds.

## Validation

The implementation is covered by independent expected-value and boundary tests in `tests/toolkit.test.ts`, catalog execution, editorial/metadata checks, and `tests/e2e/toolkit.spec.ts`. Browser checks cover all 12 tools at phone width, server-rendered content, CSV import/export, invalid-import preservation, local snapshot restoration, an actual branded multipage invoice PDF, and accessibility on the document and multi-row tools.

The production build, TypeScript, lint, all 3,126 unit tests, and the seven-language message audit passed. Browser validation passed 20 new toolkit checks, 27 existing checks for workspace, search, formatting, language navigation and desktop exports, plus 16 mobile-export checks under the dedicated Android/iPhone configuration. The final results are recorded in [the validation report](validation/planning-toolkit.json).

This is a local implementation. It does not deploy the site or alter public indexing settings.
