# AdSense content review — October 21, 2026

This is the historical record of the first two local reviews. The [October 22 release record](adsense-release-2026-10-22.md) supersedes its publication plan and language availability: unreviewed translations are temporarily withdrawn, with old links redirected to the matching English page. The earlier multilingual test counts below are not current publication counts.

The supplied AdSense screenshot reports **Low-value content** and shows **Ads.txt: Authorised**. It does not identify a particular URL or failed calculation. These changes address observable content and integration gaps; they do not establish Google's reason for rejecting individual pages or guarantee approval.

## Changes

- Expanded the guide library from three to six articles. The new discount, weighted-grade, and concrete guides work through explicit inputs, compare alternatives, explain mistakes and limitations, and link to the relevant calculator modes and primary references. The examples are constructed for Finflo, not copied from the reference pages.
- Added accessible comparison tables and section navigation. The complete explanations and tables render in server HTML without JavaScript.
- Linked the guides from the relevant calculators, guide directory, and HTML/XML sitemaps. They are English publications. Localized listings and the language picker do not advertise untranslated versions; those URLs return 404 and are absent from hreflang and the XML sitemap.
- Replaced the unconditional AdSense script in both English and localized root layouts with the supported `google-adsense-account` metadata tag. The existing publisher account and authorized ads.txt entry are preserved. There is no ad-serving script on search, workspace, system pages, or content pages during review.
- Updated content audits to include English-only guides and to respect the language availability of each route. The content inventory also now recognizes the existing FAQ route.

## Evidence and scope

`tests/editorial-examples.test.ts` checks the new numerical examples against the actual calculator engines using separately derived expected values: discount order and tax assumptions; blank versus zero grades; attainable and unattainable final targets; slab depth, allowance, and cost basis. These checks verify arithmetic and implementation consistency, not expert or editorial approval.

`tests/e2e/adsense-content.spec.ts` checks verification metadata, absence of ad requests, ads.txt, server-rendered articles with JavaScript disabled, working calculator mode links, mobile overflow, accessibility, and translation availability. Existing indexing tests check sitemap language alternates. `npm run verify` runs type checking, lint, the unit suite, and the production build.

The screenshot does not establish that all other content has passed Google's review. Existing calculator and translated pages remain accessible. No bulk noindex change, artificial author credentials, fabricated professional review, or word-count approval threshold was added.

First-pass validation completed locally:

- `npm run verify`: type checking, lint, 3,267 unit tests, and the production build passed.
- After the final audit/link-test additions, type checking, lint for the changed scripts, and 35 targeted unit tests passed.
- 23 Chromium browser tests passed across the new AdSense/content checks and the existing language, learning-content, and SEO-discovery suites.
- `npm run audit:content` and `npm run audit:value`: 721 source routes, six guides, and no reported issues. The value manifest lists 5,747 URLs across their available languages; this count is an inventory, not a claim that every URL received browser inspection.

## Second review: do not resubmit the current live release

The second review on October 21 found that **finflo.org still serves the earlier release**. The three new guide URLs return 404, its guide index lists three articles, and its sitemap contains 5,744 URLs. Sampled content and utility pages still request the Google advertising script and ad endpoints while the privacy and cookie pages say no advertising networks are used. Local script removal corrects this discrepancy only after deployment. This review has not deployed changes or requested an AdSense review.

Additional corrections made locally:

- Fixed `/en` and `/en/` redirect behavior, including query parameters. The earlier zero-length wildcard produced an empty redirect destination; nested English aliases still redirect to their canonical routes.
- Gave the credit-card tool a relevant fixed-payment example: a $5,000 balance at 20% with a $200 monthly payment. The former shared defaults resembled a $250,000, 30-year mortgage. Shared loan defaults remain independent. The page explains the monthly approximation and no-new-purchases assumption and links to CFPB's explanation of real issuer interest calculations.
- Replaced unrelated references on weighted grades, GPA, reference weight, and parent-based height with sources supporting the actual methods. Dedicated final-exam and GPA-goal pages now retain their parent tools' sources. Removed the unrelated BMI citation from the apparel body-shape tool.
- Replaced the Army's dead 2023 guidance URL with its working canonical announcement; this is a historical method reference, not a claim that the article establishes current eligibility policy. Updated the moved PVWatts reference to its current official host.
- Corrected confirmed semantic translation errors in sampled wheel, grading, concrete, and measurement text. The focused second label sample corrected 137 entries: 114 Filipino and 23 across the other six locales. Its scope was 168 systematically reviewed Filipino labels plus three previously identified errors, and 13 critical labels checked in each other locale. The time sidebar now uses its existing translated calculator name. Translation coverage checks exclude only the deliberately English-only new articles rather than treating them as incomplete published translations.
- Independently checked the three new guide examples, their input labels, assumptions, and supporting references. Clarified the delivery-charge assumption in the discount comparison and matched the concrete guide's basic-mode instruction to the actual `Thickness` label.

