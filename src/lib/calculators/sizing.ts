import bra from '@/data/bra-size-conventions.json';
import shoes from '@/data/shoe-size-charts.json';
import {metric as m, type Result, type Values} from './types';
import {num, positive} from './helpers';

const regions: [keyof typeof bra.bands, string][] = [['us', 'US'], ['uk', 'UK'], ['eu', 'EU'], ['fr', 'France'], ['au', 'Australia / New Zealand'], ['jp', 'Japan']];
const shoeColumns = [['usMen', 'US men'], ['usWomen', 'US women'], ['usKids', 'US children'], ['uk', 'UK'], ['eu', 'EU'], ['jp', 'JP / CM label'], ['cn', 'CN / mm label'], ['footMm', 'Chart foot length (mm)']] as const;
type ShoeRow = Partial<Record<typeof shoeColumns[number][0], string | number>>;
const groups: Record<string, ShoeRow[]> = shoes.groups;
const normalizeSize = (text: string) => {
  const match = text.trim().toUpperCase().match(/^(\d+(?:\.\d+)?)([CY]?)$/);
  return match ? String(Number(match[1])) + match[2] : text.trim().toUpperCase();
};

export function runSizing(op: string, v: Values): Result {
  if (op === 'bra-regions') {
    const system = v.system as keyof typeof bra.bands;
    if (!regions.some(([key]) => key === system)) throw Error('Select a supported bra size convention.');
    const band = bra.bands[system].indexOf(num(v, 'band'));
    const cup = bra.cups[system].indexOf(v.cup.trim().toUpperCase());
    if (band < 0 || cup < 0) throw Error('This band or cup is outside the selected Wacoal convention. Use the linked size guide to check the label.');
    return {metrics: regions.map(([key, label]) => m(label, `${bra.bands[key][band]}${bra.cups[key][cup]}`)), notes: [
      'Uses the Wacoal international label convention checked on 2026-10-10. It converts labels, not body measurements, and does not establish product availability or fit.',
      'Choose the convention on your garment label. Canadian, Belgian and Spanish brands may use different conventions. Dress sizes cannot determine a bra cup.',
    ]};
  }
  if (op === 'dress-regions') {
    const system = v.system as keyof typeof bra.dress;
    if (!Object.hasOwn(bra.dress, system)) throw Error('Select a supported dress size convention.');
    const i = bra.dress[system].indexOf(v.size.trim().toUpperCase());
    if (i < 0) throw Error('Dress size is outside the Wacoal conversion range.');
    return {metrics: [m('Wacoal dress code', bra.dress.code[i]), m('UK / Australia / New Zealand', bra.dress.uk[i]), m('US', bra.dress.us[i]), m('EU', bra.dress.eu[i]), m('France', bra.dress.fr[i]), m('Japan', bra.dress.jp[i])], notes: ['Dress labels are a separate Wacoal convention. They cannot be used to infer a bra band and cup.']};
  }
  if (op === 'shoe-regions') {
    if (!Object.hasOwn(groups, v.group)) throw Error('Select a supported shoe chart group.');
    const rows = groups[v.group];
    let matches: ShoeRow[];
    if (v.source === 'foot') {
      if (!['mm', 'cm', 'in'].includes(v.lengthUnit)) throw Error('Select a supported foot-length unit.');
      const mm = positive(num(v, 'length'), 'Foot length') * (v.lengthUnit === 'in' ? 25.4 : v.lengthUnit === 'cm' ? 10 : 1);
      const measured = rows.filter(row => typeof row.footMm === 'number').sort((a, b) => Number(a.footMm) - Number(b.footMm));
      if (mm < Number(measured[0]?.footMm) - 1e-6 || mm > Number(measured.at(-1)?.footMm) + 1e-6) throw Error('Foot length is outside the measured range of this chart group.');
      const next = measured.find(row => Number(row.footMm) + 1e-6 >= mm);
      matches = measured.filter(row => row.footMm === next?.footMm);
    } else {
      if (!shoeColumns.some(([key]) => key === v.source && key !== 'footMm')) throw Error('Select a supported source-size system.');
      const size = normalizeSize(v.size);
      matches = rows.filter(row => row[v.source as keyof ShoeRow] !== undefined && normalizeSize(String(row[v.source as keyof ShoeRow])) === size);
    }
    if (!matches.length) throw Error('No matching size in this chart group. Check the system and keep C or Y suffixes for children’s US sizes.');
    return {metrics: [m('Matching chart rows', matches.length)], table: {headers: shoeColumns.map(([, label]) => label), rows: matches.map(row => shoeColumns.map(([key]) => row[key] ?? '—'))}, notes: [
      'Nike label conventions checked on 2026-10-10. Results apply to the selected chart group; they are not universal regional sizes.',
      'Repeated labels return every matching row. For measured feet, the next larger listed foot length is used between rows. No size is extrapolated beyond the chart.',
      'JP and CN are size labels, not measured foot lengths. A dash means the selected source does not supply that value. Check the product’s fit and width before purchase.',
    ]};
  }
  throw Error('Unsupported sizing conversion.');
}
