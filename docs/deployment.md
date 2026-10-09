# Deployment

Finflo currently runs on Railway. The earlier private Sites preview and its [deployment evidence](validation/deployment.json) are retained below for reference. The production application is prepared for indexing on `https://finflo.org`. Both custom domains and their Vercel DNS records are configured; the registry now delegates to Vercel, while recursive DNS propagation and Railway certificate verification are pending.

## Railway

The `finflo` service uses the existing `ArshadNawazBaig/calculator` repository and its `main` branch. Its Railway URL is https://finflo-production-16af.up.railway.app. Deployment settings are checked in as `.railway/railway.ts`: Railpack builds with Node.js 22 and `npm run build`, then runs `npm run start`. The server listens on `0.0.0.0` and Railway's `PORT`; `/api/health` must return a successful response before traffic is routed to a new deployment.

The service has no database or volume. Its public variables are `NEXT_PUBLIC_SITE_URL=https://finflo.org`, `NEXT_PUBLIC_CONTACT_EMAIL=erushbaig@gmail.com`, and `NEXT_PUBLIC_INDEXABLE=true`. `MAINTENANCE_MODE=false` and `PORT=8080` configure the runtime. The production build generates indexable metadata and the canonical sitemap; the request proxy applies `X-Robots-Tag: noindex, follow` on every noncanonical hostname, including the temporary Railway address. Change `NEXT_PUBLIC_` values before rebuilding. Dedicated preview builds should continue to set `NEXT_PUBLIC_INDEXABLE=false`.

To link the Railway CLI to this service:

```sh
npx @railway/cli link --project d21adcb1-0b19-489d-8357-62edf17763f9 --environment production --service finflo
npx @railway/cli config plan
npx @railway/cli config apply
```

Pushes to `main` trigger application deployments. Changes to the infrastructure file also need `config plan` and `config apply`. The `finflo` partial manages only this service and leaves environment variables under Railway's control.

### Custom domain

The intended primary address is `https://finflo.org`. Next.js permanently redirects requests for `www.finflo.org` to the root domain and preserves the path and query string. Canonical URLs already use the root domain.

Both `finflo.org` and `www.finflo.org` are registered on the Railway service at port `8080`. The user added the apex domain through the dashboard, and the CLI subsequently added `www`. Domain IDs are `ca513288-de34-4235-9247-8094b9461efb` (apex) and `d0fbe1b6-36b6-4799-bdc0-ba949b7659dd` (www). Railway is waiting for public DNS verification before issuing certificates.

The Vercel DNS zone is enabled under `arshadnawazbaigs-projects`, using the same DNS provider as `thebestfreepdf.com`. The apex ALIAS points to `0mimryym.up.railway.app`; the `www` CNAME points to `d78e491d.up.railway.app`. The exact Railway verification TXT records are installed at `_railway-verify` and `_railway-verify.www`. Both Vercel nameservers directly returned the correct records. Retrieve the full expected verification values with `railway domain status <hostname> --json`; do not reuse Folio's values.

The direct `.org` registry query now confirms `ns1.vercel-dns.com` and `ns2.vercel-dns.com`. The nameserver change is published; no further registrar edit is needed. Vercel and some recursive resolvers return the Railway records, while other resolvers still have the old delegation cached. The latest local HTTPS request could not resolve `finflo.org`. Verify Railway ownership, certificates, HTTPS responses, robots, sitemap, and the www redirect on the actual domain once propagation finishes, before submitting it to Search Console. See [GoDaddy nameserver instructions](https://www.godaddy.com/help/change-my-domain-nameservers-664).

## Portable native Next.js runtime

The standard build is an actual Next.js Node application:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm exec next start -- --hostname 0.0.0.0 --port 3000
```

Use Node.js 22, persistent process supervision and a reverse proxy providing HTTPS. Pass only real environment values from `.env.example`. Public variables must be set at build time; `MAINTENANCE_MODE` is runtime configuration. A Node host should allow outbound HTTPS to the fixed currency providers. The application has no database migration or account secrets to provision.

The production preview is available locally when `npm run start -- --port 3100` is running at http://127.0.0.1:3100. This URL is only reachable on the user's computer.

## Private Sites deployment

The registered project is recorded in `.openai/hosting.json`. Its audience remains owner-private. Actual Next.js is preserved; there is no Vinext substitution. The Workers adaptation and any pinned compatibility workarounds are documented with the final build scripts and validation record. Stock OpenNext 1.20.10 compiles this Next 16.4 project but has runtime compatibility gaps, so a successful compilation alone is insufficient evidence.

The source must be committed and pushed before saving an artifact-backed version. The artifact must be built from exactly that commit. Deployment uses the native Sites save/private-deploy operation; only a successful native deployment result establishes the final URL. An expected URL or local Worker test is not evidence of a live deployment.

Do not enable public indexing or attach the domain as part of a private preview. Public release additionally needs the steps in [the launch checklist](launch.md). Hosting account fees, commercial terms, custom-domain configuration and provider logging settings remain owner/account-specific.

## Reproduce the private Worker artifact

```sh
npm ci
npm run build:sites
npm run preview:worker
```

The preview command serves the staged artifact at http://localhost:3101. `build:sites` deliberately fixes indexing to false. It builds Next, adapts it with pinned OpenNext 1.20.10, bundles with Wrangler 4.149.0 in dry-run mode, and stages `dist/server/index.js`, two WASM modules and `dist/client` assets. No Wrangler publish command is run. Public release requires a separate reviewed configuration; the portable Node build remains available.

Two assertive, hash-checked adapter patches include Next16.4's new `preview-props.json` manifest and omit its development-only console-file logger from the Worker. The source framework is unchanged. `sites-entry.js` preserves the streamed maintenance response while correcting the experimental adapter's status propagation from 200 to 503 only when all expected maintenance headers and the maintenance flag are present. These workarounds are pinned to the exact versions; upgrading refuses to silently patch unfamiliar bytes.

Local workerd checks establish page rendering, real404s, redirects, lazy math/codecs, maintenance status and currency snapshot behavior. Hosted Sites additionally must accept the default-fetch module, WASM modules, `ASSETS` binding and Node compatibility. The native deployment result is recorded separately. Upstream cache adapters are defaults; application snapshots have explicit per-isolate cache/coalescing and immutable serialized bodies, while cross-instance/CDN caching depends on the selected host.

The scoped npm override updates the build-only minifier's `glob` to10.5.0 for [GHSA-5j98-mcp5-4vw2](https://github.com/advisories/GHSA-5j98-mcp5-4vw2). It does not replace OpenNext's own glob13 library. Keep the lockfile and rerun adapter smoke checks after changing these dependencies.
