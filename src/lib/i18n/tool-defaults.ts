import type {Definition} from '@/lib/calculators/types';
import {translator, type Dictionary} from './config';

/** Localize supplied examples, never restored or user-entered data or option IDs. */
export function localizeToolDefaults(definition: Definition, messages: Dictionary): Definition {
  const t = translator(messages);
  return {...definition, modes: definition.modes.map(mode => !mode.algorithm.startsWith('toolkit-') ? mode : ({...mode, fields: mode.fields.map(field => {
    if (field.type === 'rows' && field.rowColumns) {
      const columns = field.rowColumns.map(column => ({...column, default: !column.type || column.type === 'text' ? t(column.default ?? '') : column.default}));
      const rows = JSON.parse(field.default) as Record<string,string|number>[];
      return {...field, rowColumns: columns, default: JSON.stringify(rows.map(row => Object.fromEntries(Object.entries(row).map(([key,value]) => {
        const column = field.rowColumns!.find(column => column.key === key);
        return [key, typeof value === 'string' && column && (!column.type || column.type === 'text') ? t(value) : value];
      }))))};
    }
    return field.type === 'text' || field.type === 'textarea' ? {...field,default:t(field.default)} : field;
  })}))};
}