The source-link audit requested 211 distinct external URLs: 173 were reachable, 32 were blocked or rate-limited, five failed at the network/request level, and one Army URL was a confirmed 404. The Army replacement returned 200. Separate follow-up retrievals opened four of the five network failures (FTC, HUD, the apparel research PDF, and the J-STAGE paper). The old PVWatts host failed, but its current official `pvwatts.nlr.gov` service loaded and replaced that reference. The 32 blocked or rate-limited URLs remain **unverified**, not proven dead links. HTTP success alone does not establish factual accuracy.

Second-pass local validation:

- `NEXT_PUBLIC_INDEXABLE=true npm run verify`: type checking, lint, 53 unit-test files / 3,269 tests, and production build passed. The final prose, translation-label, and reference-URL corrections were followed by another successful production build.
- All 57 Chromium tests passed on the final build across AdSense/content, SEO discovery, languages, student tools, wheels, and time. Two stale clock/stopwatch assertions initially counted explanatory-table content; they now target the actual tool regions. The failures were reproduced and the scoped assertions passed without runtime changes.
- The full production-HTML SEO crawl checked all 5,747 sitemap URLs and 5,763 distinct internal paths with zero reported errors, duplicate titles, or duplicate descriptions. It ran before the final wording and external-source URL changes; routing and metadata rules did not change afterward. This checks technical discoverability, not Google indexing or editorial quality.
- The final translation check passed 11,255 messages in each of seven dictionaries, with no missing messages or placeholder, number, or formula discrepancies. Thirty-two targeted translation and example tests also passed during the label corrections.
- Content and page-value inventory checks passed for 721 source routes, including six guides. These structural checks do not establish that every page has sufficient editorial value for AdSense.

The [second-review evidence](validation/adsense-second-review-2026-10-21.json) records crawl scope, unresolved source access checks, and the exact focused translation corrections.

### Remaining editorial limits

The translation sample exposed meaning-changing mistakes, including grading points mistranslated as ears and slab thickness as a thick cloud. Correcting those entries does not certify the remaining translations. A fluent editorial review of the published language versions, especially Filipino and Hindi, remains a substantive step before resubmission. Automated completeness, placeholder, numeric, and formula checks cannot assess naturalness or meaning throughout the text.

Some related calculators share engines and modes. That is not itself proof of a policy violation, and their distinct guidance and workflows can be useful. Continue checking whether each published page answers a distinct user question rather than assuming more URLs or more article words will secure approval. No minimum traffic, page count, article length, or waiting period is asserted here.

## Before requesting another review

1. Complete the remaining language-quality review and review the new articles for editorial accuracy and usefulness, then publish the changes using the normal deployment process. Confirm the production build uses `NEXT_PUBLIC_SITE_URL=https://finflo.org` and `NEXT_PUBLIC_INDEXABLE=true`; the preview default intentionally disables indexing.
2. Check the new guide URLs on finflo.org, their calculator links, the sitemap, and `/ads.txt`. Confirm the ownership meta tag appears in the homepage HTML. Local checks do not prove the live deployment has changed.
3. In **AdSense → Sites → finflo.org**, use the meta-tag or ads.txt verification method if AdSense asks to verify the connection again. Then request review after assessing the rest of the site against the feedback. This work does not submit an account review.
4. Treat ad serving as a separate release after approval: choose appropriate content placements, configure the applicable Google consent message, update disclosures for the actual behavior, and verify that ads do not appear on utility/error screens. Re-adding an unconditional script to the root layouts would undo the placement separation.

Google reviews the site as a whole. These code checks cannot certify content quality, assess every translation, or change the account's approval status.

## Official references

- [Prepare pages for AdSense](https://support.google.com/adsense/answer/7299563?hl=en): useful original content and clear navigation.
- [Screens without publisher content](https://support.google.com/publisherpolicies/answer/11112688): low-value, unfinished, and behavioral screens; review and curation of automatically generated content.
- [Connect a site to AdSense](https://support.google.com/adsense/answer/7584263?hl=en): script, ads.txt, and meta-tag verification methods and the review process.
