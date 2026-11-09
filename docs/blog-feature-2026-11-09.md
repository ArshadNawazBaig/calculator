# Blog and super-admin implementation — November 9, 2026

The blog and administration are **live on finflo.org**. The requested new Finflo Neon project was provisioned through the owner's authenticated browser and existing Vercel integration. Its pooled connection, schema and migrations were verified against Neon, and the real owner administrator was bootstrapped. The database/authentication variables were applied to the existing Railway production service, and the verified source was deployed successfully. No fake public articles were created, and this record does not establish Google AdSense approval.

| Feature / affected path | Implemented and verified behavior |
|---|---|
| `/blog`, `/blog/[slug]` | Published articles only, category filters, pagination, real bylines/dates, safe Markdown, canonical metadata and BlogPosting schema. The empty blog links existing worked guides and remains noindex. |
| `/admin/sign-in`, `/admin` | Restricted Better Auth sign-in and publishing dashboard. Public registration and unrelated account/admin endpoints are disabled. Missing database configuration gives a useful setup state. |
| `/admin/posts`, `/admin/posts/new`, `/admin/posts/[id]` | Search/filter posts; write/edit drafts; formatting toolbar and immediate preview; optional cover references/alt text and search metadata. Credentials and editor fields wait for hydration; forms use POST. |
| `/admin/posts/[id]/preview` | Authenticated preview of the saved version, excluded from indexing and caching. |
| Publication lifecycle | Save draft; publish; update a published article without accidentally unpublishing; explicitly unpublish; archive; restore. Existing public slugs and first publication dates are retained. Concurrent stale edits are rejected. |
| `/sitemap.xml`, `/sitemap` | Request-time published article entries. Drafts and archived articles never appear; unpublishing removes entries. The unconfigured installation retains the existing 721 canonical sitemap URLs. |
| Shared navigation | Blog link in desktop/mobile header and footer; existing guides/calculators preserved. |
| `/privacy`, `/cookies`, `/terms` | Disclosures distinguish local calculator/workspace data from stored publishing/admin records, essential session cookies, article bylines, retained drafts/audit records and external images. Provider wording is prepared for the configured Neon database. |
| PostgreSQL | Lazy server-only access through standard `pg`, verified remote TLS, additive numbered migrations/checksum ledger, parameterized queries and transactional editorial audit records. Bootstrap/recovery use transaction advisory locks. |
| Administrator operations | Trusted CLI bootstrap, hidden password entry, official password hashing, overwrite refusal, and password recovery that revokes sessions. No default password or web password-reset endpoint. |

Every privileged server action and repository operation checks the database-backed session and exact super-admin role. Public auth handlers require the configured Origin for mutations, bound actual POST bodies to 8 KB, sanitize provider failures, and return private/no-store/noindex responses. Account and shared-path throttles persist in PostgreSQL; this is not a claim of individual IP-based enforcement. See the [operations guide](blog-admin.md) for the precise limits and choices.

Local verification used an isolated PostgreSQL 14 instance and a production Next.js build. It covered actual SQL migrations/bootstrap, authentication, role/session revocation, password recovery, forbidden auth routes, origin/body boundaries, and the full browser publishing lifecycle. The lifecycle checked anonymous draft/archived 404s, two-tab stale edits, safe Markdown/XSS omission, immediate publication/unpublication in listings and sitemaps, stable first publication date and logout. These lifecycle results used local PostgreSQL; the subsequent remote Neon checks are recorded separately below.

## Provisioned Neon database

The database resource is `finflo`, project `spring-leaf-75388979`, Vercel resource `store_Go0l8Awk85CYRsss`, in `iad1` (Washington, D.C.). It uses the existing Launch installation plan; the plan was not changed. Optional managed Neon Auth and Realtime are disabled because the application already implements its own restricted Better Auth administration.

The real pooled connection passed verified-TLS checks. Both migrations applied successfully and reran idempotently. Read-only verification confirmed two matching migration checksums, all nine expected tables, and the enabled published-identity trigger. The database was empty before owner bootstrap; no fixture articles were inserted. See [Neon provisioning evidence](validation/neon-provisioning-2026-11-09.json).

The pooled connection and authentication configuration are stored in the ignored `.env.local` file with mode `0600`. Initial administrator credentials are stored outside the workspace in `~/.config/finflo/admin-credentials.json`, also mode `0600`; neither credentials nor connection values are included in these documents. The real administrator bootstrap is complete. The authenticated Railway production service is available, with its private variables being staged separately; deployment is not yet verified.

