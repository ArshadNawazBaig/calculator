import finance from '@/data/calculator-examples/finance.json';
import math from '@/data/calculator-examples/math.json';
import health from '@/data/calculator-examples/health.json';
import everyday from '@/data/calculator-examples/everyday.json';

type ExampleRow = ({input: string; label?: never} | {label: string; input?: never}) & {calculation: string; result: string};

export type CalculatorExample = {
  title: string;
  notation: string;
  inputHeading: string;
  resultHeading: string;
  given?: {label: string; value: string}[];
  rows: ExampleRow[];
  note?: string;
};

export const calculatorExamples: Record<string, CalculatorExample> = {...finance, ...math, ...health, ...everyday};
export const exampleImage = (slug: string) => `/illustrations/examples/${slug}.webp`;
