import {afterEach, describe, expect, it, vi} from 'vitest';
import {canCompare, comparableMetric, emptyWorkspace, mergeWorkspaces, parseWorkspace, restoreInputs, summarizeInput, workspaceKey, type SavedCalculation} from '@/lib/workspace/model';
import {clearWorkspace, importWorkspace, saveCalculation, toggleFavorite} from '@/lib/workspace/store';
import {definitionMap} from '@/lib/calculators/registry';
import {defaults} from '@/lib/calculators/types';

const loan = definitionMap.get('loan-calculator')!.modes[0];
const saved: SavedCalculation = {
  id: 'scenario-a', name: 'First loan', slug: 'loan-calculator', title: 'Loan Calculator', modeId: loan.id,
  modeTitle: loan.title, algorithm: loan.algorithm, values: defaults(loan), inputs: [], labels: {},
  metrics: [{label: 'Monthly payment', value: 100, format: 'money'}], currency: 'USD', currencyLabels: true,
  expressionAnswer: null, createdAt: '2026-10-13T10:00:00.000Z',
};
const document = {...emptyWorkspace, calculations: [saved]};
function storage(raw: string | null = null, fails = false) {
  let value = raw;
  const setItem = vi.fn((_key: string, next: string) => {if (fails) throw Error('QuotaExceededError');value = next;});
  const removeItem = vi.fn(() => {value = null;});
  const dispatchEvent = vi.fn();
  vi.stubGlobal('window', {localStorage: {getItem: () => value, setItem, removeItem}, dispatchEvent});
  return {read: () => value, setItem, removeItem, dispatchEvent};
}
afterEach(() => vi.unstubAllGlobals());

describe('local workspace persistence', () => {
  it('preserves saved inputs while moving student modes to their new pages', () => {
    for (const [oldSlug, newSlug, modeId] of [['grade-calculator', 'final-exam-grade-calculator', 'final'], ['grade-calculator', 'final-exam-grade-calculator', 'letter-final'], ['gpa-calculator', 'gpa-goal-calculator', 'target']]) {
      const mode = definitionMap.get(newSlug)!.modes.find(mode => mode.id === modeId)!;
      const record = {...saved, slug: oldSlug, modeId, algorithm: mode.algorithm, values: defaults(mode)};
      const parsed = parseWorkspace(JSON.stringify({...emptyWorkspace, calculations: [record]}))!;
      expect(parsed.calculations[0]).toEqual({...record, slug: newSlug});
      expect(restoreInputs(parsed.calculations[0], mode)).toEqual(record.values);
    }
  });
  it('round trips exact input strings and unrounded result precision', () => {
    const item = {...saved, values: {...saved.values, rate: '4.125'}, metrics: [{label: 'Payment', value: 123.456789}]};
    const parsed = parseWorkspace(JSON.stringify({...document, calculations: [item]}))!;
    expect(parsed.calculations[0].metrics[0].value).toBe(123.456789);
    expect(restoreInputs(parsed.calculations[0], loan)?.rate).toBe('4.125');
  });
  it.each(['not json', '{"version":2}', JSON.stringify({...document, calculations: [{...saved, metrics: [{label: 'Bad', value: null}]}]}), JSON.stringify({...document, calculations: [{...saved, slug: 'password-generator'}]}), JSON.stringify({...document, calculations: [{...saved, id: '../other'}]}), JSON.stringify({...document, calculations: [saved, saved]})])('rejects corrupt, unsafe, or incompatible backups', raw => {
    const target = storage(JSON.stringify(document));
    expect(importWorkspace(raw)).toEqual({ok: false, error: 'backup'});
    expect(target.setItem).not.toHaveBeenCalled();
    expect(target.read()).toBe(JSON.stringify(document));
  });
  it('refuses to overwrite unreadable data during normal saves', () => {
    const target = storage('{broken');
    expect(toggleFavorite('loan-calculator')).toEqual({ok: false, error: 'invalid'});
    expect(target.setItem).not.toHaveBeenCalled();
  });
  it('reports storage failures without claiming success or notifying subscribers', () => {
    const target = storage(null, true);
    expect(saveCalculation(saved)).toEqual({ok: false, error: 'storage'});
    expect(target.read()).toBeNull();
    expect(target.dispatchEvent).not.toHaveBeenCalled();
  });
  it('merges backups idempotently and preserves existing names on id conflicts', () => {
    const incoming = {...emptyWorkspace, favorites: ['loan-calculator'], calculations: [{...saved, name: 'Old name'}, {...saved, id: 'scenario-b'}]};
    const once = mergeWorkspaces(document, incoming)!;
    expect(once.calculations).toHaveLength(2);
    expect(once.calculations[0].name).toBe('First loan');
    expect(mergeWorkspaces(once, incoming)).toEqual(once);
  });
  it('does not evict older calculations when the record limit is reached', () => {
    const full = {...document, calculations: Array.from({length: 100}, (_, index) => ({...saved, id: `saved-${index}`}))};
    const target = storage(JSON.stringify(full));
    expect(saveCalculation(saved)).toEqual({ok: false, error: 'limit'});
    expect(target.setItem).not.toHaveBeenCalled();
  });
  it('clears workspace storage without removing language or currency preferences', () => {
    const target = storage(JSON.stringify(document));
    expect(clearWorkspace()).toEqual({ok: true});
    expect(target.removeItem).toHaveBeenCalledExactlyOnceWith(workspaceKey);
  });
  it('restores only matching field and mode schemas', () => {
    expect(restoreInputs(saved, loan)).toEqual(defaults(loan));
    expect(restoreInputs({...saved, values: {principal: '100'}}, loan)).toBeNull();
    expect(restoreInputs({...saved, algorithm: 'changed'}, loan)).toBeNull();
  });
  it('keeps different modes and currencies out of a comparison', () => {
    expect(canCompare(saved, {...saved, id: 'b'})).toBe(true);
    for (const patch of [{currency: 'EUR'}, {modeId: 'other'}, {slug: 'mortgage-calculator'}, {algorithm: 'other'}]) expect(canCompare(saved, {...saved, ...patch})).toBe(false);
    expect(comparableMetric({label: 'Distance', value: 1, unit: 'km'}, {label: 'Distance', value: 1, unit: 'mi'})).toBe(false);
    expect(comparableMetric({label: 'Score', value: 200, displayValue: 'Unattainable'}, {label: 'Score', value: 70})).toBe(false);
  });
  it('shows row labels and selected options instead of storage encodings', () => {
    const text = (value: string) => value;
    expect(summarizeInput({key: 'debts', label: 'Debts', type: 'rows', default: '[]', rowColumns: [{key: 'name', label: 'Name'}, {key: 'amount', label: 'Balance ($)'}]}, '[{"name":"Car","amount":"4500"}]', text, 'EUR')).toBe('1. Name: Car; Balance (EUR): 4500');
    expect(summarizeInput({key: 'days', label: 'Days', type: 'multiselect', default: '1,2', options: [{value: '1', label: 'Monday'}, {value: '2', label: 'Tuesday'}]}, '1,2', text)).toBe('Monday, Tuesday');
  });
});
