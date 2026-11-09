# Blog administration and PostgreSQL setup

The public blog and private administration use the existing Next.js application. Blog records and Better Auth credentials/sessions live in PostgreSQL. Neon uses its standard PostgreSQL connection URL; the database is not required to build the source or use the existing calculators. A missing configuration leaves administration unavailable instead of creating a default account.

## Current setup status — November 9, 2026

The new `finflo` database is provisioned through the owner's existing Vercel Neon integration: project `spring-leaf-75388979`, resource `store_Go0l8Awk85CYRsss`, region `iad1`. The existing Launch plan was unchanged, and managed Neon Auth and Realtime are off. The application's pooled connection passed verified TLS; both migrations applied and reran idempotently, and all nine expected tables and the published-identity trigger were confirmed. The real owner administrator has been bootstrapped without adding fixture articles. [Provisioning evidence](validation/neon-provisioning-2026-11-09.json) records the remote checks separately from earlier disposable local tests.

Local connection/authentication configuration is in the ignored `.env.local` file with mode `0600`. Initial administrator credentials are outside the workspace at `~/.config/finflo/admin-credentials.json`, also mode `0600`. No secret values are recorded here. The Railway production service is authenticated in the browser and private variables are being staged; deployment and HTTPS website verification remain pending. The instructions below describe ongoing operations and future recovery, rather than a request to create another database or repeat bootstrap.

## Private runtime configuration

Set these variables in the existing host's private environment, or in an ignored local environment file. Never prefix them with `NEXT_PUBLIC_`, commit their values, put passwords in URLs shared with others, or send credentials through chat.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection URL from the actual Neon project/branch. A local PostgreSQL URL can be used for development. |
| `BETTER_AUTH_SECRET` | A high-entropy secret of at least 32 characters. Keep a protected copy; changing it affects signed authentication cookies. |
| `BETTER_AUTH_URL` | The application's exact origin, for example `https://finflo.org`. Non-loopback hosts require HTTPS. Explicit `http://localhost:PORT`, `http://127.0.0.1:PORT` or `http://[::1]:PORT` is accepted for local integration. Paths, credentials, query strings, fragments and inferred request hosts are rejected. |

Use the intended Neon branch before migrating. The pool uses verified TLS for remote databases, strips connection-string SSL settings that could override verification, and refuses remote `sslmode=disable`. Explicit loopback PostgreSQL can run without TLS for local tests. The provisioned Finflo Neon pooled connection has now passed the remote TLS check; this does not by itself verify a deployed website.

## Apply migrations

The scripts require Node 22 and the installed dependencies. The npm commands read inherited variables and load an optional ignored `.env.local` file. Direct raw script execution does not automatically load Next.js environment files; pass `--env-file` explicitly when needed. To apply migrations:

```sh
npm run db:migrate
```

The runner applies numbered SQL files in order. Each file and its checksum ledger entry run in one transaction, with a transaction-scoped advisory lock and a fresh ledger/checksum check while that lock is held. Concurrent runners therefore cannot apply the same file twice, and the runner does not rely on session-level locks that are incompatible with Neon’s transaction pooler. Re-running an unchanged migration is safe. An altered checksum, missing previously applied file or reordered applied sequence is rejected. Do not edit an applied migration: add the next numbered migration. The supplied migrations add isolated `blog_*` tables and do not drop existing application tables.

## Create the first super admin

The real owner administrator is already created for the provisioned Finflo database. Do not rerun bootstrap to replace it; the command refuses an existing administrator. Use the recovery procedure below when a password needs replacing.

For a fresh database only, run the bootstrap command from a trusted terminal with the same private configuration:

```sh
npm run admin:create
```

It asks for the email, display name and a password of 16–128 characters. Password entry is hidden and confirmed. The display name can appear as the author of posts; use an accurate name or organization label you are entitled to publish.

For a private automation environment, `SUPER_ADMIN_EMAIL`, optional `SUPER_ADMIN_NAME` and `SUPER_ADMIN_PASSWORD` can be supplied by its secret store. The command accepts no positional arguments or plaintext password flags. Keep the password out of shell history and clear the temporary bootstrap password variable afterward. The command does not print passwords, password hashes, session tokens or connection URLs.

Bootstrap uses Better Auth's official password hasher. In one database transaction it creates a reader account and password credential, then promotes that account to `super_admin`. It refuses to overwrite an existing administrator or the requested existing account. No login session is created. Web signup, OAuth and web account creation are disabled.

After creation, open `/admin/sign-in` on the configured origin and sign in. Keep account email/name details accurate; creating an application account does not establish company identity or professional credentials.

## Recover a forgotten password

Use the trusted local recovery command with the exact existing administrator email:

```sh
npm run admin:password
```

Provide `SUPER_ADMIN_EMAIL` privately or enter it at the prompt. The new password is hidden and confirmed, or can come from a private `SUPER_ADMIN_PASSWORD` environment variable. No web password-reset endpoint is enabled, and the application sends no reset emails.

Recovery requires database access and the configured authentication secret/URL. It updates exactly one existing super admin password credential with Better Auth's hasher and revokes that user's existing sessions in the same transaction. It does not create or promote an account, and does not delete posts. Sign in again afterward. Rate-limit windows still apply; recovery is not a public throttle bypass. Preserve backups and access to the actual hosting/database secret store so this trusted recovery path remains available.

## Authorization and request boundaries

