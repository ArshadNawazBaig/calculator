import type {Mode} from '@/lib/calculators/types';
import type {CategoryId} from '@/lib/site';

// Match stable calculation algorithms, never translated titles. Related methods
// share a symbol when they represent the same task; the visible label identifies
// the exact method.
const algorithmGroups = {
  Activity: ['tdee', 'activity-energy', 'macro-energy', 'activity-distance', 'pace'],
  ArrowDownUp: ['equivalent-rate', 'equivalent-nominal-rate', 'tax-gain'],
  ArrowLeftRight: ['currency', 'base-convert', 'base-convert-hex', 'food-energy', 'pace-convert', 'height-units', 'power-units', 'data-units', 'shoe-regions', 'bra-regions', 'dress-regions'],
  ArrowRightLeft: ['simple-inverse', 'log-inverse', 'dew-inverse', 'density-inverse', 'molarity-inverse'],
  Atom: ['half-life', 'half-life-solve', 'half-life-inverse', 'decay-constants'],
  Baby: ['bmi-child', 'lean-pediatric', 'gfr-child', 'pregnancy-conception', 'tax-child-credit', 'tax-basic-actc'],
  BadgeCheck: ['program-policy', 'army-ratio-2026', 'army-fat', 'course-handicap'],
  Banknote: ['loan', 'mortgage', 'mortgage-uk', 'auto-loan', 'financing-lease', 'lease', 'heloc', 'program-loan', 'tvm', 'nominal-tvm', 'present-value', 'pension', 'salary', 'income-gdp'],
  BanknoteArrowDown: ['annuity-payout', 'early-withdrawal', 'rmd', 'fund-exit-load'],
  Binary: ['base-2', 'base-16', 'big-integer'],
  BookOpen: ['activity-references', 'bsa-research', 'lean-comparison', 'nec-2017'],
  Box: ['convert-volume', 'concrete-slab', 'mass', 'molarity-mass'],
  BriefcaseBusiness: ['tax-self-employment', 'tax-qbi-2026', 'tax-qbi-section68', 'tax-niit'],
  Calculator: ['big-expression', 'decimal-arithmetic', 'scientific-arithmetic', 'time-arithmetic'],
  CalendarDays: ['loan-frequencies', 'salary-units', 'pension-streams', 'social-streams', 'withdrawal-frequency', 'owner-rmd', 'dated-bond', 'bond-day-count', 'early-distribution', 'book-depreciation', 'social-fra', 'business-days', 'pregnancy-lmp', 'roman-date'],
  CalendarPlus: ['date-add', 'business-add', 'calendar-add', 'datetime-add'],
  CalendarRange: ['dated-loan', 'date-difference', 'dated-duration', 'calendar-count', 'pregnancy-reverse', 'refinance-horizon'],
  ChartColumn: ['grade-categories', 'grade-points', 'golf-rounds', 'golf-mixed'],
  ChartLine: ['slope', 'slope-endpoint', 'average-return', 'dated-roi', 'dated-irr', 'regular-irr', 'irr', 'stock-margin', 'fx-margin'],
  ChartNoAxesCombined: ['probability-series', 'growing-payback', 'retire-salary', 'salary-401k'],
  ChartPie: ['macros', 'margin', 'retail-margin', 'body-fat', 'bodyfat-bmi', 'percent-what', 'probability'],
  CheckCheck: ['payoff', 'debt-payoff', 'debt-budget-ledger'],
  Circle: ['floor-circle', 'gravel-circle', 'concrete-tube', 'tires', 'tire-target'],
  CirclePercent: ['apr', 'percent-base'],
  CircuitBoard: ['ohm', 'resistors', 'voltage-impedance', 'resistor-colors', 'resistor-bands'],
  ClipboardList: ['ownership-lines', 'hud-mip-ledger', 'budget-lines', 'time-card', 'shift-card', 'tax-itemization-2026', 'tax-estate-lines', 'tax-ordinary-detailed', 'tax-standard-expanded'],
  Clock3: ['clock-duration', 'sleep-duration', 'convert-time', 'pace-time', 'time-zone', 'duration-expression'],
  ClockArrowRight: ['deferred', 'pv-timing', 'pace-finish', 'fund-longevity'],
  Coins: ['commission', 'commission-inverse', 'commission-tiers', 'rental', 'rental-holding', 'gdp'],
  Columns3: ['concrete-column', 'normal-between', 'normal-interval'],
  CreditCard: ['personal-cashcost', 'fund-loads', 'heloc-fees', 'toolkit-payment'],
  Database: ['convert-data', 'bandwidth-hosting'],
  Dice5: ['probability-solver', 'sample-size'],
  Divide: ['fraction', 'fraction-simplify', 'long-division', 'division-steps'],
  Droplets: ['gfr-adult', 'molarity', 'dew-point', 'heat-dew'],
  Dumbbell: ['calories-burned', 'lean-fat', 'lean-boer'],
  EqualApproximately: ['round', 'round-increment', 'margin-error', 'confidence-interval'],
  FileCode: ['base64', 'base64-charset', 'scientific-notation'],
  FileText: ['tax-payroll-w4', 'annual-tax-pay', 'tax-paycheck-composed', 'bond', 'zero-bond'],
  Flag: ['golf-index', 'golf-differential'],
  Flame: ['bmr', 'heat-energy', 'convert-energy', 'electricity', 'electricity-load'],
  FlaskConical: ['pregnancy-ivf', 'molarity-units'],
  Footprints: ['shoe', 'pace-distance'],
  Fuel: ['fuel-metric', 'fuel-us', 'fuel-odometer'],
  Gauge: ['mpg', 'consumption', 'speed', 'convert-speed', 'horsepower', 'quarter-mile', 'convert-pressure'],
  GitCompareArrows: ['rebate-compare', 'refinance', 'rent-buy', 'rent-buy-streams', 'program-composed', 'consolidation-fee-comparison', 'equal-cost-ira', 'marriage-tax', 'tax-marriage-scenarios', 'tax-marriage-composed', 'fraction-compare', 'percent-difference', 'heart-rate-methods'],
  Globe2: ['currency-reference', 'currency-global', 'fixed-time-zone', 'great-circle', 'great-circle-dms'],
  GraduationCap: ['college', 'college-share', 'student-loan', 'student-borrowing', 'student-principal', 'tax-education-2026', 'tax-student-interest-2026', 'gpa', 'semester-gpa', 'grade', 'final-grade', 'grade-letter-final'],
  Grid2X2: ['tile', 'tile-procurement', 'ipv4-mask'],
  HandCoins: ['down-payment', 'down-price', 'vehicle-price', 'lease-price', 'tax-tips-2026', 'tax-eitc-estimate-2026'],
  HeartPulse: ['heart-rate', 'pregnancy-ultrasound', 'tax-additional-medicare'],
  History: ['cpi-historical', 'fha-historical-78', 'payback'],
  House: ['equity-capacity', 'affordability', 'house-budget', 'rent', 'rent-obligations', 'roof', 'roof-measured', 'btu', 'btu-design', 'heat-loss'],
  Hourglass: ['save-time'],
  Landmark: ['federal-tax', 'tax-federal-composed', 'tax-amt-base', 'estate-tax', 'tax-social-benefits', 'tax-senior-deduction'],
  Layers: ['dual-contributions', 'consolidation', 'concrete-stairs', 'stairs', 'stairs-rise-run', 'stairs-layout'],
  ListOrdered: ['sequence', 'nth-sequence', 'pace-splits', 'biweekly-inferred'],
  LockKeyhole: ['password'],
  MapPin: ['vehicle-state-tax', 'tax-car-interest-2026'],
  Maximize2: ['ratio-scale', 'floor-shapes'],
  MessageCircle: ['activity-talk-test'],
  Network: ['ipv4', 'ipv6'],
  Package: ['landscape-purchasing', 'roof-packages'],
  Percent: ['simple-interest', 'interest-only', 'down-percent', 'percent-of', 'percent-change', 'retail-tax'],
  PiggyBank: ['retirement-save', 'retirement-account', 'roth', 'ira-limit', 'ira-limit-2027', 'tax-ira-deduction-2026'],
  Plus: ['percent-adjust'],
  Proportions: ['proportion-all', 'body-ratios', 'bra', 'bra-legacy', 'fashion-ffit', 'bsa'],
  Radical: ['normal-inverse'],
  Ratio: ['ratio', 'dti'],
  Receipt: ['sales-tax', 'tax-payroll-fica', 'toolkit-stripe'],
  Repeat2: ['annuity', 'cycle'],
  RotateCcw: ['percent-reverse-change'],
  Route: ['distance'],
  Ruler: ['convert-length', 'floor-measured', 'concrete-measured', 'mass-units', 'speed-units', 'pace-units', 'ohm-units', 'wind-units', 'fuel-units', 'power-work-units', 'transfer-units', 'website-units', 'food-energy-units', 'parent-height-units', 'wire-gauge'],
  Scale: ['bmi', 'ideal-weight', 'weight', 'density', 'convert-mass'],
  ShieldCheck: ['social-security'],
  Sigma: ['z-score', 'p-value'],
  SlidersHorizontal: ['password-uniform'],
  Square: ['floor-area', 'convert-area', 'landscape', 'landscape-area'],
  SquareFunction: ['log'],
  SquareSigma: ['normal-tails'],
  Store: ['toolkit-seller', 'toolkit-etsy'],
  Sun: ['heat-index', 'temperature', 'sleep'],
  Tag: ['discount', 'retail-discount', 'sequential-discount', 'margin-target'],
  Target: ['retirement-target', 'roi'],
  Thermometer: ['wind-chill'],
  Timer: ['tax-overtime-2026'],
  TrendingDown: ['depreciation'],
  TrendingUp: ['growth', 'inflation'],
  Type: ['roman', 'grade-letters'],
  Users: ['height', 'tax-care-2026'],
  Utensils: ['protein'],
  Variable: ['proportion'],
  Wallet: ['budget'],
  Weight: ['bac-unit-single', 'bac-unit-rows'],
  Wifi: ['bandwidth', 'website-bandwidth'],
  Wine: ['bac', 'bac-beverages'],
  Zap: ['power-work', 'convert-power', 'voltage-drop', 'conductor-resistance'],
} satisfies Partial<Record<keyof typeof import('lucide-react'), readonly string[]>>;

type IconName = keyof typeof algorithmGroups;
export const modeIconNames = Object.keys(algorithmGroups) as IconName[];

export const calculationAlgorithmIcons: Readonly<Record<string, IconName>> = Object.fromEntries(
  Object.entries(algorithmGroups).flatMap(([name, algorithms]) => algorithms.map(algorithm => [algorithm, name as IconName])),
);

const categoryIcons: Record<CategoryId, IconName> = {
  finance: 'Landmark', health: 'HeartPulse', math: 'Calculator', everyday: 'SlidersHorizontal',
};

export function calculationModeIconName({slug, mode, category}: {
  slug: string; mode: Pick<Mode, 'id' | 'algorithm'>; category: CategoryId;
}): IconName {
  // Retirement longevity is a time horizon, distinct from the monthly payment.
  if (slug === 'retirement-calculator' && mode.id === 'longevity') return 'Hourglass';
  return calculationAlgorithmIcons[mode.algorithm] || categoryIcons[category];
}
