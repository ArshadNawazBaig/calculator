import type {InfoPage} from '../information';

export const payAndBorrowingGuideCalculators: Record<string, string[]> = {
  'hourly-vs-salary-pay-comparison': ['salary-calculator', 'take-home-pay-calculator', 'hours-calculator'],
  'compare-loan-offers-apr-fees': ['apr-calculator', 'loan-calculator', 'personal-loan-calculator', 'interest-rate-calculator'],
};

export const payAndBorrowingGuides: Record<string, InfoPage> = {
  'hourly-vs-salary-pay-comparison': {
    title: 'Hourly vs Salary: Compare Pay, Hours and Unpaid Leave',
    description: 'Compare an hourly offer with an annual salary using the same work schedule. Account for unpaid days, pay frequency and full-time-equivalent salary.',
    sections: [
      {title: 'Put both offers on the same annual basis', paragraphs: [
        'Consider two illustrative offers: Offer A pays $30 per hour for a scheduled 40-hour week; Offer B pays a fixed $60,000 annual salary for the same schedule. Assume five eight-hour days per week, no overtime or bonuses, and a 52-week comparison year. These are constructed examples, not market salary estimates.',
        'At first, Offer A appears higher: $30 × 40 × 52 = $62,400, compared with $60,000 for Offer B. The difference is $2,400 before taxes and deductions. But that comparison assumes every scheduled hour in Offer A is paid. Leave arrangements can change the result.',
        'In Pay conversion, enter Pay amount 30, Pay period Hourly, Hours per week 40, Days per week 5 and Unpaid leave days per year 0. For the second offer, change the amount to 60000 and the period to Annually. The displayed hourly equivalent for that salary is $60,000 ÷ 2,080 = about $28.85.',
      ], links: [{label: 'Compare hourly and annual pay', href: '/salary-calculator#mode-salary'}]},
      {title: 'Unpaid days can reverse the comparison', paragraphs: [
        'Suppose both arrangements include 15 days away from work, but those days are unpaid in Offer A and paid within the fixed salary in Offer B. Offer A loses 15 × 8 = 120 paid hours. Its modeled earnings become (2,080 − 120) × $30 = $58,800. Offer B remains $60,000 because its leave is paid. Under these assumptions, Offer B pays $1,200 more over the year.',
        'Set Unpaid leave days per year to 15 for Offer A. Keep it at 0 for Offer B: entering paid vacation as unpaid would incorrectly reduce the fixed salary. Read Annual pay after unpaid leave for the adjusted comparison. The gross conversion table continues to show the schedule before that adjustment.',
      ], table: {caption: 'Same scheduled hours, different leave arrangements; all amounts are gross', headers: ['Item', 'Offer A: $30 per hour', 'Offer B: $60,000 salary'], rows: [
        ['Scheduled hours in 52 weeks', '2,080', '2,080'],
        ['Days away from work', '15 unpaid', '15 paid'],
        ['Gross annualized amount before adjustment', '$62,400', '$60,000'],
        ['Reduction for unpaid days', '$3,600', '$0'],
        ['Modeled annual earnings', '$58,800', '$60,000'],
      ]}},
      {title: 'Find the hourly rate that matches the annual offer', paragraphs: [
        'With 15 unpaid eight-hour days, the hourly offer has 1,960 paid hours. To match $60,000 gross, divide $60,000 by 1,960: the break-even rate is about $30.612245 per hour. A rate rounded to $30.61 produces $59,995.60, so it falls $4.40 short; $30.62 produces $60,015.20. This is a useful case for keeping the unrounded calculation until the final comparison.',
        'Change Pay amount in the hourly scenario to check either rate, leaving its schedule and unpaid days unchanged. Benefits, retirement contributions, travel costs, job stability and any extra compensation remain separate. Matching gross earnings does not establish that two offers have the same overall value.',
      ], links: [{label: 'Test the hourly rate and unpaid-day assumptions', href: '/salary-calculator#mode-salary'}]},
      {title: 'A larger paycheck may just mean fewer paychecks', paragraphs: [
        'At a fixed $60,000 annual salary, semimonthly pay is $60,000 ÷ 24 = $2,500 per payment. Biweekly pay is $60,000 ÷ 26 = about $2,307.69 per payment. Semimonthly looks larger per check, but both totals represent the same annual pay in this model. Monthly pay is $5,000.',
        'Biweekly means once every two weeks; semimonthly means twice per month. The calculator uses 26 and 24 periods, respectively. A real payroll calendar can have a different number of pay dates, so use the employer’s calendar when planning actual cash receipts. These conversions do not determine tax withholding or deductions.',
      ], table: {caption: 'Equivalent pay for the same $60,000 gross annual salary', headers: ['Frequency', 'Modeled payments per year', 'Gross payment'], rows: [
        ['Biweekly', '26', '$2,307.69'], ['Semimonthly', '24', '$2,500.00'], ['Monthly', '12', '$5,000.00'],
      ]}, links: [{label: 'Compare pay periods', href: '/salary-calculator#mode-schedule-units'}]},
      {title: 'Separate full-time-equivalent salary from actual earnings', paragraphs: [
        'Full-time-equivalent salary expresses a part-time offer at a chosen full-time schedule. If the reference is 40 hours per week, a 30-hour schedule is 30 ÷ 40 = 0.75 full-time equivalent. An actual $45,000 annual salary at that schedule has a $45,000 ÷ 0.75 = $60,000 full-time equivalent. It still pays $45,000; the comparison does not create extra hours or income.',
        'To reproduce this with Pay conversion, enter 45000 Annually with 30 hours per week. Its hourly equivalent is about $28.846154. Enter that unrounded hourly rate with 40 hours per week to obtain approximately $60,000. Use the same paid-week and leave assumptions in both steps. The full-time reference may differ by employer or country.',
        'Hours also matter for a fixed annual offer. At $60,000, a 40-hour week gives a gross scheduled-hour equivalent of about $28.85. At 45 hours it becomes $60,000 ÷ (45 × 52) = about $25.64. That arithmetic does not decide overtime eligibility or the legally defined regular rate of pay.',
      ]},
      {title: 'Check the inputs that the salary conversion cannot supply', paragraphs: [
        'Confirm expected hours, which days are paid, the number of pay periods, and whether bonuses or other payments are guaranteed before comparing offers. Compare gross figures first; then assess deductions and benefits separately. If the work pattern varies, use realistic paid hours instead of assuming every week is identical.',
        'The U.S. Bureau of Labor Statistics uses 2,080 hours as a standard year-round, full-time conversion for many occupational wage statistics. That supports the arithmetic convention, not an assumption that every job provides 2,080 paid hours. The examples in this guide use an explicit schedule so you can replace it with your own.',
      ], links: [
        {label: 'BLS: hourly and annual wage calculation methods', href: 'https://www.bls.gov/opub/hom/oews/calculation.htm'},
        {label: 'Estimate US take-home pay separately', href: '/take-home-pay-calculator'},
        {label: 'Measure hours in a shift', href: '/hours-calculator'},
      ]},
    ],
  },
  'compare-loan-offers-apr-fees': {
    title: 'Compare Loan Offers: APR, Fees and Total Repayment',
    description: 'Compare loans using the same net cash received. Follow a fee-adjusted APR example, then see how a longer term lowers payments while raising total cost.',
    sections: [
      {title: 'Compare the same amount of usable cash', paragraphs: [
        'A fair cash-flow comparison starts with how much money is available after upfront charges. Consider two illustrative fixed-rate loans that each leave $10,000 available to the borrower. Both have 36 equal monthly installments, no other charges and no early repayment.',
        'Offer A has a $10,300 loan amount, a 6% nominal annual interest rate and a flat $300 fee deducted from the proceeds. Net cash is $10,300 − $300 = $10,000. Offer B has a $10,000 loan amount, a 7% nominal annual rate and no upfront fee. It also provides $10,000. These are constructed examples, not current lending offers.',
        'Using a $10,000 face amount for Offer A while deducting its $300 fee would provide only $9,700. Comparing that payment directly with Offer B would mix financing cost with a different amount of usable cash.',
      ]},
      {title: 'A lower interest rate can have a higher modeled APR', paragraphs: [
        'In Loan APR mode, enter Loan amount 10300, Annual interest rate 6, Term 3 years and Upfront financing charges 300 for Offer A. Its monthly payment is about $313.35. The discount rate matching $10,000 received today to those 36 payments produces a modeled nominal APR of about 8.00%.',
        'For Offer B, enter Loan amount 10000, Annual interest rate 7, Term 3 years and charges 0. Its payment is about $308.77 and modeled nominal APR is 7.00%. The rate written on Offer A is lower, but its fee and larger amount repaid change the comparison.',
        'Both modeled APRs assume regular monthly payments. The calculator’s nominal APR multiplies the monthly cash-flow discount rate by 12. Required disclosure rules can use specific fee classifications and timing conventions; the examples do not certify a legally required APR.',
      ], table: {caption: 'Equal net cash and equal terms; payments and APRs rounded for display', headers: ['Item', 'Offer A', 'Offer B'], rows: [
        ['Loan amount before fee', '$10,300', '$10,000'],
        ['Upfront fee deducted', '$300', '$0'],
        ['Net cash available', '$10,000', '$10,000'],
        ['Nominal annual interest rate', '6%', '7%'],
        ['Term', '36 monthly payments', '36 monthly payments'],
        ['Monthly payment', '$313.35', '$308.77'],
        ['Modeled nominal APR', '8.00%', '7.00%'],
      ]}, links: [{label: 'Compare the two offers in the APR calculator', href: '/apr-calculator#mode-apr'}]},
      {title: 'Check total repayment without counting the fee twice', paragraphs: [
        'Using full-precision payments, Offer A totals $11,280.45 across 36 installments; Offer B totals $11,115.75. Subtract the equal $10,000 net cash received to obtain modeled borrowing costs of $1,280.45 and $1,115.75. Offer B costs $164.70 less over the full term in this example.',
        'The $300 fee in Offer A is already reflected in the gap between the $10,300 amount repaid and the $10,000 available to spend. Do not add it again to total payments minus net proceeds. If a real fee is paid separately rather than withheld, write down the initial cash flows before applying the comparison.',
        'The displayed monthly payments are rounded to cents. Totals here use the unrounded formula payments, so multiplying the displayed cents by 36 can differ slightly. Actual lender schedules may round each installment and adjust the last payment.',
      ], links: [{label: 'Inspect payments and total scheduled cost by frequency', href: '/loan-calculator#mode-frequencies'}]},
      {title: 'A smaller monthly payment can increase total cost', paragraphs: [
        'Now keep Offer B’s $10,000 principal, 7% rate and zero fee, but extend repayment from 3 years to 5 years. Its monthly payment falls from about $308.77 to $198.01. Total payments increase from about $11,115.75 to $11,880.72, adding roughly $765 to the borrowing cost.',
        'The modeled APR remains 7% because the rate and fee assumptions are unchanged. APR alone does not state how many years interest is paid. Check payment affordability and total cost as separate figures rather than treating a lower payment as evidence of a cheaper loan.',
      ], table: {caption: 'Term comparison for a $10,000 loan at 7% with no upfront fee', headers: ['Term', 'Monthly payment', 'Total payments', 'Payments less principal'], rows: [
        ['36 months', '$308.77', '$11,115.75', '$1,115.75'],
        ['60 months', '$198.01', '$11,880.72', '$1,880.72'],
      ]}, links: [{label: 'Change the term while keeping the other assumptions fixed', href: '/loan-calculator#mode-loan'}]},
      {title: 'When only a monthly payment is known', paragraphs: [
        'A payment by itself is not enough to identify an APR. You also need the amount received, number and timing of payments, and fee treatment. If you know principal, a fixed monthly payment and term, the Interest Rate Calculator can solve the implied nominal annual loan rate under its equal-payment assumptions.',
        'For example, a $10,000 principal with 36 payments of $308.77 implies approximately 7% nominal annually. In Implied rate, enter Loan amount 10000, Term 3 years and Monthly payment 308.77. That tool does not accept financing fees or irregular payment dates, so its answer is not automatically a fee-inclusive disclosure APR. Use Loan APR when the stated rate and upfront charges are known.',
      ], links: [{label: 'Solve an implied rate from principal and monthly payment', href: '/interest-rate-calculator#mode-rate'}]},
      {title: 'Use the actual offer terms for the final comparison', paragraphs: [
        'Record the loan amount, net cash received, rate, relevant fees, payment frequency, term and total scheduled repayment for each offer. Confirm whether the rate can change and what happens on early repayment. The fixed-payment examples here do not model variable rates, missed payments, extra charges or insurance.',
        'The CFPB explains why comparing only the monthly payment can hide a longer and more expensive loan, and why APR can include financing charges beyond interest. Its mortgage guidance also warns that different loan structures can make APR comparisons misleading. Those references support the comparison principles; the numerical offers above were created for this guide.',
      ], links: [
        {label: 'CFPB: compare loan amounts, terms, APRs and payments', href: 'https://www.consumerfinance.gov/ask-cfpb/how-do-i-compare-auto-loan-offers-what-should-i-look-at-besides-the-monthly-payment-en-753/'},
        {label: 'CFPB: interest rate versus APR', href: 'https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-mortgage-interest-rate-and-an-apr-en-135/'},
        {label: 'How Finflo checks calculations', href: '/methodology'},
      ]},
    ],
  },
};
