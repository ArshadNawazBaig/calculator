import data from '@/data/nec-2017-impedance.json';
import {num, nonnegative, positive} from './helpers';
import {metric as m, type Result, type Values} from './types';

export function runNecImpedance(v: Values): Result {
  if (!Object.hasOwn(data.rows, v.size) || !['copper', 'aluminum'].includes(v.material)) throw Error('Choose a conductor size and material in the 2017 reference table.');
  const conduit = data.conduitOrder.indexOf(v.conduit);
  if (conduit < 0 || !['ft', 'm'].includes(v.lengthUnit)) throw Error('Choose a supported conduit and length unit.');
  const row = data.rows[v.size as keyof typeof data.rows];
  const resistance = row[v.material as 'copper' | 'aluminum'][conduit];
  if (resistance === null) throw Error('The 2017 table does not provide 14 AWG aluminum data. Choose a documented size.');
  const reactance = row.x[conduit];
  const pf = num(v, 'powerFactor');
  if (pf < 0 || pf > 1) throw Error('Power factor must be between 0 and 1.');
  const lengthFt = nonnegative(num(v, 'length'), 'One-way length') * (v.lengthUnit === 'm' ? 1 / 0.3048 : 1);
  const supply = positive(num(v, 'voltage'), 'Supply voltage');
  if (supply > 600) throw Error('This reference mode is limited to 600 V.');
  const effective = resistance * pf + reactance * Math.sqrt(1 - pf ** 2);
  const drop = Math.sqrt(3) * nonnegative(num(v, 'current'), 'Line current') * lengthFt / 1000 * effective;
  return {metrics: [m('Line-to-line voltage drop', drop, 'number', 'V'), m('Drop percentage', drop / supply * 100, 'percent'), m('Estimated load voltage', supply - drop, 'number', 'V'), m('AC resistance at 75 °C', resistance, 'number', 'Ω/1000 ft'), m('Reactance at 60 Hz', reactance, 'number', 'Ω/1000 ft'), m('Effective longitudinal impedance', effective, 'number', 'Ω/1000 ft')], notes: ['Reference: 2017 NEC Chapter 9 Table 9, not a claim about the currently adopted local code. Values apply to the stated 75 °C, 60 Hz, three-conductor arrangement.', 'This is a balanced three-phase, lagging-power-factor, small-drop estimate. It does not calculate ampacity, protective devices, grounding, installation approval or present-day code compliance.']};
}
