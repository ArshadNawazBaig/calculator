import fs from 'node:fs';

const readData = name => JSON.parse(fs.readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'));
const tables = readData('utility-unit-tables');
const currencyCodes = new Set(readData('currency-instruments').map(currency => currency.code));
// These are configured identifiers, not English unit names. Written names and
// localized finance abbreviations (VAT, APR, etc.) may legitimately translate.
const writtenUnits = new Set(['acre', 'hectare', 'grain', 'tonne', 'slug', 'stone', 'knot', 'knots', 'short-ton', 'long-ton', 'roofing-square']);
const tableSymbols = Object.entries(tables).flatMap(([name, values]) => name === 'electricalFactors'
  ? Object.values(values).flatMap(factors => Object.keys(factors)) : Object.keys(values));
// Additional symbols come from calculators/physical-units.ts and calculator
// field labels. Case and prefixes carry magnitude: mV != MV, nM != nm.
const additionalSymbols = `
  mm cm m km in ft yd mi mm2 cm2 m2 ft2 yd2 mm² cm² m² ft² yd² in²
  m3 ft3 yd3 cm3 mm3 in3 km3 mi3 m³ ft³ yd³ cm³ mm³ in³
  t kg g mg ug Da lb oz L mL US-gal US-qt US-pt US-cup US-fl-oz
  W kW MW hp hp-mechanical hp-metric hp-electric hp-boiler-NIST BTU BTU-IT/h BtuIT/h BTU/h
  M mM uM nM mol/m3 mol/L µmol/L kg/mol g/mol mg/dL kg/m² kg/m³ lb/yd³
  b kb Mb Gb Tb B kB MB GB TB KiB MiB GiB TiB bit/s kbit/s Mbit/s Gbit/s Tbit/s B/s kB/s MB/s Mbps
  V kV mV A mA N kN J kJ K Pa kPa atm bar psi lbf kgf kcal cal kWh rpm RPM AWG kcmil
  h min s cm/s ft/s m/s km/h mph mpg km/L L/mi L/100km W/K S/m
  ohm/1000ft ohm/ft ohm/km ohm/m milliohm/ft milliohm/m Ω/m Ω·m lb-ft ppb-mass ppm-mass
  °C °F 1/°C $/kWh J/(kg·K) BTU/(h·ft²·°F) BTU/(h·°F)
`.trim().split(/\s+/);
const formulaIdentifiers = 'a b c x y z A B C D F H N O Ca gcd lcm sqrt mod P(A)'.split(' ');
const grades = ['A+', 'A−', 'B+', 'B−', 'C+', 'C−', 'D+', 'D−'];
const symbols = new Set([...tableSymbols.filter(symbol => !writtenUnits.has(symbol)), ...additionalSymbols, ...formulaIdentifiers, ...grades, ...currencyCodes,
  'Ω/1000 ft', 'mL/min/1.73 m²', '4 in ÷ 12']);
const encoding = /^(?:ISO-\d+(?:-[A-Z\d]+)*|UTF-\d+(?:BE|LE)?|WINDOWS-\d+|KOI8-[RU]|SHIFT-JIS|X-MAC-CYRILLIC|MACINTOSH)$/;
const numberWithUnit = /^[-−+]?[\d٠-٩۰-۹०-९]+(?:[.,٬٫/][\d٠-٩۰-۹०-९]+)*(?:[ \u00a0\u202f][\d٠-٩۰-۹०-९]{3})*\s*(.+)$/u;

/** Guard only whole technical identifiers, numeric unit cells, and ISO prefixes. */
export function changesInvariant(source, translation) {
  const key = source.trim(), value = translation.trim();
  if (symbols.has(key) || encoding.test(key)) return value !== key;
  const currency = key.match(/^([A-Z]{3}): /)?.[1];
  if (currencyCodes.has(currency)) return !new RegExp(`^${currency}\\s*[:：]`).test(value);
  const unit = key.match(numberWithUnit)?.[1];
  if (unit && symbols.has(unit)) return value.match(numberWithUnit)?.[1] !== unit;
  return false;
}
