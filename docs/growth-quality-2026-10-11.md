# English growth, source quality and maintenance — October 11, 2026

This release follows the deployed SEO/content work and the desktop export fix at `400f8f0`. It prioritizes English while preserving the eight-language site. The current scope is 202 available calculators, a real-estate directory, 557 calculator modes and 1,944 sitemap URLs. Those counts describe registered scope, not independent verification of every possible method or input.

## Completed implementation and research

- Mapped all 203 catalog pages to actual page intent, mode intent, priority and competitor evidence. The earlier 204-entry Calculator.net catalog audit supplies structural evidence across the catalog; current English search research adds 13 priority clusters and 46 query candidates. The [page map](research/search/english-page-map.csv), [query map](research/search/english-query-map.csv) and [observations](research/search/english-clusters-2026-10-11.json) distinguish observed pages from unmeasured demand. Three Australian queries remain research-only without a regional target. There are no invented volumes, difficulty scores or revenue forecasts.
- Added checked explanations for monthly compound growth, percentage points/reverse percentages, Canadian amortization, UK interest-only principal, refinance break-even and business-day holiday scope. Specific intents point to dedicated existing calculators. No new country doorway pages or special AI markup were introduced.
- Replaced generic US mortgage references on the Canadian/UK tools with FCAC and MoneyHelper sources. Corrected a mortgage-guide link that redirected to a narrower topic and changed the NREL legacy document host to the working NLR host for the same report. Added the IRS first/subsequent RMD reference and changed the ambiguous output label to “Second RMD deadline.”
- Published the supplied operator name, Erush, and country, United States. Identified Railway and accurately described account-dependent logging. No legal business name, address, credentials or fixed log-retention period was invented.
- Prepared optional page/performance analytics with canonical-host and DNT/GPC checks. Tracking stays off. Added account-supplied Google/Bing verification settings and a credential-aware CrUX reporting command. See [measurement setup and dependencies](measurement.md).
- Configured weekly source-link audits and release checks in GitHub Actions, and documented policy/editorial review dates in [maintenance](maintenance.md).

## Numerical review

Seven new executable cases in `tests/editorial-examples.test.ts` cover the changed examples and labels. Their independent expected values use these derivations:

| Case | Derivation / expected result |
| --- | --- |
| Monthly deposits, end | `1000 × 1.01^12 + 100 × (1.01^12 − 1) / 0.01 = 2395.07533145183`; contributions `2200`, interest `195.07533145183`. |
| Monthly deposits, beginning | Multiply the deposit annuity by `1.01`: ending value `2407.75783446503`. |
| Canadian mortgage | `i = (1 + 0.05/2)^(2/12) − 1`; `300000 × i / (1 − (1+i)^−300) = 1744.81495511105` monthly principal/interest. This tests the stated semiannual convention, not lender qualification or every mortgage contract. |
| UK interest-only | `250000 × 0.05 / 12 = 1041.66666666667` monthly; principal remains `250000`; 25-year interest is `312500`. |
| Reverse percentage | `80 / (1 − 0.20) = 100`. |
| Calendar month | January 31, 2024 plus one month clamps to February 29, 2024 under the stated calendar convention. |
| Historical RMD label | Owner born January 1, 1948 reaches the former age-70½ trigger in 2018. First latest deadline is April 1, 2019 and second deadline December 31, 2019, even when the selected distribution year is 2023. |

Primary evidence: [FCAC calculator](https://itools-ioutils.fcac-acfc.gc.ca/MC-CH/MortgageCalculator.aspx), [FCAC renewal guidance](https://www.canada.ca/en/financial-consumer-agency/services/mortgages/renew-mortgage.html), [MoneyHelper interest-only guidance](https://www.moneyhelper.org.uk/en/homes/buying-a-home/ways-of-repaying-an-interest-only-mortgage), [IRS distribution deadlines](https://www.irs.gov/retirement-plans/rmd-comparison-chart-iras-vs-defined-contribution-plans), [IRS Publication 575](https://www.irs.gov/publications/p575). The 2026 standard deductions were also compared with the [IRS 2026 announcement](https://www.irs.gov/newsroom/irs-releases-tax-inflation-adjustments-for-tax-year-2026-including-amendments-from-the-one-big-beautiful-bill): 16,100 single, 32,200 married filing jointly, 24,150 head of household. This is not a new independent audit of all tax interactions.

The source-link audit covers every distinct rendered external reference. [Before changes](validation/source-links-2026-10-11.json): 183 URLs, 151 reachable, 26 access-unverified, six request-unverified, no confirmed 404/410. [After changes](validation/source-links-after-2026-10-11.json) records the revised set and exact response classifications. Blocked/time-out references remain unverified. Reachability is separate from relevance, formula accuracy and licensing; prior independent method reviews under `research/independent-audits` remain relevant.

## Secondary-language review

The [review record](research/editorial/copy-review-2026-10-11.json) contains 30 newly added or reviewed messages in all seven languages and 36 additional targeted corrections. Full-dictionary negation and suspicious-shortening screens led to fixes including a Hindi warning that had reversed the instruction to avoid Social Security numbers, lost Hindi tax/probability formulas, a German BMI boundary error, German power/energy and retirement terminology, and Filipino weekday/clinician wording. Warnings, adult BMI age scope, payroll withholding and regional explanations received targeted attention.

Automated checks cover all 9,687 source messages per secondary language, preserving numbers, formulas and placeholders. Screening and these corrections are AI-assisted editorial work, not fluent or specialist signoff for every page. A comprehensive seven-language editorial review remains an external dependency.

## Release validation

Validation results are recorded in [the release evidence](validation/growth-quality-2026-10-11.json). The initial numerical-suite run exposed an old fixture expecting the former RMD label; its expected date was unchanged while its label was corrected. A successful local build or crawl is not evidence of deployment; live release results are reported separately after Railway confirms the pushed commit.

## Next operating priorities

Immediately: review this release's source exceptions and connect Search Console/Bing or provide exports. The operator identity dependency is resolved; private hosting-plan, retention and legal-entity details remain unverified rather than guessed.

First 30 days with data: inspect indexing/canonical exclusions, English query and page demand, country/device differences, and measurement privacy. Improve existing explanations where observed queries demonstrate need.

Days 30–60: compare equivalent reporting periods and refine the highest-opportunity English pages. Obtain fluent review of high-use financial/health content and qualified review where interpretation warrants it.

Days 60–90: use actual demand to decide whether regional expansion is justified. Review field performance over its reported collection window. These are operating intervals, not ranking or income promises.

Google's [AI-feature guidance](https://developers.google.com/search/docs/appearance/ai-features) supports ordinary crawlable, useful content; it does not establish that Finflo is cited by an AI service. Search indexing, field metrics, engagement and complete specialist/native-language accuracy are not established by this release.

## Rollback

The analytics configuration is empty and adds no active third-party tracking. To disable it after a future activation, clear the token and rebuild. Revert this release's commit to roll back its code/content changes; the earlier desktop CSV/PDF behavior is retained. No URLs, DNS, database, paid services or advertising configuration changed.
