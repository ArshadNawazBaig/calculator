import finance from '@/data/insights/finance.json';
import health from '@/data/insights/health.json';
import math from '@/data/insights/math.json';
import everyday from '@/data/insights/everyday.json';
import type {Locale} from './i18n/config';

export type Insight = {heading: string; body: string};
export const calculatorInsights = {...finance, ...health, ...math, ...everyday} as Record<string, Record<Locale, Insight>>;
