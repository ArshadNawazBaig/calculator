"use client";
import {useState} from 'react';
import {useI18n} from "@/components/i18n/provider";
import type {Field, Values} from '@/lib/calculators/types';
import {CalculatorField} from './field';
import {Accordion,AccordionItem} from '@/components/ui/accordion';
const advanced = new Set(['taxGrowth', 'insuranceGrowth', 'hoaGrowth', 'extraAnnual', 'oneTime', 'oneMonth', 'other', 'hoa', 'pmi', 'extra', 'start']);
export function FieldGroup({fields, values, onChange, prefix, disabled, currency}: {currency?: string; fields: Field[]; values: Values; onChange: (key: string, value: string) => void; prefix: string; disabled: boolean}) {
 const {t}=useI18n();
  const [openedGroups, setOpenedGroups] = useState<ReadonlySet<string>>(() => new Set());

  const basic: Field[] = [], groups = new Map<string, Field[]>();
  for (const field of fields) {
    const name = field.group || (fields.length > 10 && advanced.has(field.key) ? 'Extra payments & additional assumptions' : '');
    if (name) groups.set(name, [...(groups.get(name) || []), field]);
    else basic.push(field);
  }
  const render = (field: Field, nativeDate = false) => <CalculatorField currency={currency} key={`${prefix}-${field.key}`} field={field} value={values[field.key] ?? ''} prefix={prefix} disabled={disabled} nativeDate={nativeDate} onChange={value => onChange(field.key, value)}/>;
  function enableDatePicker(name: string, fields: Field[]) {
    if (openedGroups.has(name) || !fields.some(field => field.type === 'date')) return;
    setOpenedGroups(previous => new Set(previous).add(name));
  }
  // Native disclosures can already be open when hydration attaches their handlers.
  return <><div className="calculator-fields">{basic.map(field => render(field))}</div>{groups.size>0&&<Accordion className="advanced-fields">{[...groups].map(([name, fields]) => <AccordionItem title={t(name)} key={name}
    ref={element => {if (element?.open) enableDatePicker(name, fields);}}
    onToggle={event => {if (event.currentTarget.open) enableDatePicker(name, fields);}}
    onInvalidCapture={event => { event.currentTarget.open = true; }}>
    <div className="calculator-fields">{fields.map(field => render(field, !openedGroups.has(name)))}</div>
  </AccordionItem>)}</Accordion>}</>;
}
