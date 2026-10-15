# System and supporting pages review — October 15, 2026

Unknown English URLs were returning Next.js's default 404 screen without Finflo's navigation or design. The existing `(en)/not-found.tsx` did not cover routing-level misses across the site's multiple root layouts, including parameters rejected by `dynamicParams = false`.

Added `app/global-not-found.tsx` and enabled the installed Next.js version's documented `globalNotFound` option. It renders the existing English root layout, preserving the header, footer, fonts, theme initialization, preferences, and skip link. English and translated missing pages share one recovery component.

The 404 uses oversized type, a short centered message, directory/home buttons, and a separate Popular calculators section. Four compact cards reuse the existing `CalculatorCard` component and featured-tool selection, including their icons, descriptions and category labels. The layout uses the existing typography, button classes and color tokens, with isolated CSS and responsive card columns. All labels and destinations preserve the current language.

## Page inventory

| Page or behavior | Finding and action |
| --- | --- |
| Missing pages, including `/404` and deeply nested unknown URLs | Added the global fallback. Returns HTTP 404 with a useful title, `noindex`, directory/home links, and four popular calculator cards. |
| Translated missing pages | Reused the same recovery layout in all seven translations. Titles, direction, card labels, descriptions and destinations preserve the language. Only the four required card descriptions are passed to the recovery component. |
| Unknown clock page | Corrected its metadata so the 404 no longer uses the home page's title. |
| Unexpected runtime errors | Existing segment and global error boundaries already provide retry actions and shared typography/buttons. Added `noindex` and the site name to the global error document. |
| `/offline` and `/network-error` | Existing English pages retained. Translated versions now use the shared system layout and have a working retry button plus directory/home links. |
| `/maintenance` | Existing page retained. Translated versions now use the shared system layout. Maintenance rewrites preserve the requested language, return 503 and `Retry-After: 300`, and avoid rewriting the maintenance destination to itself. |
| `/about`, `/contact` | Present and reachable with the shared header, footer and page hero. |
| `/privacy`, `/terms`, `/cookies`, `/disclaimer` | Present and reachable with the existing document design. |
| `/accessibility`, `/editorial-policy`, `/methodology` | Present and reachable with the existing document design. |
| `/sitemap`, `/sitemap.xml`, `/robots.txt` | Present; included in the production route/SEO checks. |
| Search and empty search results | Existing search/results and no-results interfaces retained, with search available in the shared header. |

No additional indexable content pages were needed for this public calculator site. Error states remain outside the sitemap. This inventory is a product and routing review, not a legal determination of which policies a business must publish.

## Validation

- Production build, TypeScript and ESLint pass.
- Before the visual redesign, all 3,219 tests in 51 files passed with `npm test -- --maxWorkers=2`. A run with four workers hit an existing five-second dictionary-loading timeout while other checks were running; no timeout or assertion was relaxed.
- All 23 production browser tests in `tests/e2e/system-pages.spec.ts` pass. Coverage includes eight English missing-route forms, all seven translations, recovery navigation, keyboard access, theme persistence, mobile overflow, no-JavaScript recovery, and supporting pages.
- Automated accessibility checks report no violations on the English and Arabic mobile 404 pages in the production build. A development-only failure came from Next.js's debug overlay preceding the site's skip link; the production page passed the same complete rule set.
- Before the visual redesign, maintenance was exercised on a separate local production server with `MAINTENANCE_MODE=true`: 16 requests across eight languages returned the correct localized page, HTTP 503, `Retry-After: 300`, `Cache-Control: no-store`, and `X-Robots-Tag: noindex`. The health endpoint continued to return HTTP 200.
- Translation validation passes for 11,260 required messages in each of seven languages, with no missing text or changed placeholders, numbers or formulas.
- Desktop light/dark, mobile English, and mobile Arabic screenshots were visually inspected. Existing fonts and styles are retained, with no horizontal page overflow. All eight languages were also checked at a 320px viewport, with four cards and four descriptions present.
- The production crawl before the visual redesign passed for all **5,736 sitemap URLs** and **5,752 unique internal paths**, with zero crawl errors, duplicate titles or duplicate descriptions. Full check summaries are recorded in [the validation summary](validation/system-pages-2026-10-15.json).

The routing option is marked experimental by the installed Next.js 16.4 documentation. Its behavior was verified against the actual production build, including both static-route misses and dynamic not-found responses. No deployment was performed.

To inspect the page in the local development server, open `/404` or any unknown nested URL. To rerun browser checks against a local production build, use `TEST_URL=http://127.0.0.1:3102 npx playwright test tests/e2e/system-pages.spec.ts`.
