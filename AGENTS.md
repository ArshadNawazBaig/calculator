<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Keep repository changes focused

The owner wants this policy applied to every future change and cleanup of older files:

- Commit application code, required assets, configuration, tests, maintained documentation, and reference data that the project needs.
- Keep generated audit reports, screenshots, browser traces, logs, temporary exports, and one-off working notes out of Git. Use `docs/validation/`, `test-results/`, or `docs/local/` as appropriate; these locations are ignored.
- Before committing or pushing, inspect the staged file list and diff. Stage only the intended paths; do not include unrelated workspace changes or force-add ignored artifacts.
- Run `npm run check:repo` before committing. When introducing a new generated-output location, add its ignore rule in the same change.
- Check application, test, build, and maintenance-script dependencies before removing an older file. Preserve necessary fixtures, source provenance, licenses, and deployment inputs.
- Keep local copies when untracking historical artifacts and retain useful historical references. Preserve Git history; do not rewrite commits or force-push for cleanup unless the owner explicitly requests that separately.
