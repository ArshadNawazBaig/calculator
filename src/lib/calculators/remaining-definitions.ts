import {mode, n, s, t, type Mode} from './types';
import {btuDesignMode} from './btu-design-definition';
import impedanceData from '@/data/nec-2017-impedance.json';

export function remainingDefinitions(): Record<string, Mode[]> {
  return {
    'voltage-drop-calculator': [mode('nec-2017', '2017 NEC impedance reference', 'nec-2017', [s('material', 'Conductor material', [['copper', 'Uncoated copper'], ['aluminum', 'Aluminum']]), s('size', 'Conductor size', Object.keys(impedanceData.rows).sort((a, b) => {
      const rank = (value: string) => value.includes('/0') ? 20 + Number(value[0]) : Number(value) >= 250 ? Number(value) : 15 - Number(value);
      return rank(a) - rank(b);
    }).map(value => [value, `${value} ${Number(value) >= 250 ? 'kcmil' : 'AWG'}`] as [string, string]), '1/0'), s('conduit', 'Conduit material', [['pvc', 'PVC'], ['aluminum', 'Aluminum'], ['steel', 'Steel']], 'steel'), n('voltage', 'Three-phase line-to-line supply', 480, 'V', 0.01, 600), n('current', 'Line current', 100, 'A', 0), n('length', 'One-way conductor length', 100, undefined, 0), s('lengthUnit', 'Length unit', [['ft', 'Feet'], ['m', 'Meters']]), n('powerFactor', 'Lagging power factor', 0.8, undefined, 0, 1)], 'Line-to-line drop (V) = √3 × current(A) × length(ft) / 1000 × [R × PF + X × √(1 − PF²)].', 'Uses the numerical resistance and reactance relationships from 2017 NEC Chapter 9 Table 9. The lookup assumes 75 °C conductors, 60 Hz, three single UL RHH Class B stranded conductors in a cradled arrangement, up to 600 V. Length is converted to the table’s 1000-foot basis. This dated reference does not establish current local code compliance.')],
    'bra-size-calculator': [
      mode('regional-labels', 'International bra label conversion', 'bra-regions', [s('system', 'Source label convention', [['us', 'US'], ['uk', 'UK'], ['eu', 'EU'], ['fr', 'France'], ['au', 'Australia / New Zealand'], ['jp', 'Japan']], 'uk'), n('band', 'Label band size', 34, undefined, 0), t('cup', 'Label cup size', 'E')], 'Match the band and cup independently in the Wacoal international convention.', 'Uses the named Wacoal convention, including AA where listed and distinct UK, US and European cup ladders. Only the documented band and cup ranges are supported. This converts garment labels, not measurements or dress sizes.'),
      mode('dress-labels', 'Dress label conversion', 'dress-regions', [s('system', 'Source dress convention', [['uk', 'UK / Australia / New Zealand'], ['us', 'US'], ['eu', 'EU'], ['fr', 'France'], ['jp', 'Japan'], ['code', 'Wacoal dress code']]), t('size', 'Dress label size', '12')], 'Match the size within the Wacoal dress-label conversion rows.', 'This separate garment-size conversion does not determine bra size. Bra band and cup depend on additional measurements and the garment convention.'),
    ],
    'shoe-size-conversion': [mode('regional-chart', 'Regional shoe sizes and age groups', 'shoe-regions', [s('group', 'Nike chart group', [['adult-men', 'Adult men’s chart'], ['adult-women', 'Adult women’s chart'], ['big-kids', 'Big kids'], ['little-kids', 'Little kids'], ['infants', 'Babies and toddlers']]), s('source', 'Source-size system', [['usMen', 'US men'], ['usWomen', 'US women'], ['usKids', 'US children (C / Y)'], ['uk', 'UK'], ['eu', 'EU'], ['jp', 'JP / CM label'], ['cn', 'CN / mm label'], ['foot', 'Measured foot length']]), t('size', 'Source size label', '9', 'text', 'Keep C or Y for children’s US sizes. Not every system is available in every group.'), n('length', 'Measured foot length', 26, undefined, 0.01, 1000), s('lengthUnit', 'Foot-length unit', [['cm', 'Centimeters'], ['mm', 'Millimeters'], ['in', 'Inches']])], 'Find all matching rows in the selected Nike chart; for measured feet, use the next listed length when between sizes.', 'Adult, child and infant groups retain their own measurements. CN labels are checked against Nike’s China guides using matching US, UK and EU rows. Missing entries remain unavailable. These named conventions do not promise universal fit.')],
    'golf-handicap-calculator': [mode('mixed-rounds', 'Mixed rounds with verified differentials', 'golf-mixed', [{
      key: 'rounds', label: 'Most recent 3–20 rounds', type: 'rows',
      default: JSON.stringify([
        {name: 'Round 1', input: '18-score', score: 82, rating: 72, slope: 113, pcc: 0, differential: '', source: ''},
        {name: 'Round 2', input: '9-verified', score: '', rating: '', slope: '', pcc: '', differential: 12, source: 'Example only'},
        {name: 'Round 3', input: '18-score', score: 86, rating: 72, slope: 113, pcc: 0, differential: '', source: ''},
      ]),
      hint: 'For a nine-hole round, enter the completed 18-hole-equivalent differential from your handicap service and its source. For a scored 18-hole round, use score, rating, slope and PCC. Unused columns are ignored.',
      rowColumns: [
        {key: 'name', label: 'Round', default: 'Round'},
        {key: 'input', label: 'Round input', type: 'select', default: '18-score', options: [
          {value: '18-score', label: '18-hole adjusted score'},
          {value: '9-verified', label: '9-hole round: verified equivalent differential'},
          {value: '18-verified', label: '18-hole verified differential'},
        ]},
        {key: 'score', label: 'Adjusted gross score', type: 'number', default: '85'},
        {key: 'rating', label: 'Course rating', type: 'number', default: '72'},
        {key: 'slope', label: 'Slope rating', type: 'number', default: '113'},
        {key: 'pcc', label: 'Official PCC', type: 'number', default: '0'},
        {key: 'differential', label: 'Verified 18-hole-equivalent differential', type: 'number', default: ''},
        {key: 'source', label: 'Differential source', default: ''},
      ],
    }], 'Combine calculated 18-hole differentials and supplied verified equivalents, then apply the differential selection table.', 'Nine-hole scores need an expected-score contribution from the applicable handicap service. Enter its final 18-hole-equivalent differential here; never double the nine-hole score. Finflo does not generate or verify that contribution. The resulting index remains an unofficial estimate without caps, exceptional-score reductions or committee adjustments.')],
    'btu-calculator': [btuDesignMode(), mode('heat-loss', 'Steady heating loss', 'heat-loss', [
      n('length', 'Heated space length', 5, undefined, 0.01, 10000),
      n('width', 'Heated space width', 4, undefined, 0.01, 10000),
      n('height', 'Ceiling height', 2.5, undefined, 0.01, 1000),
      s('lengthUnit', 'Dimension unit', [['m', 'Meters'], ['ft', 'Feet']]),
      n('indoor', 'Indoor design temperature', 20), n('outdoor', 'Outdoor design temperature', 0),
      s('temperatureUnit', 'Temperature unit', ['C', 'F']),
      s('envelopeInput', 'Envelope heat loss', [['total', 'Enter total UA'], ['components', 'Enter surface areas and U-values']]),
      n('ua', 'Total envelope heat-loss coefficient', 100, undefined, 0),
      s('uaUnit', 'Heat-loss coefficient unit', ['W/K', 'BTU/(h·°F)']),
      {key: 'surfaces', label: 'Exposed surfaces', type: 'rows', default: JSON.stringify([{name: 'External wall', area: 20, u: 0.5}]), hint: 'Use net exposed areas and effective assembly U-values, including windows and thermal bridges where applicable. Areas use the selected dimension unit squared.', rowColumns: [
        {key: 'name', label: 'Surface', default: 'Surface'},
        {key: 'area', label: 'Exposed area', type: 'number', default: '20'},
        {key: 'u', label: 'U-value (W/m²·K)', type: 'number', default: '0.5'},
      ]},
      n('ach', 'Outdoor air changes per hour', 0.5, '1/h', 0, 100),
      n('airCapacity', 'Air volumetric heat capacity', 1207, 'J/(m³·K)', 0.01),
    ], 'Heat loss (W) = [UA + air heat capacity × air changes per hour × volume / 3600] × (indoor − outdoor temperature).', 'Estimate steady sensible heating loss for an entered room or building envelope. Use local design temperatures and measured or specified insulation values. Air heat capacity defaults to 1207 J/(m³·K), an assumption for dry air near sea level and 21 °C. Use operating air changes, not a blower-door ACH50 value. This excludes solar gains, latent heat, ducts, warm-up and equipment sizing; it is not a Manual J calculation.')],
  };
}
