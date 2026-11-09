# Clock quality follow-up, November 9, 2026

## Concrete issue and correction

Official IANA's latest release was independently checked as **2026f**, released October27. Existing name-directory data was2026e, while local Node22.22.2 / ICU78.2 carried timezone rules2025c. Therefore a working clock was not necessarily a correct clock. A comparison against separately compiled official2026f rules exposed current/forward differences in seven canonical regions:

- `/time/africa-casablanca`, `/time/africa-el-aaiun`
- `/time/america-edmonton`, `/time/america-inuvik`
- `/time/america-vancouver`, `/time/america-winnipeg`
- `/time/america-havana`

Aliases of these identities are included, notably Cuba and Canada/Pacific, Canada/Central, Canada/Mountain. Shared `/time-zone-calculator` conversions are affected as well.

Implemented a small3.1KB versioned transition snapshot for these seven regions, covering **2026 through2035**. The source is the pinned official2026f tarball, compiled with zic and extracted using Python zoneinfo. Clock UTC offsets, full calendar dates, seasonal tables, next transitions and named-zone calculator conversions use the same correction data in server and browser. Corrected display names use explicit UTC offsets rather than stale regional/DST names from ICU. A correction-table endpoint is not reported as a political clock transition. Other zones and dates outside the bounded period retain runtime rules; this is disclosed rather than claiming a complete replacement timezone database.

The directory was regenerated from official2026f; its **446 identities and147 aliases remain the same**. No URLs were removed, changed, deindexed or added. No dependencies were added, and no device clock is modified.

## Genuine additional task value

The existing server-rendered current-time and seasonal comparison tables remain. English clock pages now also offer an in-page dated meeting comparison, fixed to the page's source IANA region, with:

- Clearly labeled source date/time and searchable destination.
- Full local dates, UTC offsets, UTC instant, offset difference and previous/same/next-calendar-day interpretation.
- Nonexistent spring-forward times rejected; repeated fall-back times require the visitor to choose earlier or later explicitly.
- Date planning bounded to2026–2035; current and historical named-zone conversions remain available through the existing converter.
- Disabled controls before hydration, a useful server-rendered example, no network request or new persistence.
- Existing DatePicker, Dropdown, button and table styles; mobile scrolling contained within the table and live status/error messages.

The feature provides a distinct practical task from each regional starting point. It does not prove search demand for every clock URL or replace human judgment about whether every regional page deserves indexed inventory.

## Verification actually completed

- `npx vitest run tests/time.test.ts tests/time-rules-reference.test.ts tests/numerical-regressions.test.ts tests/everyday-physical-reference.test.ts`: **115 tests passed**.
- `npm run typecheck`: passed.
- Targeted ESLint on all affected time components/helpers, timezone calculator files, audit script and new tests: passed.
- `node scripts/audit-clock-rules.mjs`: the independently compiled IANA oracle checked **all446 regional routes and all147 aliases /593 identities**, monthly offsets and full civil dates for2026–2035 plus one-second boundaries around every bundled correction transition: **71,313 checks; zero errors**. The uncorrected nativeIntl implementation had550 mismatches in this expanded corpus.
- New independently authored numerical fixtures cover all seven November2026 offsets, the canceled2026 Canada/Cuba folds, the actual2027 Cuba fold, LordHowe half-hour gap/fold, NewYork gap/fold, Apia's skipped civil day, fractional offsets, and date-line calendar shifts. They are not derived from the staleIntl oracle.
- A fresh final oracle audit also queries the official latest-version endpoint, and fails if the pinned directory/correction versions need review. The command is documented; no recurring job or schedule was created.

Root rebuilt the production app and both meeting-planner browser cases passed, including mobile/axe and gap/fold choice. See `docs/validation/quality-targeted-browser-2026-11-09.json`; the full final browser rerun is recorded in the quality follow-up report. New `tests/e2e/meeting-planner.spec.ts` contains two cases:360px day rollover plus axe, and missing/repeated source-time behavior. Existing `tests/e2e/time.spec.ts` should remain in the regression run. No build or deployment was performed by this agent.

## Files

- `src/data/clock-zones.json` —2026f directory version, regenerated.
- `src/data/time-zone-rule-overrides.json` — seven-region transition snapshot and provenance/range.
- `src/lib/time/rule-overrides.ts`, `engine.ts`, `wall-time.ts`, `meeting.ts` — shared corrected offsets, formatter and wall-time comparison.
- `src/lib/calculators/everyday-engine.ts`, `everyday-definitions.ts` — existing named-zone tool shares the resolver and discloses bounded rules.
- `src/components/time/clock-comparison.tsx`, `meeting-planner.tsx`, `time-page.tsx`, `time.module.css` — useful planner and explicit data limitations.
- `tests/time-rules-reference.test.ts`, `tests/e2e/meeting-planner.spec.ts`.
- `scripts/audit-clock-rules.mjs` — repeatable independent oracle, latest-version check.
- `docs/validation/clock-rules-2026-11-09.json` — complete per-identity audit evidence, sourceSHA256, native-runtime differences and scope.

## Honest curation scope and limits

This is systematic programmatic curation of all446 route identities, aliases, offsets and civil dates over sampled2026–2035 instants, plus selected independent transition fixtures. It is not full manual native-language editorial review, validation of every historical instant, validation of all possible future political decisions, proof of originality/licensing for the entire website, search demand or AdSense approval. Runtime rules outside the seven corrected regions can still be stale in older browsers; political changes after2026f require fresh data. Neither a passing oracle nor the additional workflow justifies inflating any readiness score to10/10.

Official primary sources:

- https://www.iana.org/time-zones
- https://data.iana.org/time-zones/tzdb/version
- https://data.iana.org/time-zones/releases/tzdata2026f.tar.gz
