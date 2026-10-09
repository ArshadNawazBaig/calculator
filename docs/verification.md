# Verification

Current native Next verification: **2,840 automated tests and 14 browser tests pass**, with passing TypeScript, ESLint and production build. The all-site crawl covers 249 pages, 201 calculator pages and 403 JSON-LD blocks; final metadata rechecks close its two findings.

The release evidence is stored in `docs/validation/verification.json`, with actual lab measurements in [lab-performance.json](validation/lab-performance.json). Counts in the coverage manifest describe registered scope, not a guarantee of complete parity or every possible input.

## Numerical checks

The Vitest suite exercises all registered default modes and separately checks independently derived fixtures, formula properties, invalid-input cases and boundary conditions. Dedicated tests cover composed loan ledgers, program premiums, 2025/2026 tax interactions, current health methods, currency provenance/freshness, construction/physical units, expression state, codecs, apparel methods, golf rounding and public-snapshot cache behavior. Source and derivation records are retained under `docs/research` and `tests/fixtures`.

Reference cases are independent expected results, not a claim that one example verifies an entire calculator. Financial and health tools retain visible scope and professional-advice limitations. Historical versions and estimates are labeled explicitly.

## Browser and system checks

The committed browser suite covers calculation/reset/export, search/no-results, keyboard-compatible mobile navigation, local calculation after disconnection, horizontal overflow at 390/768/1366/1920px, accessible page templates, real 404s, redirects, canonical/noindex metadata and JSON-LD.

Additional independent reports cover advanced currency, apparel/mixed units, map interaction, Base64 file/codecs, expression memory and server error recovery. The production fault harness verifies redacted route/global failures, `retry()` recovery, the global title, maintenance503, Retry-After, no-store/noindex and health/static bypass. Fault injection exists only in the isolated test harness; no error-trigger endpoint is shipped.

Automated axe results are not an accessibility certification or a complete manual assistive-technology audit.

## Performance and limitations

Measurements use a warmed local production server and a fresh browser context with cache disabled. Desktop is 1440 px, 10 Mbps, 40 ms latency and 1× CPU; mobile is 390 px, 1.6 Mbps, 150 ms and 4× CPU. The JSON report records exact observations. One synthetic run per route is diagnostic, not p75 field performance; Playwright click wall time is not INP. Event Timing samples are labeled separately.

A slow mobile mortgage-table update prompted reuse of Intl formatters and memoization of unchanged results. After that fix, the measured mobile mortgage interaction fell from 456 ms to 152 ms. Mobile LCP ranged 696–904 ms and CLS was 0 across the sampled pages; these are synthetic samples, not field INP or p75 results. Real hosting/CDN latency, devices, traffic and later ads can change performance.

Production npm dependencies currently have no reported audit findings. The development lint chain includes the high-severity braces advisory GHSA-vfj7-8cjw-p6xm through micromatch/fast-glob. No patched braces version was available at the check. This is not described as an entirely clean dependency audit; avoid untrusted build glob patterns and monitor upstream updates. Do not force-upgrade unrelated packages to hide the advisory.
