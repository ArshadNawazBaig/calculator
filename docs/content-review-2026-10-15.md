# Site content review — October 15, 2026

The review replaced weak or inaccurate guidance on 29 calculator pages and improved the shared worked-example presentation used by 212 calculator pages. Changes are implemented in the local project. This report does not assert that Google has classified particular pages as low quality or that these changes guarantee rankings.

## Coverage and review method

The route inventory contains 717 English source routes and 5,736 URLs across eight languages. The review covered the calculator guides and FAQs, implemented calculation modes, directory copy, supporting guides, information pages, and the shared templates for clocks and spin wheels. The 446 regional clocks were assessed as one functional template with zone-specific data, rather than treated as 446 independently written articles.

| Page family | Source routes | Review focus |
| --- | ---: | --- |
| Calculators | 216 | Guidance and FAQs against 572 implemented modes, examples, assumptions, references |
| Regional clocks | 446 | Live local time, IANA zone identity, offsets, offset changes, shared explanatory content |
| Calculator directories | 26 | Useful tool selection guidance and working destinations |
| Student directory | 1 | Distinct grade, final-exam, GPA and GPA-goal workflows and links |
| Spin wheels | 8 | Instructions, odds, presets, removal behavior and local state |
| Time tools | 4 | Clock, timer, stopwatch and time-zone workflows |
| Supporting guides | 3 | Explanations, formulas and numerical examples |
| Information pages | 9 | About, methodology, editorial, privacy and other published policies |
| Navigation hubs | 4 | Discovery and links to useful tools |

The criteria were whether a page helps complete its stated task, explains inputs and results, identifies material assumptions, matches the implemented features, and provides appropriate references. Length alone was not a reason to rewrite a page. This follows Google's emphasis on useful, people-first content and its explicit rejection of a preferred word count. [Google's helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)

## Changes made

### Concrete explanations and examples

Twenty-four calculator guides now replace broad advice with numerical examples, interpretation, and specific input mistakes to avoid. Two business guides also received substantive corrections.

| Pages | Added or corrected value |
| --- | --- |
| Average return | A +50% / −50% sequence demonstrates why an arithmetic average of zero still loses 25% of the investment. |
| Margin | Cost 80 and price 100 distinguish 20% margin from 25% markup; a target-margin example works backward to price. |
| Discount | Shows percentage discount followed by fixed discount, the effect of reversing the order, and optional tax. |
| Sales tax; VAT | Explains extracting included tax by division instead of subtracting the rate from the total. |
| Debt ratio | Uses monthly payments and gross income, distinguishing debt balances, take-home income and budget cash flow. |
| Refinance | Explains simple payment break-even and why the ending loan balance matters at a common comparison date. |
| Body type | Distinguishes measured ratios from the implemented revised FFIT apparel descriptors. |
| BMR; TDEE | Shows the resting-energy arithmetic and the effect of activity factors, with the correct distinction between resting and total expenditure. |
| Average; standard deviation | Demonstrates outlier effects and the difference between sample and population spread. |
| Confidence interval; sample size | Gives numerical examples and explains the assumptions and effect of changing precision. |
| Probability; ratio; permutations and combinations | Makes overlap, scale, and ordered versus unordered outcomes concrete. |
| Date | Explains elapsed versus inclusive dates, month-end clamping, and available business-day calendars. |
| Electricity; bandwidth | Distinguishes power from energy, bits from bytes, and decimal from binary file units. |
| Density; molarity | Shows compatible input units and explains sample volume versus final solution volume. |
| Tire size; Ohm's law | Works through nominal dimensions and electrical quantities, including unit-prefix errors and model limits. |
| Freelance rate | Corrects the suggestion to put the monetary price of purchases into project hours; expenses belong on a separate agreed expense line. |
| Seller profit | Clarifies that Etsy's USD 100 Offsite Ads cap applies to the fee amount, not the percentage. |

The numerical checks cover 32 calculation scenarios, including alternative tax, unit, activity and date assumptions. Expected values were evaluated independently of the calculator outputs before being asserted in tests.

### FAQs that contradicted available functionality

Six FAQs were corrected after checking the implemented features:

