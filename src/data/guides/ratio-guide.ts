import type {InfoPage} from '../information';

export const ratioGuideCalculators: Record<string, string[]> = {
  'sharing-and-scaling-ratios': ['ratio-calculator', 'percent-calculator', 'fraction-calculator'],
};

export const ratioGuides: Record<string, InfoPage> = {
  'sharing-and-scaling-ratios': {
    title: 'How to share a total in a ratio and scale a recipe',
    description: 'Divide a total into ratio shares, recover a missing part, scale recipe quantities, and distinguish a share of the whole from a comparison between parts.',
    sections: [
      {
        title: 'First decide whether you know the total or one share',
        paragraphs: [
          'Suppose two workshops share a $960 materials budget in the ratio 3:5. The first workshop gets three equal parts and the second gets five. The $960 is the combined budget, so it corresponds to eight parts. If the question instead says the second workshop receives $600, that amount corresponds to five parts. Dividing by the wrong number of parts changes the answer.',
          'Write a label beside each quantity before calculating. In the examples below, the order is always first workshop : second workshop. The sharing weights are nonnegative and their sum must be positive. The examples illustrate an agreed allocation; a ratio does not determine which allocation is fair.',
        ],
        table: {
          caption: 'Choose the calculation from the information you actually have',
          headers: ['What is given?', 'What does the amount represent?', 'First step'],
          rows: [
            ['Total $960; ratio 3:5', 'All 8 parts together', '$960 ÷ 8 = $120 per part'],
            ['Second share $600; ratio 3:5', 'The second workshop’s 5 parts', '$600 ÷ 5 = $120 per part'],
            ['Existing quantities; a larger batch is needed', 'The starting amounts', 'New batch size ÷ old batch size'],
          ],
        },
      },
      {
        title: 'Share $960 in the ratio 3:5',
        paragraphs: [
          'Add the ratio terms: 3 + 5 = 8 parts. One part is 960 ÷ 8 = 120. Multiply that value by each term: the first share is 3 × 120 = $360, and the second is 5 × 120 = $600. Check both the total, 360 + 600 = 960, and the simplified ratio, 360:600 = 3:5.',
          'For any two nonnegative weights a:b and total T, the shares are T × a/(a + b) and T × b/(a + b). Finflo’s Scale a ratio mode can perform the final multiplication: enter First term 3, Second term 5, Scale factor 120 and Direction enlarge. Calculate the per-part factor from your total first; the scale-factor field is not a total-amount field.',
        ],
        table: {
          caption: 'The two shares exhaust the $960 example budget',
          headers: ['Recipient', 'Ratio parts', 'Calculation', 'Share'],
          rows: [
            ['First workshop', '3', '960 × 3/8', '$360'],
            ['Second workshop', '5', '960 × 5/8', '$600'],
            ['Combined', '8', '360 + 600', '$960'],
          ],
        },
        links: [{label: 'Scale the ratio after finding the value of one part', href: '/ratio-calculator#mode-scale'}],
      },
      {
        title: 'Find the missing share when only one amount is known',
        paragraphs: [
          'Now suppose only the second workshop’s $600 share is given. Because it represents five parts, one part is 600 ÷ 5 = 120. The first workshop gets 3 × 120 = $360, and the total is $960. Treating $600 as the total would incorrectly give shares of $225 and $375.',
          'You can also write 3:5 = C:600. Open Solve any proportion term, select C as the unknown, and enter A = 3, B = 5 and D = 600. The result is C = 360. The letters are positions in the proportion; they do not tell the calculator which amount is a combined total.',
        ],
        links: [{label: 'Solve the proportion for a missing amount', href: '/ratio-calculator#mode-all-proportions'}],
      },
      {
        title: 'Why 3:5 means 37.5% of the total, not 60%',
        paragraphs: [
          'The first workshop’s share is 3/8 of the combined budget: 360 ÷ 960 × 100 = 37.5%. The second share is 5/8, or 62.5%. These percentages add to 100% because they use the same whole.',
          'The calculation 3 ÷ 5 × 100 = 60% answers a different question: the first workshop receives 60% as much as the second. It compares $360 with $600 rather than with $960. In What percentage?, enter Part 360 and Whole 960 for the budget share; use Whole 600 for the comparison between workshops.',
        ],
        table: {
          caption: 'Changing the denominator changes the question',
          headers: ['Question', 'Fraction', 'Percentage'],
          rows: [
            ['First share of the combined budget', '360/960 = 3/8', '37.5%'],
            ['Second share of the combined budget', '600/960 = 5/8', '62.5%'],
            ['First share compared with the second', '360/600 = 3/5', '60%'],
          ],
        },
        links: [{label: 'Compare a part with the intended whole', href: '/percent-calculator#mode-what'}],
      },
      {
        title: 'Scale recipe quantities from 4 portions to 10',
        paragraphs: [
          'For an arithmetic example, suppose a trail-mix batch contains 300 g of nuts and 200 g of dried fruit and is divided into four equal portions. To keep the same portion size for ten portions, use a scale factor of 10 ÷ 4 = 2.5. The new quantities are 300 × 2.5 = 750 g and 200 × 2.5 = 500 g, totaling 1,250 g.',
          'In Scale a ratio, enter First term 300, Second term 200, Scale factor 2.5 and Direction enlarge. The result gives the two new quantities in the same order. The ratio remains 3:2, and the mass per portion stays 125 g. A larger batch alone does not change the ingredient proportions.',
          'The example scales ingredient quantities only. It does not determine a suitable portion size, nutritional needs, or cooking time. Use consistent units for a quantity comparison: 0.3 kg and 200 g become 300 g and 200 g before simplifying their ratio. A volume measurement in cups cannot be converted to grams without an ingredient-specific mass relationship.',
        ],
        table: {
          caption: 'Multiply both ingredients by the same factor of 2.5',
          headers: ['Quantity', '4 portions', '10 portions'],
          rows: [
            ['Nuts', '300 g', '750 g'],
            ['Dried fruit', '200 g', '500 g'],
            ['Total mass', '500 g', '1,250 g'],
            ['Mass per portion', '125 g', '125 g'],
          ],
        },
        links: [{label: 'Scale two ingredient quantities together', href: '/ratio-calculator#mode-scale'}],
      },
      {
        title: 'Check equivalent ratios by multiplication, not addition',
        paragraphs: [
          'The ratios 3:5, 6:10 and 360:600 are equivalent: both terms have been multiplied by the same factor. Adding the same number to each term usually changes the relationship. Adding 3 to 3:5 gives 6:8, which simplifies to 3:4.',
          'For positive terms, cross products offer another check. The ratios 3:5 and 6:10 match because 3 × 10 = 5 × 6 = 30. But 3:5 and 6:8 do not match: 3 × 8 = 24 while 5 × 6 = 30. Simplify each pair if you want a direct comparison of their reduced forms.',
        ],
        links: [{label: 'Check the simplified form of a ratio', href: '/ratio-calculator#mode-simplify'}],
      },
      {
        title: 'Decide how to handle indivisible items and rounding',
        paragraphs: [
          'Sharing 20 identical items in the ratio 3:2 gives 12 and 8 items. Sharing 22 in the same ratio gives mathematical shares of 13.2 and 8.8. If the items cannot be divided, an exact 3:2 split is impossible for that total. Allocating 13 and 9 preserves the count of 22 but changes the ratio to 13:9.',
          'For money or measured materials, keep full precision through the calculation and round only to the unit you can actually allocate. Check that the rounded shares still add to the intended total. If they do not, agree how the remainder will be assigned; the arithmetic alone does not select that policy.',
          'These examples were constructed for this guide. The references explain ratios and proportions; they do not prescribe the workshop allocation, recipe quantities or rounding agreement.',
        ],
        links: [
          {label: 'Work with exact fractional shares', href: '/fraction-calculator#mode-arithmetic'},
          {label: 'OpenStax: ratios and rates', href: 'https://openstax.org/books/prealgebra-2e/pages/5-6-ratios-and-rate'},
          {label: 'OpenStax: proportions and their applications', href: 'https://openstax.org/books/prealgebra-2e/pages/6-5-solve-proportions-and-their-applications'},
        ],
      },
    ],
  },
};
