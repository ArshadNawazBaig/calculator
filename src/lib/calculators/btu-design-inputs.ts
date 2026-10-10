import type {Field, Mode, Values} from './types';
// Unit conversions are shared by the form; data lookups stay in the BTU engine.
const imperialUToSi = (1055.05585262 / 3600) / .09290304 * 1.8;
export function btuDesignField(field: Field, values: Values): Field {
  if (field.key === 'county') return {...field, options: field.options?.filter(o => o.value.startsWith(`${values.state}|`))};
  const units: Record<string, [string, string]> = {'design-length': ['ft', 'm'], 'design-area': ['ft²', 'm²'], 'design-temperature': ['°F', '°C'], 'design-u': ['BTU/(h·ft²·°F)', 'W/(m²·K)']};
  return field.unit && units[field.unit] ? {...field, unit: units[field.unit][values.units === 'us' ? 0 : 1]} : field;
}
export function updateBtuDesignInputs(mode: Mode, values: Values, key: string, value: string): Values {
  const next = {...values, [key]: value};
  if (key === 'state') next.county = mode.fields.find(f => f.key === 'county')?.options?.find(o => o.value.startsWith(`${value}|`))?.value || '';
  if (key === 'season') {
    const previousDefault = values.units === 'us' ? values.season === 'heating' ? 70 : 75 : values.season === 'heating' ? (70 - 32) * 5 / 9 : (75 - 32) * 5 / 9;
    if (Math.abs(Number(values.indoor) - previousDefault) < 1e-8) next.indoor = String(value === 'heating' ? values.units === 'us' ? 70 : (70 - 32) * 5 / 9 : values.units === 'us' ? 75 : (75 - 32) * 5 / 9);
  }
  // Preserve a full-footprint ceiling when dimensions change; retain custom areas.
  if (['length', 'width'].includes(key) && Number(values.ceilingArea) === Number(values.length) * Number(values.width)) next.ceilingArea = String(Number(next.length) * Number(next.width));
  if (key === 'units' && value !== values.units && ['us', 'si'].includes(value)) {
    const convert = (key: string, fn: (n: number) => number) => {if (values[key]?.trim() && Number.isFinite(Number(values[key]))) next[key] = String(Number(fn(Number(values[key])).toPrecision(13)));};
    const toSi = value === 'si';
    for (const field of mode.fields) {
      if (field.unit === 'design-length') convert(field.key, n => n * (toSi ? .3048 : 1 / .3048));
      if (field.unit === 'design-area') convert(field.key, n => n * (toSi ? .09290304 : 1 / .09290304));
      if (field.unit === 'design-u') convert(field.key, n => n * (toSi ? imperialUToSi : 1 / imperialUToSi));
      if (field.unit === 'design-temperature') convert(field.key, n => toSi ? (n - 32) * 5 / 9 : n * 9 / 5 + 32);
    }
  }
  return next;
}
