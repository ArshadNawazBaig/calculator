# Adult screening content follow-up — November 9, 2026

The request to make every category10/10 was treated as a request to improve actual value, not as authorization to inflate scores or claim clinical review.

## Finding and exact affected URLs

https://finflo.org/overweight-calculator previously shared the adult BMI calculation with https://finflo.org/bmi-calculator and provided only a short general interpretation paragraph and two general FAQs. It already had a useful note that category boundaries are close numerically, so overlap was a potential editorial value weakness, not a confirmed Google policy violation. The calculation correctly categorized the unrounded result, but its display can show25 for both a value just below25 and exactly25 without explaining that display effect beside the result.

## Implemented improvement

1. Preserved both URLs, forms, input rules, calculation algorithm, result metrics and existing design.
2. Added an original three-step adult-screening interpretation workflow only to /overweight-calculator:
   - Choose adult20+ versus child/teen2–19 references, with direct functional links to #mode-adult and /bmi-calculator#mode-child.
   - Read the precise adult category intervals in an accessible captioned table: below18.5;18.5 to below25;25 to below30;30 and above.
   - Follow a reproducible numerical rounding example at fixed175cm:76.56kg gives24.999183… and76.5625kg gives25. Both display25 with at most two decimals, but their unrounded categories differ. The table explicitly says these are example inputs, not recommended weights, and explains that extra arithmetic precision does not establish measurement accuracy or a sudden clinical change.
3. Added direct links to the existing adult BMI guide and current CDC adult/child category references.
4. Added a short rounding explanation beside all existing adult BMI results (/overweight-calculator, /bmi-calculator adult mode, /anorexic-bmi-calculator) without changing their calculations or outputs.
5. Updated the overweight calculator's public description to match its distinct interpretation task, and added FAQs addressing the rounding display and child/teen method choice.

No personal weight target, calorie/diet recommendation, invented professional credential, review badge, fake content-review date, new medical diagnosis or Google-policy requirement was added.

## Files changed

- src/components/content/adult-bmi-screening.tsx — new server-rendered interpretation workflow; existing shared explanation styles reused, with keyboard-focusable table scroll regions, captions, row/column headers and age-method navigation.
- src/components/i18n/calculator-article.tsx — inserts the workflow only for the overweight calculator.
- src/data/calculator-content.json — overweight-specific description and two task-specific FAQs.
- src/data/tool-descriptions.json — same public description used by tool pages/cards.
- src/lib/calculators/health-engine.ts — adds the shared adult result rounding note; thresholds and arithmetic unchanged.
- tests/adult-bmi-screening.test.tsx — independent arithmetic/boundary, age-validation, child-mode and article-integration checks.
- tests/e2e/adult-bmi-screening.spec.ts — desktop functional navigation and recalculation, mobile overflow/accessibility, JavaScript-disabled initial HTML coverage prepared for root's next build.

## Evidence

Primary medical sources opened and inspected November9,2026:

- https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html — adult category boundaries for age20 and older, BMI as screening rather than diagnosis, other health factors and the child/teen reference distinction.
- https://www.cdc.gov/bmi/child-teen-calculator/bmi-categories.html — child/teen2through19 interpretation uses age- and sex-specific percentiles; adult reference begins at20.

The numeric examples and rounding behavior were developed independently for Finflo; CDC supplies the interpretation framework and category endpoints, not these example measurements. No competitor content was copied.

Independent Python Decimal evaluation at height1.75m (squared3.0625m²):

| Example input kg | Calculated BMI | Engine category | Display |
|---|---|---|---|
|56.65|18.497959183673469…|Underweight|18.5kg/m²|
|56.65625|18.5|Healthy-weight range|18.5kg/m²|
|76.56|24.999183673469387…|Healthy-weight range|25kg/m²|
|76.5625|25|Overweight|25kg/m²|
|91.87|29.998367346938775…|Overweight|30kg/m²|
|91.875|30|Obesity range|30kg/m²|

## Verification completed by this agent

- npm test -- tests/adult-bmi-screening.test.tsx tests/health-data-reference.test.ts tests/content-review.test.tsx —60tests in3files passed (5.01seconds). The new test file includes9 tests: six numerical boundary pairs exercised through both adult tools, plus adult age validation/real child percentile path, semantic table/link rendering and page-specific article integration.
- Targeted ESLint across all owned changed TS/TSX files including the e2e spec passed.
- CONTENT_OUTPUT=/tmp/finflo-content-followup-inventory.json npm run audit:content —721source routes /216calculator pages, no structural content issues.
- Existing server on127.0.0.1:3100 did not yet render the new component, consistent with the prior production build. This agent did not rebuild .next or claim the browser interaction checks passed against stale code. Root owns consolidated build and actual browser verification.

## Limitations

- This addresses one concrete overlap/interpretation weakness, not proof of universal originality or10/10 overall readiness.
- Calculator BMI values and categories are unchanged; additional interpretation does not create clinical validation or a personal assessment.
- The site currently publishes English only. The component uses existing translation hooks, but new strings would require native editorial translation before publishing other locales.
- Root must run the new e2e spec against the newly built app and append actual mobile/axe/no-JS results before marking browser checks verified.
- Changes remain local until root's authorized deployment workflow. No AdSense review was requested.


## English route integration correction

Root's browser reinspection found the new workflow absent from the published English route. The initial integration had covered only the separate localized CalculatorArticle template. Corrected src/app/(en)/[slug]/page.tsx to import and insert AdultBmiScreening immediately after CalculatorInsight, only for the overweight calculator. Other tools retain their prior article layout.

Added a test that invokes the actual async English ToolPage server component for /overweight-calculator and /bmi-calculator and checks its returned tree contains exactly one AdultBmiScreening only on the intended route. This test would fail against the omitted initial wiring. npm test -- tests/adult-bmi-screening.test.tsx now passes10tests; targeted ESLint for the route and test passes. Root owns rebuilding and rerunning the previously failing browser cases. The earlier3-file60-test statement remains the pre-route-correction targeted run, not proof the published English route had been included.


## Root browser verification

After wiring the workflow into the actual published English route and adding the route-level regression, both new browser cases passed on the rebuilt production app: real boundary recalculation/child-mode navigation, and mobile accessibility/no-JavaScript table readability. See `docs/validation/quality-targeted-browser-2026-11-09.json`. Production publication remains pending.
