# External reference review — October 22, 2026

The fresh source audit checked **213 distinct URLs** used by assembled calculator definitions, guides, and information pages. It finished at `2026-10-21T19:13:45Z` (October 22 in Pakistan). Raw artifacts are `/tmp/finflo-release-sources.json` and `/tmp/finflo-release-sources.log`; manual triage is `/tmp/finflo-release-sources-triage.json`.

The automated run recorded 177 successful responses, 33 HTTP 403 blocks, three request failures, and no HTTP 404/410 responses. Those counts describe network responses, not verified source content:

- Three HTTP 200 responses served reCAPTCHA pages: PMC10993957, PMC9246861, and the PubChem periodic table.
- Ten HTTP 203 PubMed responses had only the host name as their title. Retries of PMID2305711 and PMID21498495 displayed a cookie requirement. Treat this group as content-unverified.
- HUD's final MIP date page and Microsoft's DAX PRICE documentation failed in the automated run but opened with their substantive content through the browser retrieval tool.
- The Sokolowski/Bettencourt FFIT PDF timed out in both the audit and browser retry. This is unverified access, not a confirmed dead reference.

Manual triage found **one confirmed dead reference hidden behind a crawler 403**. The compound-interest guide still used:

`https://www.investor.gov/use-financial-tools-and-calculators/calculators/compound-interest-calculator`

Browser retrieval returned 404. `src/data/guides.ts` now links to the verified official calculator:

`https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator`

The replacement opened with initial-investment, contribution, rate, and compounding fields. The calculator definitions already used this endpoint. The title and guide methodology were preserved. No old endpoint remains in `src`, and the replacement merges two references into one distinct URL (212 after the fix). The raw audit remains the original, pre-correction evidence; it was not rewritten as a second successful crawl.

The corrected Army article and current PVWatts endpoint both returned HTTP 200 with the expected titles. No confirmed dead reference remains from this audit after the guide correction. Blocked and challenged pages still require content verification; this review does not claim that every citation supports its surrounding method or that AdSense approval is assured.
