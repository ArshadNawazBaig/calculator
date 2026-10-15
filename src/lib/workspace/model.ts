import type {Field, Metric, Mode, Values} from '@/lib/calculators/types';
import {currencyLabel, isCurrency} from '@/lib/i18n/preferences';
import {movedStudentMode} from '@/lib/student-tools';

export const workspaceKey = 'finflo-workspace-v1';
export const maxSavedCalculations = 100;
export const maxBackupLength = 2_000_000;
export const privateTools = new Set(['password-generator', 'base64-encode-decode', 'url-encode-decode']);

export type SavedInput = {key: string; label: string; value: string; unit?: string};
export type SavedCalculation = {
  id: string; name: string; slug: string; title: string;
  modeId: string; modeTitle: string; algorithm: string;
  values: Values; inputs: SavedInput[]; metrics: Metric[]; labels: Record<string, string>;
  currency: string; currencyLabels: boolean; createdAt: string;
  expressionAnswer: number | null;
};
export type Workspace = {version: 1; favorites: string[]; calculations: SavedCalculation[]};
export const emptyWorkspace: Workspace = {version: 1, favorites: [], calculations: []};

/** Keep multi-row and multi-select inputs readable without exposing their JSON representation. */
export function summarizeInput(field: Field, value: string, t: (text: string) => string, currency?: string) {
  const translate = (label: string) => currency ? currencyLabel(label, currency, t) : t(label);
  const option = (value: string) => {const label = field.options?.find(item => item.value === value)?.label ?? value;return field.translateOptions === false ? label : translate(label);};
  if (field.type === 'select') return option(value);
  if (field.type === 'multiselect') return value.split(',').filter(Boolean).map(option).join(', ');
  if (field.type === 'rows' && field.rowColumns) {
    try {
      const rows: unknown = JSON.parse(value);
      if (Array.isArray(rows) && rows.every(object)) return rows.map((row, index) => `${index + 1}. ${field.rowColumns!.map(column => {
        const raw = row[column.key] ?? column.default ?? '';
        const cell = typeof raw === 'boolean' ? raw ? 'yes' : 'no' : String(raw);
        const display = column.type === 'select' ? translate(column.options?.find(item => item.value === cell)?.label ?? cell) : cell;
        return `${translate(column.label)}: ${display}`;
      }).join('; ')}`).join('\n');
    } catch { /* Only successful calculations can be saved; keep optional empty values intact. */ }
  }
  return value;
}

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max = 500): value is string => typeof value === 'string' && value.length <= max;
const identifier = (value: unknown): value is string => text(value, 100) && /^[a-zA-Z0-9_-]+$/.test(value);
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const optionalText = (value: unknown) => value === undefined || text(value, 20_000);

function isMetric(value: unknown): value is Metric {
  return object(value) && text(value.label) && (finite(value.value) || text(value.value, 20_000))
    && (value.format === undefined || ['number', 'money', 'percent'].includes(String(value.format)))
    && optionalText(value.unit) && optionalText(value.displayValue)
    && (value.digits === undefined || finite(value.digits) && Number.isInteger(value.digits) && value.digits >= 0 && value.digits <= 100)
    && (value.translateValue === undefined || typeof value.translateValue === 'boolean')
    && (value.numericText === undefined || typeof value.numericText === 'boolean');
}

export function isSavedCalculation(value: unknown): value is SavedCalculation {
  if (!object(value) || !identifier(value.id) || !identifier(value.slug) || privateTools.has(value.slug)
    || !text(value.name, 80) || !value.name.trim() || !text(value.title)
    || !identifier(value.modeId) || !text(value.modeTitle) || !identifier(value.algorithm)
    || !text(value.currency, 3) || !isCurrency(value.currency) || typeof value.currencyLabels !== 'boolean'
    || !text(value.createdAt, 40) || !Number.isFinite(Date.parse(value.createdAt))
    || !(value.expressionAnswer === null || finite(value.expressionAnswer))) return false;
  if (!object(value.values) || Object.keys(value.values).length > 150
    || !Object.entries(value.values).every(([key, entry]) => identifier(key) && !['__proto__', 'constructor', 'prototype'].includes(key) && text(entry, 50_000))) return false;
  if (!object(value.labels) || Object.keys(value.labels).length > 300 || !Object.entries(value.labels).every(([key, entry]) => text(key, 20_000) && text(entry, 20_000))) return false;
  if (!Array.isArray(value.inputs) || value.inputs.length > 150 || !value.inputs.every(input => object(input)
    && identifier(input.key) && text(input.label) && text(input.value, 50_000) && optionalText(input.unit))) return false;
  return Array.isArray(value.metrics) && value.metrics.length > 0 && value.metrics.length <= 100
    && value.metrics.every(isMetric) && JSON.stringify(value).length <= 100_000;
}

/** Validate the entire document before replacing any browser data. */
export function parseWorkspace(raw: string | null): Workspace | null {
  if (raw === null) return {...emptyWorkspace, favorites: [], calculations: []};
  if (raw.length > maxBackupLength) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value) || value.version !== 1 || !Array.isArray(value.favorites) || value.favorites.length > 250
      || !value.favorites.every(identifier) || !Array.isArray(value.calculations)
      || value.calculations.length > maxSavedCalculations || !value.calculations.every(isSavedCalculation)
      || new Set(value.calculations.map(item => item.id)).size !== value.calculations.length) return null;
    const calculations = value.calculations.map(item => {
      const slug = movedStudentMode(item.slug, item.modeId);
      return slug ? {...item, slug} : item;
    });
    return {version: 1, favorites: [...new Set(value.favorites)], calculations};
  } catch {return null;}
}

export function canCompare(first: SavedCalculation, next: SavedCalculation) {
  return first.slug === next.slug && first.modeId === next.modeId && first.algorithm === next.algorithm
    && first.currency === next.currency && first.currencyLabels === next.currencyLabels;
}

export function comparableMetric(first: Metric, next: Metric) {
  return first.label === next.label && first.format === next.format && first.unit === next.unit
    && !first.displayValue && !next.displayValue && finite(first.value) && finite(next.value);
}

/** Removed modes or changed field schemas must not silently load partial scenarios. */
export function restoreInputs(saved: SavedCalculation, mode: Mode): Values | null {
  if (saved.modeId !== mode.id || saved.algorithm !== mode.algorithm
    || Object.keys(saved.values).length !== mode.fields.length
    || mode.fields.some(field => !Object.hasOwn(saved.values, field.key)
      || field.type === 'select' && !field.options?.some(option => option.value === saved.values[field.key]))) return null;
  return Object.fromEntries(mode.fields.map(field => [field.key, saved.values[field.key]]));
}

export function mergeWorkspaces(current: Workspace, incoming: Workspace): Workspace | null {
  const calculations = new Map(current.calculations.map(item => [item.id, item]));
  for (const item of incoming.calculations) if (!calculations.has(item.id)) calculations.set(item.id, item);
  return parseWorkspace(JSON.stringify({version: 1, favorites: [...new Set([...current.favorites, ...incoming.favorites])], calculations: [...calculations.values()]}));
}
