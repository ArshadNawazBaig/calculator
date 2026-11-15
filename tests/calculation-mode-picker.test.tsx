import {describe, expect, it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {CalculationModePicker} from '@/components/calculators/calculation-mode-picker';
import {calculationAlgorithmIcons, calculationModeIconName} from '@/components/calculators/calculation-mode-icon';
import {TranslationMessages} from '@/components/i18n/provider';
import {catalog, definitions} from '@/lib/calculators/registry';
import {geometryTools} from '@/lib/calculators/geometry-tools';

const visualDefinitions = definitions.filter(definition => definition.modes.length > 1 && !geometryTools.has(definition.slug));
const categoryFor = (slug: string) => catalog.find(tool => tool.slug === slug)!.category;

describe('visible calculator mode choices', () => {
  it('explicitly maps every currently displayed calculation algorithm to a semantic icon', () => {
    const algorithms = new Set(visualDefinitions.flatMap(definition => definition.modes.map(mode => mode.algorithm)));
    expect(algorithms.size).toBeGreaterThan(0);
    for (const algorithm of algorithms) expect(calculationAlgorithmIcons[algorithm], algorithm).toBeTruthy();
    const retirement = visualDefinitions.find(definition => definition.slug === 'retirement-calculator')!;
    const symbols = retirement.modes.map(mode => calculationModeIconName({slug: retirement.slug, mode, category: 'finance'}));
    expect(new Set(symbols).size).toBe(retirement.modes.length);
  });

  it('renders every mode, complete label and selected state for all eligible calculators', () => {
    expect(visualDefinitions.length).toBeGreaterThan(0);
    for (const definition of visualDefinitions) {
      const selected = definition.modes.at(-1)!.id;
      const html = renderToStaticMarkup(<CalculationModePicker slug={definition.slug} modes={definition.modes}
        selected={selected} disabled={false} onChange={() => {}} category={categoryFor(definition.slug)}/>);
      const buttons = [...html.matchAll(/<button\b[^>]*>/g)].map(match => match[0]);
      expect(buttons, definition.slug).toHaveLength(definition.modes.length);
      const pressed = buttons.filter(button => button.includes('aria-pressed="true"'));
      expect(pressed, definition.slug).toHaveLength(1);
      expect(pressed[0], definition.slug).toContain(`data-mode-choice="${selected}"`);
      for (const mode of definition.modes) {
        const button = buttons.find(item => item.includes(`data-mode-choice="${mode.id}"`));
        expect(button, `${definition.slug}/${mode.id}`).toContain('aria-controls="calculator-inputs"');
        expect(button, `${definition.slug}/${mode.id}`).toContain('type="button"');
        expect(html, `${definition.slug}/${mode.id}`).toContain(renderToStaticMarkup(<>{mode.title}</>));
      }
      const visuals = [...html.matchAll(/<svg\b[^>]*data-mode-icon="[^"]+"[^>]*>/g)];
      expect(visuals, definition.slug).toHaveLength(definition.modes.length);
      for (const [visual] of visuals) {
        expect(visual, definition.slug).toContain('aria-hidden="true"');
        expect(visual, definition.slug).toContain('focusable="false"');
      }
      expect(html, definition.slug).not.toContain('aria-haspopup');
      expect(html, definition.slug).not.toContain('<select');
    }
  });

  it('disables the group until its event handlers are available', () => {
    const definition = visualDefinitions.find(item => item.slug === 'retirement-calculator')!;
    const html = renderToStaticMarkup(<CalculationModePicker slug={definition.slug} modes={definition.modes}
      selected="target" disabled onChange={() => {}} category="finance"/>);
    expect(html.match(/<fieldset\b[^>]*>/)?.[0]).toContain('disabled=""');
    expect(html).toContain('<legend');
    expect(html).toContain('What would you like to calculate?');
  });

  it('translates the visible option labels while keeping stable mode IDs and icons', () => {
    const definition = visualDefinitions.find(item => item.slug === 'retirement-calculator')!;
    const messages = {
      'What would you like to calculate?': 'Que souhaitez-vous calculer ?',
      'Retirement savings target': 'Objectif d’épargne retraite',
      'Monthly savings needed': 'Épargne mensuelle nécessaire',
      'Withdrawal amount': 'Montant du retrait',
      'How long will it last?': 'Combien de temps cela durera-t-il ?',
      'Salary growth & income-based retirement': 'Croissance du salaire et retraite selon le revenu',
    };
    const html = renderToStaticMarkup(<TranslationMessages messages={messages}><CalculationModePicker slug={definition.slug}
      modes={definition.modes} selected="save" disabled={false} onChange={() => {}} category="finance"/></TranslationMessages>);
    for (const translated of Object.values(messages)) expect(html).toContain(renderToStaticMarkup(<>{translated}</>));
    for (const mode of definition.modes) expect(html).toContain(`data-mode-choice="${mode.id}"`);
    expect(html).toContain('data-mode-icon="PiggyBank"');
    expect(html).not.toContain('Monthly savings needed');
  });
});
