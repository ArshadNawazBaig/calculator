import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {CalculatorGuidance, type GuidanceSection} from '@/components/content/calculator-guidance';
import content from '@/data/calculator-content.json';
import {collectContentMessages} from '../scripts/i18n-source.mjs';

describe('literal examples in translated guidance', () => {
  it.each([
    ['base64-encode-decode', ['H', 'Hi', 'Hi!', 'SA==', 'SGk=', 'SGkh']],
    ['url-encode-decode', ['a+b c', 'a%2Bb%20c', 'fish & chips', 'fish%20%26%20chips', '100%', '100%25']],
    ['scientific-calculator', ['sin(30)', 'sin(pi/6)', 'log(1000)', 'sqrt(81)+2^4']],
    ['basic-calculator', ['3*12+2*7', '(3*12+2*7)*0.9+5']],
    ['roman-numeral-converter', ['XIV', 'CMXLIV', 'MMXXVI']],
    ['hex-calculator', ['2A', '3F', '2×16 + 10']],
    ['love-calculator', ['Alex', 'sam', ' ALEX ', ' Sam ', 'alex|sam']],
    ['log-calculator', ['2⁶ = 64', '10⁻³ = 0.001']],
  ] as const)('preserves %s examples even when a dictionary translates the same text', (slug, literals) => {
    const entry = (content as Record<string, {sections: GuidanceSection[]}>)[slug];
    const table = entry.sections.find(section => section.table)!.table!;
    const messages = Object.fromEntries(literals.map(literal => [literal, `INCORRECT TRANSLATION: ${literal}`]));
    messages[table.caption] = 'Légende traduite';
    messages[table.headers[0]] = 'En-tête traduit';
    const html = renderToStaticMarkup(<CalculatorGuidance slug={slug} messages={messages} locale="ar"/>);
    for (const literal of literals) expect(html).toContain(renderToStaticMarkup(<bdi dir="ltr">{literal}</bdi>));
    expect(html).not.toContain('INCORRECT TRANSLATION:');
    expect(html).toContain('<caption>Légende traduite</caption>');
    expect(html).toContain('En-tête traduit');
  });

  it('extracts table explanations while excluding only cells marked as exact literals', () => {
    const table = {
      caption: 'Encoding examples', headers: ['Input text', 'Encoded output', 'Explanation'], literalColumns: [0, 1],
      rows: [['Hi', 'SGk=', 'Two ASCII characters'], ['fish & chips', 'fish%20%26%20chips', 'Preserve the ampersand']],
    };
    const keys = collectContentMessages({table});
    for (const key of ['Encoding examples', 'Input text', 'Encoded output', 'Explanation', 'Two ASCII characters', 'Preserve the ampersand']) expect(keys.has(key)).toBe(true);
    for (const literal of ['Hi', 'SGk=', 'fish & chips', 'fish%20%26%20chips']) expect(keys.has(literal)).toBe(false);
    // A greeting elsewhere remains translatable; this is not a global word ban.
    expect(collectContentMessages({table, paragraphs: ['Hi']}).has('Hi')).toBe(true);
  });
});