- **Body type:** the ratios mode and the separate revised FFIT descriptor mode are both available.
- **Date:** custom business-day modes support holiday presets, selected rules and recurring exclusions, as well as chosen working weekdays.
- **Base64:** the local-file panel supports binary files up to 10 MiB; text modes also offer supported character encodings beyond UTF-8.
- **Federal tax:** distinguishes the composed federal estimate from individual worksheets and explains the risk of counting overlapping amounts twice.
- **Marriage tax:** distinguishes the ordinary-income comparison from the composed federal comparison.
- **Discount:** the optional tax field applies the entered rate after percentage and fixed discounts.

### Shared worked examples

The English and translated articles now use the same worked-example component. Row inputs are rendered as labeled tables instead of serialized JSON. Blank values say “Not entered,” zero remains zero, all result metrics are shown, and returned explanations and notes are included. This makes the assumptions behind an example inspectable without running the form.

Tables scroll inside their containers on small screens and have column headers, captions and keyboard-accessible scroll regions. The repeated hero description was removed from the how-to section. New copy and labels are available in Spanish, French, German, Portuguese, Arabic, Hindi and Filipino.

### References

Added targeted primary references for [debt-to-income ratios](https://www.consumerfinance.gov/ask-cfpb/what-is-a-debt-to-income-ratio-en-1791/), [mortgage terms and refinancing](https://www.consumerfinance.gov/consumer-tools/mortgages/answers/key-terms/), and [confidence limits for a mean](https://www.itl.nist.gov/div898/handbook/eda/section3/eda352.htm). Repaired the expense splitter's broken OpenStax link to the correct [proportions section](https://openstax.org/books/prealgebra-2e/pages/6-5-solve-proportions-and-their-applications).

The external-reference audit covers 205 distinct URLs: 167 responded successfully, 31 could not be verified because of access responses, and 7 could not be verified because of request failures. The one confirmed 404 was repaired. A successful HTTP response does not, by itself, establish factual accuracy; blocked requests and timeouts are not labeled broken links.

## Content retained

Existing guides with useful assumptions, formulas, examples and tool-specific instructions were retained. Directory pages continue to help users choose a tool. Clock pages continue to provide live, location-specific information. These pages were not expanded solely to reach a word count. No new public routes or duplicate calculators were created during this review.

The review did not change calculation algorithms, user inputs, saved data, or the established student-page structure. It did not invent expert reviewers, testimonials, research credentials or new verification dates for unchanged provider presets. Review dates changed only for the two edited business articles that already publish an article review date.

## Validation

- Production build, TypeScript and ESLint pass.
- All **3,218 tests in 51 files pass**, including 40 new content-review tests. The successful full-suite command used `npm test -- --maxWorkers=4`. The unrestricted run exceeded the existing five-second timeout while loading all seven language dictionaries; that test also passed independently. No assertions were removed and no timeout was increased.
- Translation validation passes for **11,260 required messages in each of seven languages**, including number, placeholder and formula checks.
- Eight rendered-page checks cover desktop and mobile examples, grade/GPA/expense/invoice rows, Spanish, Arabic and Hindi. No page overflow, exposed row JSON or browser errors were found. Desktop, mobile and Arabic screenshots were visually inspected.
- The production crawl passes for **all 5,736 sitemap URLs** and **5,752 unique internal paths**: zero crawl errors, duplicate titles or duplicate descriptions. Checks include status codes, canonical URLs, H1 headings, descriptions, robots directives, reciprocal language links and valid structured-data JSON. These are technical checks, not evidence of Google indexing or rich-result eligibility.
- All **22 selected browser tests pass**, covering student-page links, grade and GPA interactions, the 12 business tools on mobile, and accessibility checks for invoice, expense and net-worth pages.

Re-run the structural inventory with `npm run audit:content`. It checks coverage and content structure; it is not a ranking or editorial-quality score.

## Evidence and limits

- [Route and template inventory](validation/content-inventory-2026-10-15.json)
- [Reference checks and repaired link](validation/content-sources-2026-10-15.json)
- [Changes and validation summary](validation/content-review-2026-10-15.json)

This was a source-code, content, calculation-example and rendered-site review. It did not access Google Search Console, measure ranking changes, establish indexing status, or obtain independent specialist or native-language sign-off. The retained source-check exceptions are recorded individually in the reference report. Changes remain local and have not been deployed.
