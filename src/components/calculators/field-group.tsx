"use client";
import {useI18n} from "@/components/i18n/provider";
import type {Field, Values} from '@/lib/calculators/types';
import {CalculatorField} from './field';
import {Accordion,AccordionItem} from '@/components/ui/accordion';
const advanced = new Set(['taxGrowth', 'insuranceGrowth', 'hoaGrowth', 'extraAnnual', 'oneTime', 'oneMonth', 'other', 'hoa', 'pmi', 'extra', 'start']);
export function FieldGroup({fields, values, onChange, prefix, disabled}: {fields: Field[]; values: Values; onChange: (key: string, value: string) => void; prefix: string; disabled: boolean}) {
 const {t}=useI18n();

  const basic: Field[] = [], groups = new Map<string, Field[]>();
  for (const field of fields) {
    const name = field.group || (fields.length > 10 && advanced.has(field.key) ? 'Extra payments & additional assumptions' : '');
    if (name) groups.set(name, [...(groups.get(name) || []), field]);
    else basic.push(field);
  }
  const render = (field: Field) => <CalculatorField key={field.key} field={field} value={values[field.key] ?? ''} prefix={prefix} disabled={disabled} onChange={value => onChange(field.key, value)}/>;
  return <><div className="calculator-fields">{basic.map(render)}</div>{groups.size>0&&<Accordion className="advanced-fields">{[...groups].map(([name, fields]) => <AccordionItem title={t(name)} key={name}><div className="calculator-fields">{fields.map(render)}</div></AccordionItem>)}</Accordion>}</>;
}
