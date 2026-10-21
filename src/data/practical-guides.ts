import type {InfoPage} from './information';

// These guides are published in English. Add a locale only when its complete
// article and tables are translated; the guide listings filter by availability.
export const practicalGuideCalculators: Record<string, string[]> = {
  'comparing-discounts-and-percentage-changes': ['percent-calculator', 'discount-calculator', 'percent-off-calculator'],
  'weighted-grades-and-final-exam-targets': ['grade-calculator', 'final-exam-grade-calculator'],
  'concrete-volume-and-order-allowance': ['concrete-calculator', 'volume-calculator'],
};

export const practicalGuides: Record<string, InfoPage> = {
  'comparing-discounts-and-percentage-changes': {
    title: 'Compare discounts by the amount you actually pay',
    description: 'Work through competing offers, coupon order, successive discounts, and reverse percentages with a reproducible shopping example.',
    sections: [
      {title: 'Compare two offers on the same item', paragraphs: [
        'Suppose the same item has a list price of $120 at two shops. Shop A offers 25% off. Shop B offers 20% off followed by a $10 coupon. Assume the item, delivery charges, and return terms are identical, and exclude tax for this first comparison. The larger advertised percentage does not settle which offer costs less.',
        'At Shop A, the discount is 120 × 0.25 = $30, leaving $90. At Shop B, 120 × 0.80 = $96, then the coupon reduces the price to $86. Shop B is $4 cheaper even though its advertised percentage is smaller. Its total saving is $34, or about 28.33% of the original $120.',
        'In the discount calculator, use Calculate with Original price 120, Percentage discount 25, Additional fixed discount 0, and Sales tax after discount 0 for Shop A. Change the percentage to 20 and the fixed discount to 10 for Shop B. Keeping the original price and tax assumption unchanged isolates the effect of the offer.',
      ], table: {caption: 'Two offers on a $120 item, before tax and delivery', headers: ['Offer', 'After percentage discount', 'After coupon', 'Total saving'], rows: [
        ['Shop A: 25% off', '$90.00', '$90.00', '$30.00'],
        ['Shop B: 20% off, then $10', '$96.00', '$86.00', '$34.00'],
      ]}, links: [{label: 'Compare these offers in the discount calculator', href: '/discount-calculator#mode-calculate'}]},
      {title: 'Coupon order can change the answer', paragraphs: [
        'Now keep Shop B’s numbers but change the order. Subtracting the $10 coupon first gives $110; taking 20% off that smaller base leaves $88. Applying the percentage first leaves $86. The $2 difference is 20% of the $10 coupon: the coupon itself gets reduced when the percentage is applied afterward.',
        'Finflo’s main discount mode applies the percentage first and the fixed discount second. If the offer uses the reverse order, enter the post-coupon price of 110 as Original price, use a 20% discount, and leave the fixed discount at zero. Check whether a coupon applies to the entire basket or only eligible items before treating either result as a checkout total.',
      ]},
      {title: 'Successive percentages multiply', paragraphs: [
        'An offer of 20% off followed by another 10% off leaves 80% of the original price, then 90% of that remainder. For $120, the calculation is 120 × 0.80 × 0.90 = $86.40. The combined discount is 28%, not 30%. Adding the percentages would incorrectly predict a price of $84.',
        'Use 1 − (1 − a) × (1 − b) for the combined discount when a and b are decimal fractions. Two pure percentage discounts give the same result in either order before rounding, but a fixed coupon does not have that property. If a shop rounds each line or each discount to cents, compare against its itemized receipt.',
      ]},
      {title: 'Recover the original price from a sale price', paragraphs: [
        'If an item costs $80 after a 20% reduction, $80 represents 80% of the original. Divide by 0.80 to recover $100. Adding 20% to $80 gives $96 because that calculation uses the smaller sale price as its base.',
        'The increase needed to return from $80 to $100 is $20 ÷ $80 = 25%. This is why a 20% fall and a 20% rise do not cancel. In Reverse a percentage change, enter Final value 80 and Signed change −20. A 100% reduction leaves zero regardless of the original price, so it cannot be reversed to a unique amount.',
      ], links: [{label: 'Recover an original value with the percentage calculator', href: '/percent-calculator#mode-reverse'}]},
      {title: 'Keep tax and delivery assumptions visible', paragraphs: [
        'For an illustrative 8% tax applied to the discounted price, Shop A totals 90 × 1.08 = $97.20 and Shop B totals 86 × 1.08 = $92.88. The difference becomes $4.32. If Shop A offers free delivery and Shop B charges $6 for delivery, Shop B’s combined cost becomes $98.88, making it $1.68 more expensive overall.',
        'The 8% rate is an example, not a rate lookup or a statement about how a particular coupon is taxed. Finflo applies your entered tax rate after both discounts and excludes shipping. Use the actual checkout’s treatment of coupons, taxes, and delivery when you compare a real purchase.',
      ]},
      {title: 'Check the comparison before choosing', paragraphs: [
        'Write down the original price, the order of discounts, which items qualify, and the final payable amount. An apparently better discount can lose its advantage when minimum-spend rules or delivery costs change. For a fair comparison, use the same quantity and product variant at each shop.',
        'These scenarios were constructed for this guide. The reference below explains the underlying percentage arithmetic; it does not supply the shop offers or determine their terms.',
      ], links: [{label: 'OpenStax: understand percent', href: 'https://openstax.org/books/prealgebra-2e/pages/6-1-understand-percent'}, {label: 'How Finflo checks calculations', href: '/methodology'}]},
    ],
  },
  'weighted-grades-and-final-exam-targets': {
    title: 'Turn a current grade into a realistic final-exam target',
    description: 'Distinguish completed-work averages from course points, calculate the final score you need, and see how exam weight changes what is possible.',
    sections: [
      {title: 'Start with the syllabus weights', paragraphs: [
        'Consider a course with homework worth 30%, a midterm worth 40%, and a final exam worth 30%. Your homework average is 90% and your midterm score is 80%; the final has not been graded. This example assumes these three categories make up the whole course and that no score is dropped, replaced, curved, or given extra credit.',
        'Homework has contributed 90 × 0.30 = 27 points toward the final course percentage. The midterm has contributed 80 × 0.40 = 32 points. You have earned 59 course percentage points from the 70% of the course completed so far. The remaining 30 points depend on the final.',
      ], table: {caption: 'A course with an ungraded final exam', headers: ['Category', 'Course weight', 'Score', 'Course points earned'], rows: [
        ['Homework', '30%', '90%', '27'], ['Midterm', '40%', '80%', '32'], ['Final exam', '30%', 'Ungraded', 'Not yet earned'],
      ]}},
      {title: 'Why the current average is 84.29%, not 59%', paragraphs: [
        'The completed-work average is 59 ÷ 0.70 = 84.2857%. It describes performance on the work already graded. The 59 figure instead measures points earned toward the entire course. Both are useful, but they answer different questions.',
        'In Category weights & what-if grades, enter Homework with weight 30 and score 90, Midterm with weight 40 and score 80, and Final exam with weight 30 and a blank score. A blank means ungraded; zero means an actual scored zero. Clear any example what-if value if you only want to inspect completed work.',
        'Do not enter 59 as Current grade in the final-exam calculator. That field expects the average on completed work. Using 59 would count the unfinished final against you twice. Keep the unrounded 84.2857142857 value when transferring this example; rounding it to 84.29 slightly changes the required score.',
      ], links: [{label: 'Enter the three categories in the grade calculator', href: '/grade-calculator#mode-categories'}]},
      {title: 'Solve for the score you need', paragraphs: [
        'To finish with 85%, the final must contribute another 85 − 59 = 26 course points. Because the exam is worth 30%, its required score is 26 ÷ 0.30 = 86.6667%. Check the answer by substitution: 59 + 0.30 × 86.6667 is approximately 85.',
        'In general, required final score = [target − current average × (1 − final share)] ÷ final share. Enter a current average of 84.2857142857, a target of 85, and a final weight of 30 in Required final score. The calculator uses the percentage weight as a fraction internally.',
      ], table: {caption: 'Targets for the same 59 earned course points and 30% final', headers: ['Target course grade', 'Required final score', 'Interpretation'], rows: [
        ['80%', '70%', '21 additional course points'],
        ['85%', '86.67%', '26 additional course points'],
        ['90%', '103.33%', 'Exceeds a 100% exam maximum'],
      ]}, links: [{label: 'Calculate a final-exam target', href: '/final-exam-grade-calculator#mode-final'}]},
      {title: 'An impossible target is useful information', paragraphs: [
        'With 59 course points already earned, a perfect final adds 30, producing a maximum overall grade of 89%. A 90% target therefore needs more than a perfect final under this model. That result is not a prediction of failure; it identifies a limit in the weights and scores you supplied.',
        'Check whether the syllabus has a replacement exam, dropped assessment, extra-credit provision, or a different final weight. If it does, model the actual rule before relying on the result. The calculator cannot infer an instructor’s policy or promise that a rounded score will cross a grade boundary.',
      ]},
      {title: 'Measure how much the final can move your grade', paragraphs: [
        'Every extra point on a final worth 30% adds 0.30 points to the course grade. Increasing the exam score from 80% to 90% raises the overall grade from 83% to 86%. This gives a practical scale for judging how much a change in exam performance can affect the outcome.',
        'The same ten-point exam improvement would move a course grade by only one point if the exam were worth 10%. Always compare scenarios using the same course weights; changing both the exam score and its weight makes it harder to tell what caused the difference.',
      ]},
      {title: 'Know when this worksheet does not apply', paragraphs: [
        'A points-based course uses total earned points divided by total possible points. It does not necessarily assign equal importance to category percentages. Use the Earned and possible points mode for that system. If a gradebook already includes missing work as zeros, reconstruct the completed-work average before using it to solve for an unfinished final.',
        'These are numerical examples, not school grading rules. The weighted-mean reference below explains the arithmetic. Your syllabus and instructor determine category weights, letter cutoffs, rounding, and treatment of missing work.',
      ], links: [{label: 'OpenStax: weighted mean', href: 'https://openstax.org/books/principles-finance/pages/13-1-measures-of-center'}, {label: 'Explore student calculators', href: '/calculators/students'}]},
    ],
  },
  'concrete-volume-and-order-allowance': {
    title: 'From slab dimensions to a concrete quantity estimate',
    description: 'Follow a 20-by-10-foot slab from mixed units to cubic yards, compare thickness and allowance scenarios, and separate material quantity from delivery cost.',
    sections: [
      {title: 'Describe the shape before entering dimensions', paragraphs: [
        'This example estimates a rectangular slab 20 feet long, 10 feet wide, and 4 inches thick. The dimensions are chosen to demonstrate arithmetic; they are not a recommendation for slab thickness or structural design. Assume a uniform depth, straight sides, and no thickened edges, footings, openings, or embedded objects.',
        'Length and width describe area. Multiplying that area by thickness produces volume only after the three dimensions use the same length unit. Entering 4 as feet instead of inches would make this estimate twelve times too large.',
      ]},
      {title: 'Convert the thickness before multiplying', paragraphs: [
        'Four inches is 4 ÷ 12 = one-third of a foot. The slab therefore has a net geometric volume of 20 × 10 × (4 ÷ 12) = 66.6667 cubic feet. One cubic yard contains 3 × 3 × 3 = 27 cubic feet, so divide by 27 to obtain 2.4691 cubic yards.',
        'In Slab or rectangular footing, enter Length 20, Width 10, Thickness 4, and Extra allowance 0 to check the net volume. For dimensions measured in different systems, use Mixed-unit shapes, quantity & cost and select the unit beside each measurement. Convert using the unrounded dimensions and round the result at the end.',
      ], table: {caption: 'Unit steps for the example slab', headers: ['Step', 'Calculation', 'Result'], rows: [
        ['Area', '20 ft × 10 ft', '200 ft²'], ['Thickness', '4 in ÷ 12', '0.333333… ft'], ['Net volume', '200 ft² × (4/12) ft', '66.6667 ft³'], ['Cubic yards', '66.6667 ft³ ÷ 27', '2.4691 yd³'],
      ]}, links: [{label: 'Calculate the slab volume', href: '/concrete-calculator#mode-slab'}]},
      {title: 'Keep an allowance separate from net geometry', paragraphs: [
        'An allowance increases the estimated quantity without changing the shape’s net volume. With an illustrative 10% allowance, multiply 2.4691358 by 1.10 to obtain 2.7160 cubic yards. The added amount is 0.2469 cubic yards. Do not add ten cubic yards or multiply by ten; the percentage represents a fraction of the net volume.',
        'The table compares assumptions, not recommended ordering margins. Actual needs depend on measured forms, base irregularities, placement losses, and supplier practices. Confirm an appropriate quantity and delivery increment with the people responsible for the job.',
      ], table: {caption: 'Allowance scenarios for the same 4-inch slab', headers: ['Allowance assumption', 'Net volume', 'Volume with allowance'], rows: [
        ['0%', '2.4691 yd³', '2.4691 yd³'], ['5%', '2.4691 yd³', '2.5926 yd³'], ['10%', '2.4691 yd³', '2.7160 yd³'],
      ]}},
      {title: 'A small depth change can exceed the allowance', paragraphs: [
        'If the average depth is 4.5 inches rather than 4 inches, net volume rises to 20 × 10 × (4.5 ÷ 12) ÷ 27 = 2.7778 cubic yards. That is a 12.5% increase because volume scales directly with thickness when area stays constant.',
        'Notice that 2.7778 cubic yards is already greater than the 2.7160 cubic yards produced by adding 10% to the original 4-inch estimate. An allowance cannot reliably correct a systematically understated measurement. Measure the form and base, split irregular shapes into appropriate sections, and avoid double-counting overlapping areas.',
        'To compare the two depths, calculate the 4-inch slab with zero allowance, use the calculator’s scenario comparison to keep that result, then change thickness to 4.5 and calculate again. Keeping length, width, and allowance fixed reveals the effect of depth alone.',
      ]},
      {title: 'Use the quoted volume unit for material cost', paragraphs: [
        'For an illustrative price of $160 per cubic yard, the 4-inch slab with a 10% allowance has a volume-based material estimate of 2.716049… × 160 = $434.57. Use the unrounded volume in the multiplication. The $160 rate is an invented example, not a current supplier quote.',
        'In Mixed-unit shapes, quantity & cost, select Slab; enter 20 ft, 10 ft, and 4 in; set quantity to 1 and allowance to 10%; enter price 160 with volume price unit yd3 and price volume Including allowance. Selecting Net geometry instead would price 2.469135… cubic yards, or $395.06, and omit the allowance from the cost.',
        'A delivery invoice may also include a minimum order, quantity rounding, delivery, short-load charges, waiting time, taxes, or other services. This worksheet multiplies volume by a rate. It cannot confirm availability, a delivered price, mix specifications, or the suitability of the design.',
      ], links: [{label: 'Estimate quantity and volume-based material cost', href: '/concrete-calculator#mode-measured'}]},
      {title: 'Check units again when the result looks wrong', paragraphs: [
        'A square-foot result measures surface area, while cubic feet and cubic yards measure volume. Divide cubic feet by 27, not by 3, to convert to cubic yards. For more than one identical item, apply quantity once. If you already combined all areas, do not also multiply by the number of items.',
        'The examples here use rectangular geometry and explicit assumptions so each step can be reproduced. NIST’s reference below supports the unit conversions; it is not a structural design guide or an ordering recommendation.',
      ], links: [{label: 'NIST: Guide to the SI', href: 'https://www.nist.gov/pml/special-publication-811'}, {label: 'Convert other volumes', href: '/volume-calculator'}]},
    ],
  },
};
