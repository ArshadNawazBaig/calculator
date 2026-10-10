# Calculator results UI

The shared calculator layout separates input settings, the result summary, charts, and the complete result table. It retains the existing calculation engines, currency policies, CSV exports, local calculations, and six-language interface.

## Charts

`result-presentation.ts` explicitly maps supported engine schedules to chart series. Every plotted point comes from a returned table row; no samples are invented or recalculated. Supported schedules include loans, debt repayment, savings, salary-based retirement plans, depreciation, and ownership costs. Scalar results without a suitable schedule remain numeric summaries.

Nonnegative component amounts use a donut with exact values in its legend. Negative or all-zero components use signed comparison bars. Savings losses come from the authoritative net-growth metric, correcting the older chart payload's zero-clipping without changing calculation results. Timelines support pointer exploration and a labelled keyboard slider. SVG dimensions follow the available width so labels remain readable on mobile.

## Tables

All rows render below the calculator at the full workspace width, without an accordion or constrained vertical scroll area. Wide tables scroll horizontally within their container. Financial columns use the selected currency's decimal precision and aligned amounts; independently entered currencies and user text remain unchanged. Print styles show the entire table and repeat column headers.

## Verification

- TypeScript, ESLint, and the production build pass; no chart dependency was added.
- 2,863 unit tests pass across 32 files, including schedule integrity, losses, large signed chart domains, full 1,200-row rendering, and currency/text preservation.
- 39 browser checks pass across result UI, currency preferences, languages, form controls, and the site regression suite.
- After the final responsive SVG adjustment, all three result UI browser checks passed again, including Arabic RTL, readable mobile axes, keyboard exploration, currency changes, negative/zero growth, reset, print, and untruncated tables.
- Desktop and Arabic mobile screenshots were visually reviewed. Automated accessibility checks found no violations in the tested calculator states; this is not a complete assistive-technology audit.

Checks used a local production build with `NEXT_PUBLIC_SITE_URL=https://finflo.org`, `NEXT_PUBLIC_INDEXABLE=true`, and Playwright against port 4180. The user's development server was left running.