- `requireSuperAdmin()` reads the database-backed session and checks the exact `super_admin` role inside every privileged operation. A session-cookie presence or a hidden dashboard link is insufficient. Cookie-based session-data caching is disabled, so deletion, expiration and role changes are checked against the server-side state.
- Session cookies are HTTP-only and SameSite=Lax. HTTPS origins use Secure cookies; the explicit HTTP loopback exception supports local tests. Sessions expire after eight hours without automatic extension. Signing out revokes the session.
- Public auth routing exposes only email/password sign-in, sign-out and read-only session retrieval. Signup, profile updates, password/account changes and plugin/admin endpoints are outside the route allowlist. Mutation requests require the exact configured Origin. Forwarded hosts do not broaden trusted origins.
- Authentication responses are private, non-cacheable and excluded from indexing. The actual streamed POST body is capped at 8 KB as well as checking any declared Content-Length. Credential errors are generic; database/secret details are not returned to the browser.
- Better Auth's database-backed request limiter remains active. Since a trusted hosting IP-header contract has not been established, forwarded client IPs are not trusted: the library uses a shared counter per path. The sign-in limit is ten requests per minute; the general limit is 100 requests per minute. This is not a claim of unique per-client IP enforcement.
- An additional atomic PostgreSQL counter permits ten sign-in attempts per normalized account in a 15-minute window, including distributed/concurrent attempts. Its key is HMAC-derived rather than a raw email address. Expiration resets the attempt window; it does not itself promise deletion of old counter rows. Verify the hosting proxy contract before adding any trusted IP header configuration.

These controls do not replace operator protection of database credentials, terminal access and production secrets. They do not create a claim that Google has approved the site or that every referenced dataset has a cleared reuse basis.

## Publishing workflow

Open `/admin` for the dashboard and `/admin/posts` to search or filter posts. `/admin/posts/new` creates a draft. The editor supports Markdown formatting, an immediate safe preview, optional cover-image references/alternative text, and optional search titles/descriptions. Images are referenced by URL; there is no file-upload service. Raw HTML and executable URL schemes are omitted from rendered Markdown.

Saving an existing published article keeps it published. Use **Unpublish** to save it as a private draft, or **Archive** to remove it from public access while retaining the record. An archived article can be restored with **Save draft**. The first publication date and URL slug are preserved across unpublishing, archiving and republication. An established slug cannot be renamed through this editor. Concurrent edits use an expected version; a stale editor must copy its unsaved changes and reload the latest record before retrying.

Only published articles appear on public blog pages and the XML/HTML sitemaps. The empty blog provides links to existing worked guides and remains noindex, with no blog entries in the XML sitemap. No demonstration articles are seeded into a production database. Category filters and pagination are public, while saved previews stay under authenticated `/admin` routes. Existing calculators and browser workspaces do not write to this database.

Before publishing, check factual claims, examples, source links, image permissions and the author display name. Publication validation rejects empty/HTML-only bodies; it is not an assessment of editorial accuracy or Google approval. There is no Google minimum word-count rule enforced by this application.

## Deployment and operations

1. The requested **Finflo** Neon project is created in `iad1` on the existing Launch installation. Review its actual metered usage and backup settings in that account; no plan change or fixed database-cost promise was made.
2. Finish configuring the host's private `DATABASE_URL`, unique `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL=https://finflo.org`. The connection and secret are already stored privately for local configuration; Railway values are being staged separately. Keep them out of public build variables and repository files.
3. The initial migrations and real owner bootstrap are complete. For future schema releases, run `npm run db:migrate` from a trusted environment against the intended branch. Bootstrap is only for a new database; use `npm run admin:password` for this existing administrator. These commands do not run automatically on public requests, and temporary bootstrap password variables should not remain in the host environment.
4. Build with the intended public canonical/indexing variables and deploy the native Node.js application. Verify HTTPS sign-in, Secure/HTTP-only cookies, draft-only access, publication, unpublishing and sitemap changes on that exact deployment. The remote Neon schema checks are complete; deployment and live application behavior remain pending.
5. Keep database and hosting access protected. Configure the actual provider's available backup/history settings, export or snapshot important content, and test recovery before relying on it. The app does not create a backup schedule. Do not delete a production project to repeat setup; migrate and restore through the actual provider's recovery tools when necessary.

Authentication counter rows are persistent; expired windows reset counters but do not automatically delete historical rows. An operator can schedule deletion of old `blog_login_throttle` and `blog_rate_limit` records after choosing a retention window longer than the active limits. Keep database backups, counter housekeeping, provider costs and private session data in operational review. No ad-serving code, reader tracking, public signup or comments were added with this feature.

References: [Neon connection guide](https://neon.com/docs/guides/nextjs), [Better Auth Next.js integration](https://better-auth.com/docs/integrations/next), [PostgreSQL transactions in node-postgres](https://node-postgres.com/features/transactions).

## Recorded verification

To repeat the gated publishing browser checks, use a disposable database and its test administrator in a private environment. Set `FINFLO_BLOG_E2E=1`, `TEST_URL` to the local test deployment, and `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` through that environment's secret store. Set `TEST_INDEXABLE=true` when testing a build made with `NEXT_PUBLIC_INDEXABLE=true`; leave it unset for a noindex preview. The lifecycle creates and archives a fixture article. Never point this workflow at a production publishing database. Ordinary browser checks do not enable this write workflow by default.

Implementation validation includes configuration/TLS boundaries, forbidden auth routes, actual-body limits, authoritative role/session checks, default reader roles and persistent throttle behavior. Local PostgreSQL integration verified migrations, bootstrap, official Better Auth sign-in against the seeded password hash, cookie attributes, current-role reads, session revocation, disabled signup, origin rejection and concurrent account limits. Actual HTTP/browser checks are recorded in the blog feature's validation artifacts. Subsequent [remote Neon verification](validation/neon-provisioning-2026-11-09.json) confirmed the pooled TLS connection, migration checksums, exact schema and enabled identity trigger before the real administrator bootstrap. Production Railway configuration is being staged; live deployment/authentication/publication checks are not yet complete.
