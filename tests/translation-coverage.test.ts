import {describe, expect, it} from 'vitest';
import {collectContentMessages} from '../scripts/i18n-source.mjs';
import {translationIssues} from '../scripts/i18n-validation.mjs';

describe('translation release coverage', () => {
  it('includes changed article answers, reference sections, and table text', () => {
    const keys = collectContentMessages({
      quickAnswer: 'A revised answer.',
      answerHeading: 'How does it work?',
      link: {sentence: 'Use {calculatorLink} to check the result.', label: 'Calculator', href: '/calculator'},
      sections: [{heading: 'Check the comparison', paragraphs: ['A revised explanation.'],
        table: {caption: 'Compare the results', headers: ['Method', 'Interpretation'], rows: [['Method A', 'A lower result'], ['Method B', 'A higher result']]},
        links: [{label: 'Open the calculator', href: '/calculator'}],
      }],
      id: 'internal identifier', default: 'User supplied text',
    });
    expect([...keys]).toEqual(expect.arrayContaining(['A revised answer.', 'How does it work?', 'Check the comparison', 'A revised explanation.', 'Compare the results', 'Method', 'Interpretation', 'Method A', 'A lower result', 'Method B', 'A higher result', 'Open the calculator']));
    expect(keys.has('Use {calculatorLink} to check the result.')).toBe(true);
    for (const excluded of ['/calculator', 'internal identifier', 'User supplied text']) expect(keys.has(excluded)).toBe(false);
  });

  it('fails when a shared control exists only in the server content dictionary', () => {
    const source = {keys: ['Blog', 'New explanation'], sharedKeys: ['Blog'], formulas: []};
    const issues = translationIssues(source, {}, {'Blog': 'Blogue', 'New explanation': 'Nouvelle explication'});
    expect(issues.missing).toEqual([]);
    expect(issues.missingShared).toEqual(['Blog']);
    expect(translationIssues(source, {'Blog': 'Blogue'}, {'New explanation': 'Nouvelle explication'}).missingShared).toEqual([]);
  });

  it('collects descriptive image alternatives without translating asset URLs or decorative images', () => {
    const keys = collectContentMessages({
      'area-circle': {src: '/illustrations/area/circle.webp', width: 260, height: 180, alt: 'Circle with radius r measured from the marked center to the edge'},
      'area-circle-compact': {src: '/illustrations/area/circle-compact.webp', width: 40, height: 32, alt: ''},
    });
    expect([...keys]).toEqual(['Circle with radius r measured from the marked center to the edge']);
  });

  it('rejects missing updates and changed placeholders, example numbers, or formulas', () => {
    const formula = 'Area = length × width';
    const source = {keys: ['New paragraph', 'Result: {value0}', 'Use 25 percent.', formula], sharedKeys: [], formulas: [formula]};
    const issues = translationIssues(source, {}, {'Result: {value0}': 'Résultat : {value1}', 'Use 25 percent.': 'Utilisez 20 pour cent.', [formula]: 'Aire = longueur + largeur'});
    expect(issues.missing).toEqual(['New paragraph']);
    expect(issues.malformed).toEqual(['Result: {value0}']);
    expect(issues.changedNumbers).toContain('Use 25 percent.');
    expect(issues.damagedFormulas).toEqual([formula]);
  });

  it('preserves decimal values while allowing localized separators and digits', () => {
    const source = {keys: ['Use 1.2 meters.', 'The total is 1,200.50.'], sharedKeys: [], formulas: []};
    expect(translationIssues(source, {}, {'Use 1.2 meters.': 'Utilisez 12 mètres.', 'The total is 1,200.50.': 'Le total est de 1 200,50.'}, 'fr').changedNumbers).toEqual(['Use 1.2 meters.']);
    expect(translationIssues(source, {}, {'Use 1.2 meters.': 'Verwenden Sie 1,2 Meter.', 'The total is 1,200.50.': 'Die Summe ist 1.200,50.'}, 'de').changedNumbers).toEqual([]);
    expect(translationIssues(source, {}, {'Use 1.2 meters.': 'استخدم ١٫٢ متر.', 'The total is 1,200.50.': 'المجموع ١٬٢٠٠٫٥٠.'}, 'ar').changedNumbers).toEqual([]);
    expect(translationIssues(source, {}, {'Use 1.2 meters.': '१.२ मीटर उपयोग करें।', 'The total is 1,200.50.': 'कुल १,२००.५० है।'}, 'hi').changedNumbers).toEqual([]);
    const mixed = {keys: ['49.5 × 3,600 = 178,200 seconds; 2,970 minutes.'], sharedKeys: [], formulas: []};
    expect(translationIssues(mixed, {}, {'49.5 × 3,600 = 178,200 seconds; 2,970 minutes.': '49.5 × 3,600 = 178,200 segundos; 2.970 minutos.'}, 'es').changedNumbers).toEqual([]);
    const coefficient = {keys: ['Use coefficient 5.825.'], sharedKeys: [], formulas: []};
    for (const locale of ['hi', 'tl']) expect(translationIssues(coefficient, {}, {'Use coefficient 5.825.': 'Coefficient 5,825.'}, locale).changedNumbers).toEqual(['Use coefficient 5.825.']);
    const grouping = {keys: ['Use at most 100,000 days.', 'Forms W-4 from 2020.'], sharedKeys: [], formulas: []};
    expect(translationIssues(grouping, {}, {'Use at most 100,000 days.': 'अधिकतम 1,00,000 दिन।', 'Forms W-4 from 2020.': 'फॉर्म W-4 2020।'}, 'hi').changedNumbers).toEqual([]);
    const spaced = {keys: ['Use 20,000 at a cost of 1,200.50.'], sharedKeys: [], formulas: []};
    for (const translation of ['Use 20 000 a un coste de 1 200,50.', 'Use 20\u00a0000 a un coste de 1\u202f200.50.']) {
      expect(translationIssues(spaced, {}, {[spaced.keys[0]]: translation}, 'es').changedNumbers).toEqual([]);
    }
    expect(translationIssues(spaced, {}, {[spaced.keys[0]]: 'Use 20 00 a un coste de 1 200,50.'}, 'es').changedNumbers).toEqual(spaced.keys);
  });

  it('preserves unary signs without treating ranges or subtraction as negative literals', () => {
    const source = {keys: ['Enter −1 and +2.', 'Compute 10 - 1.', 'Use ages 1-2.'], sharedKeys: [], formulas: []};
    const content = {'Enter −1 and +2.': 'Entrez 1 et 2.', 'Compute 10 - 1.': 'Calculez 10 moins 1.', 'Use ages 1-2.': 'Utilisez les âges de 1 à 2.'};
    expect(translationIssues(source, {}, content, 'fr').changedNumbers).toEqual(['Enter −1 and +2.']);
    content['Enter −1 and +2.'] = 'Entrez -1 et +2.';
    expect(translationIssues(source, {}, content, 'fr').changedNumbers).toEqual([]);
    const identifiers = {keys: ['NIST SP 811 Appendix B.8', '2026 W-4'], sharedKeys: [], formulas: []};
    expect(translationIssues(identifiers, {}, {'NIST SP 811 Appendix B.8': 'NIST SP 811 التذييل باء-8', '2026 W-4': '2026 डबल्यू-4'}, 'hi').changedNumbers).toEqual([]);
    const offsets = {keys: ['Use a signed offset from −14:00 to +14:00.'], sharedKeys: [], formulas: []};
    expect(translationIssues(offsets, {}, {'Use a signed offset from −14:00 to +14:00.': 'Utilice un offset firmado de −14:00 a +14:00.'}, 'es').changedNumbers).toEqual([]);
  });

  it('rejects moved parentheses and reversed numeric divisions in formulas', () => {
    const keys = ['Rate = (1 + r) / (1 + n)', 'Share = 1 / 2'];
    const source = {keys, sharedKeys: [], formulas: keys};
    const damaged = {'Rate = (1 + r) / (1 + n)': 'Taux = (1 + r / (1 + n))', 'Share = 1 / 2': 'Part = 2 / 1'};
    expect(translationIssues(source, {}, damaged, 'fr').damagedFormulas).toEqual(keys);
    const correct = {'Rate = (1 + r) / (1 + n)': 'Taux = (1 + r) / (1 + n)', 'Share = 1 / 2': 'Part = 1 / 2'};
    expect(translationIssues(source, {}, correct, 'fr').damagedFormulas).toEqual([]);
  });

  it('rejects newly introduced CJK and Cyrillic tokens in supported translations', () => {
    const source = {keys: ['Count', 'Label'], sharedKeys: [], formulas: []};
    for (const locale of ['es', 'fr', 'de', 'pt', 'ar', 'hi', 'tl']) {
      for (const token of ['次数', 'ひらがな', 'カタカナ', '횟수', 'число']) {
        const content = {'Count': `गिनती ${token}`, 'Label': 'π α Ω kg/m²'};
        expect(translationIssues(source, {}, content, locale).unexpectedScripts).toEqual(['Count']);
      }
    }
  });

  it('preserves foreign-script literals present in the source and ordinary mathematical notation', () => {
    const key = 'Literal examples: 次数, ひらがな, カタカナ, 횟수, Я.';
    const source = {keys: [key, 'Area = πr²'], sharedKeys: [], formulas: ['Area = πr²']};
    const content = {[key]: 'أمثلة حرفية: 次数, ひらがな, カタカナ, 횟수, Я.', 'Area = πr²': 'المساحة = πr²'};
    expect(translationIssues(source, {}, content, 'ar').unexpectedScripts).toEqual([]);
    expect(translationIssues(source, {}, content, 'ar').damagedFormulas).toEqual([]);
    content[key] += ' 新';
    expect(translationIssues(source, {}, content, 'ar').unexpectedScripts).toEqual([key]);
  });

  it('preserves case-sensitive units, data sizes, encodings, grades and currency identifiers', () => {
    const keys = ['mV', 'nM', '1 GiB', '142.80 hp', '0.9259 yd³', 'sqrt', 'SHIFT-JIS', 'CNY', 'AWG: Aruban Florin', 'B−'];
    const source = {keys, sharedKeys: [], formulas: []};
    const damaged = Object.fromEntries(keys.map((key, index) => [key, ['MV', 'nm', '1 GB', '142,80 PS', '0,9259 m³', 'square meter', 'SCHICHT-JIS', 'ANMERKUNG', 'GTE: Florín arubeño', 'second-'][index]]));
    expect(translationIssues(source, {}, damaged, 'de').changedIdentifiers).toEqual(keys);
    const correct = Object.fromEntries(keys.map(key => [key, key]));
    correct['142.80 hp'] = '142,80 hp';
    correct['0.9259 yd³'] = '0,9259 yd³';
    correct['AWG: Aruban Florin'] = 'AWG: Florín arubeño';
    expect(translationIssues(source, {}, correct, 'es').changedIdentifiers).toEqual([]);
    expect(translationIssues(source, {'mV': 'MV'}, correct, 'es').changedIdentifiers).toEqual(['mV']);
  });

  it('allows translated words and established localized abbreviations', () => {
    const keys = ['No', 'At', 'VAT', 'APR', 'hectare', 'grain', '20 meters', 'Use 20 kg of material.'];
    const source = {keys, sharedKeys: [], formulas: []};
    const content = Object.fromEntries(keys.map((key, index) => [key, ['Non', 'À', 'TVA', 'TAEG', 'hectare', 'grain', '20 mètres', 'Utilisez 20 kg de matériau.'][index]]));
    expect(translationIssues(source, {}, content, 'fr').changedIdentifiers).toEqual([]);
  });
});