The production build also passed without database or authentication credentials. An unconfigured runtime kept calculators working, rendered the empty blog, redirected private pages to sign-in and returned a sanitized 503 from the session endpoint. Mobile screenshots showed no horizontal overflow at 360 px; the sign-in heading was adjusted and rechecked at 28 px. Dashboard/editor accessibility checks found no axe violations at that width. Visual review also identified the sticky save bar covering fields on phones; the mobile bar was moved into normal page flow.

The new code does not upload image files, send account emails, enable reader comments, load an advertising script, or create a backup schedule. Content accuracy, originality, image permission and real author details still need editorial review before publication. Adding a blog does not itself resolve Google's low-value-content finding or justify a 10/10 score.

## Final verification

Final validation: **3,528 unit tests across 68 files passed**, along with typecheck, lint and production builds without database/authentication credentials. The full browser run recorded 192 passes, 76 intentional unpublished-language skips and one indexing-expectation mismatch because `TEST_INDEXABLE=true` was omitted. That check passed when rerun with the correct flag, without changing product indexing. After the final mobile-only CSS adjustment, all five focused blog tests passed again; actual form sign-in/sign-out and 360 px dashboard/editor axe/overflow checks also passed. Thus all 193 active scenarios were covered successfully across the full run and corrected rerun; this is not a claim of one clean 193-pass full-suite invocation.

The runtime-only npm audit reported **zero advisories**. The complete dependency audit still reported 17 advisories in development/deployment tooling (15 moderate, two high); no forced major upgrades or downgrades were made. These findings remain separate from the runtime authentication checks and do not justify a claim that all dependency risks are eliminated. License notices were regenerated for the installed dependency set.

Machine-readable results and exact limitations: [feature validation](validation/blog-feature-2026-11-09.json), [PostgreSQL authentication](validation/blog-auth-postgres-2026-11-09.json), [HTTP authentication](validation/blog-auth-http-2026-11-09.json), [migration concurrency](validation/blog-migration-concurrency-2026-11-09.json), [Neon provisioning](validation/neon-provisioning-2026-11-09.json), [real Neon authentication](validation/neon-auth-runtime-2026-11-09.json), [public access](validation/blog-public-access-2026-11-09.json), and [final mobile/form verification](validation/blog-admin-mobile-2026-11-09.json).

## Production verification

Railway deployment `b1cba549-778e-4bff-a781-af1da8f3d58d` is Active and its Details page links the exact source commit `f046c4a2da34bb789d0f38017765b98a23d1fdff`. The `/api/health` check succeeded at 23:42:27 Asia/Karachi on November 9. The existing installation plan and unrelated projects were preserved. See [deployment evidence](validation/railway-blog-deployment-2026-11-09.json).

All four public blog browser checks and 15 direct production HTTP checks passed. Actual HTTPS form sign-in reached the protected dashboard and editor; the session cookie was Secure, HTTP-only and SameSite=Lax. Mobile dashboard/editor axe checks found zero violations and no overflow at 360 px. The live Markdown preview omitted the script payload. Sign-out removed access and the anonymous session endpoint returned null. The live check made no publishing mutations and created no articles. See [public checks](validation/finflo-live-blog-public-2026-11-09.json) and [administrator checks](validation/finflo-live-blog-admin-2026-11-09.json).

The empty blog stays noindex and the sitemap retains 721 existing URLs until real articles are published. The full create/edit/publish/unpublish/archive/restore workflow was verified against the isolated local PostgreSQL test instance; it was not repeated with fixture articles in production.

## Remaining implementation and access checklist

- [x] Public blog, protected dashboard, editor and publishing lifecycle implemented.
- [x] Local PostgreSQL migrations, bootstrap, authentication and browser publication verified.
- [x] Private draft access, safe rendering, stale edit protection and published-only sitemaps verified.
- [x] Setup, recovery, deployment, privacy and operations documentation prepared.
- [x] Create the requested new Finflo Neon project and store its actual pooled connection privately.
- [x] Verify remote TLS, migrations, schema and idempotent migration reruns.
- [x] Bootstrap the real owner super admin without inserting test accounts or articles.
- [x] Apply the three private database/authentication variables on the existing Finflo Railway production service.
- [x] Deploy to the actual Node.js host and verify HTTPS authentication, cookie flags, the protected editor and public sitemaps.
- [ ] Publish reviewed original articles; retain factual/source/image-rights evidence.
- [ ] Configure actual provider backups/retention and confirm the chosen plan's costs.

Neon provisioning and the live Railway application are verified. Current AdSense account decisions, editorial quality of future articles, provider backup settings and field Core Web Vitals retain their separate limitations. The [AdSense audit](adsense-audit-2026-11-09.md) and [quality follow-up](adsense-quality-followup-2026-11-09.md) retain their documented limitations.
