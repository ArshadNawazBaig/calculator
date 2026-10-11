# Maintenance responsibilities and cadence

Operational owner: Erush, United States, using the published Contact page. This identifies the supplied operator; it does not assert a legal entity, professional qualification or street address.

| Area | Cadence / trigger | Action and evidence |
| --- | --- | --- |
| External references | Mondays at 07:00 UTC, plus source changes | GitHub `Site quality` → `reference-links` audits all rendered references and saves a 14-day artifact. Confirmed 404/410 responses fail the job. Review all blocked, redirected, timed-out and unverified links manually; a passing job is not factual verification. |
| Release quality | Pull requests and pushes to main | TypeScript, ESLint, numerical tests, translation validation and production build. These checks do not currently gate Railway deployment; review results and run locally before pushing. |
| US tax, retirement, Social Security and payroll policy | Before adding a supported year; immediately after a material official amendment | Compare official IRS/SSA publications with constants, formulas and independent fixtures. Record effective dates, preserve older supported years, and retain explicit unresolved-policy guards. First forward-year review is due before a 2027 model is released. |
| Canadian/UK mortgage assumptions | Quarterly, next January 11, 2027; earlier if product assumptions change | Recheck FCAC/MoneyHelper guidance, compounding, term/amortization distinctions and excluded fees/qualification rules. |
| Health interpretation and original research | Quarterly, next January 11, 2027; on source revisions | Recheck population, age, units, intended use and limitations. Obtain qualified review for material medical interpretation; source reachability alone is insufficient. |
| Translation meaning | Every changed text batch; broader review quarterly | Run numeric/formula/placeholder checks, then review negation, warnings, region/year, units and interpretation. Fluent reviewers remain necessary for a comprehensive language signoff. |
| Search indexing and engagement | Weekly for the first month after accounts connect; monthly thereafter | Review indexing exclusions, canonical decisions, English query/page/country/device reports, and actual visitor/performance data. Keep private exports out of this repository. |
| Hosting and privacy | On hosting, analytics, advertising or logging changes; quarterly account review | Confirm actual Railway plan/log settings and processor arrangements. Keep public disclosures aligned with actual behavior; never invent retention or a business address. |
| Dependencies and public services | Each release and monthly | Review dependency advisories and the actual road-routing/currency providers. Preserve the single-process limits for the default public map providers. |

The weekly source workflow is configured in [quality.yml](../.github/workflows/quality.yml). GitHub can delay scheduled runs or disable schedules on inactive public repositories; check the Actions history. Use `workflow_dispatch` or `npm run audit:sources` to run it manually. The default output is `docs/validation/source-links.json`; set `SOURCE_OUTPUT` to retain a dated report. Fix underlying issues and record the reason for any exception. Do not automatically remove a reference because an automated request is blocked.

No emails, issues, external messages or professional-review appointments are created by this workflow. The other review dates are the operator's maintenance responsibilities, not completed reviews or additional automated jobs.
