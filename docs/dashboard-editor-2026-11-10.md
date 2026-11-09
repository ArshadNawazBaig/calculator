# Dashboard and article editor — November 10, 2026

The administrator interface now uses Finflo's existing visual language and shared components: PageHero, Button, Dropdown, form controls and segmented navigation. Sign-in, the dashboard, post filters, article list, previews and error states share those components. The new reusable TextField connects labels, help and errors to native inputs. The save actions sit in the page flow so they do not cover writing controls.

The article body opens in a visual editor powered by headless Tiptap 3.33.0, with Finflo's own toolbar and controls. Features include paragraph/headings, bold/italic/strikethrough, lists/checklists, quotes/code, validated links, image URLs with alternative text, tables, undo/redo and word count. Link and image settings use inline form panels rather than browser prompts. Existing article storage remains Markdown; no database migration, new account or credential change is required.

The advanced Markdown source view and reader preview remain available. Opening an article does not rewrite its stored content or mark it edited. Imported heading levels are preserved while H1 renders as H2 inside the editor. Footnote articles use source editing to preserve references unsupported by the visual Markdown bridge. Table cells accept paragraphs and inline formatting; unsupported block formatting is prevented rather than silently flattened. Attribute-free `<br>` tokens become safe reader line breaks for multiline table cells; arbitrary raw HTML remains omitted.

URL schemes, image alternatives, pasted HTML and document attributes are validated before editor rendering. Scripts, event handlers, active embeds and unsafe destinations are removed. The existing server authorization, validation, optimistic version checks, draft/public boundaries and publishing lifecycle are unchanged.

## Verification

- Production build, TypeScript and ESLint passed.
- Full unit suite passed with four workers; the new suite includes 41 editor security, schema and Markdown compatibility cases. Two locale-import tests timed out when initially run alongside a build; they passed in the controlled rerun with their original assertions and time limits.
- All eight isolated browser workflow checks passed: publishing/unpublishing/archive/restore and concurrent edits; visual formatting and undo; links/images/tables; safe paste/import; hydration; footnote preservation; mobile light/dark accessibility and keyboard controls.
- Fourteen existing public blog, header and calculator form browser checks passed; the one opt-in sign-in hydration check was skipped in that regression command. Editor hydration is covered separately by the focused suite.
- Final design inspection covered dashboard, editor and post list at 360/1280 px in light/dark: zero overflow, browser errors or axe violations. Status filtering and static save-action placement were verified.
- Runtime dependency audit reported zero advisories. Existing development/deployment-tool advisories remain outside this change. License notices were regenerated.

Testing found and corrected two actual interaction defects: the editor's link shortcut also opened the global calculator search, and clearing stored link formatting removed a just-inserted link. The final browser rerun verifies both corrections.

Evidence: [functional browser checks](validation/dashboard-editor-functional-2026-11-10.json), [design inspection](validation/dashboard-design-2026-11-10.json). Fixture article writes occurred only in the explicitly marked, isolated loopback PostgreSQL test instance. No production fixture articles were created. Production deployment and live checks are recorded after release verification.
