import {translator, type Dictionary} from '@/lib/i18n/config';
import type {Mode, Values} from '@/lib/calculators/types';
import {AreaShapeDiagram} from './area-shape-diagram';
import {SolidShapeDiagram} from './solid-shape-diagram';
import {PlanarShapeDiagram, planarMeasurementNote} from './planar-shape-diagram';
import styles from './area-shapes.module.css';

const solids = ['volume-calculator', 'surface-area-calculator'];
const isShapeChoice = (slug: string) => slug === 'area-calculator' || solids.includes(slug);

export function GeometryDiagram({slug, mode, values, compact = false, messages = {}}: {
  slug: string; mode: string; values?: Values; compact?: boolean; messages?: Dictionary;
}) {
  if (slug === 'area-calculator') return <AreaShapeDiagram shape={mode} compact={compact} messages={messages}/>;
  if (solids.includes(slug)) return <SolidShapeDiagram shape={mode} known={values?.known} compact={compact} messages={messages}/>;
  return <PlanarShapeDiagram slug={slug} mode={mode} values={values} compact={compact} messages={messages}/>;
}

function choiceLabel(slug: string, mode: Mode) {
  if (slug === 'area-calculator' && mode.id === 'triangle') return 'Triangle: base & height';
  if (slug === 'area-calculator' && mode.id === 'triangle-sss') return 'Triangle: 3 sides';
  if (solids.includes(slug) && mode.id === 'cap-inverse') return 'Cap: other measurements';
  return mode.title;
}

export function GeometryModePicker({slug, modes, selected, disabled, onChange, messages = {}}: {
  slug: string; modes: Mode[]; selected: string; disabled: boolean; onChange: (id: string) => void; messages?: Dictionary;
}) {
  const t = translator(messages);
  return <fieldset className={styles.picker} disabled={disabled}>
    <legend>{t(isShapeChoice(slug) ? 'Choose a shape' : 'Choose known measurements')}</legend>
    <div className={styles.choices} data-methods={!isShapeChoice(slug) || undefined}>
      {modes.map(mode => <button type="button" key={mode.id} aria-pressed={mode.id === selected}
        aria-controls="calculator-inputs" onClick={() => {if (mode.id !== selected) onChange(mode.id);}}>
        <GeometryDiagram slug={slug} mode={mode.id} compact/>
        <span>{t(choiceLabel(slug, mode))}</span>
      </button>)}
    </div>
  </fieldset>;
}

export function GeometryMeasurementGuide({slug, mode, values, messages = {}}: {slug: string; mode: Mode; values: Values; messages?: Dictionary}) {
  const t = translator(messages);
  const note = isShapeChoice(slug) ? undefined : planarMeasurementNote(slug, mode.id, values);
  return <figure className={styles.measurement} data-input-guide data-geometry-guide>
    <GeometryDiagram slug={slug} mode={mode.id} values={values} messages={messages}/>
    <figcaption><strong>{t(mode.formula)}</strong><small>{t('Diagram is not to scale.')}</small>{note && <p>{t(note)}</p>}</figcaption>
    <details><summary>{t('Which measurements do I need?')}</summary><p>{t(mode.explanation)}</p></details>
  </figure>;
}
