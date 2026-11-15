import type {Mode, Values} from '@/lib/calculators/types';
import {AreaShapeDiagram} from './area-shape-diagram';
import {SolidShapeDiagram} from './solid-shape-diagram';
import {PlanarShapeDiagram, planarMeasurementNote} from './planar-shape-diagram';
import styles from './area-shapes.module.css';

const solids = ['volume-calculator', 'surface-area-calculator'];
const isShapeChoice = (slug: string) => slug === 'area-calculator' || solids.includes(slug);

export function GeometryDiagram({slug, mode, values, compact = false}: {
  slug: string; mode: string; values?: Values; compact?: boolean;
}) {
  if (slug === 'area-calculator') return <AreaShapeDiagram shape={mode} compact={compact}/>;
  if (solids.includes(slug)) return <SolidShapeDiagram shape={mode} known={values?.known} compact={compact}/>;
  return <PlanarShapeDiagram slug={slug} mode={mode} values={values} compact={compact}/>;
}

function choiceLabel(slug: string, mode: Mode) {
  if (slug === 'area-calculator' && mode.id === 'triangle') return 'Triangle: base & height';
  if (slug === 'area-calculator' && mode.id === 'triangle-sss') return 'Triangle: 3 sides';
  if (solids.includes(slug) && mode.id === 'cap-inverse') return 'Cap: other measurements';
  return mode.title;
}

export function GeometryModePicker({slug, modes, selected, disabled, onChange}: {
  slug: string; modes: Mode[]; selected: string; disabled: boolean; onChange: (id: string) => void;
}) {
  return <fieldset className={styles.picker} disabled={disabled}>
    <legend>{isShapeChoice(slug) ? 'Choose a shape' : 'Choose known measurements'}</legend>
    <div className={styles.choices} data-methods={!isShapeChoice(slug) || undefined}>
      {modes.map(mode => <button type="button" key={mode.id} aria-pressed={mode.id === selected}
        aria-controls="calculator-inputs" onClick={() => {if (mode.id !== selected) onChange(mode.id);}}>
        <GeometryDiagram slug={slug} mode={mode.id} compact/>
        <span>{choiceLabel(slug, mode)}</span>
      </button>)}
    </div>
  </fieldset>;
}

export function GeometryMeasurementGuide({slug, mode, values}: {slug: string; mode: Mode; values: Values}) {
  const note = isShapeChoice(slug) ? undefined : planarMeasurementNote(slug, mode.id, values);
  return <figure className={styles.measurement} data-input-guide>
    <GeometryDiagram slug={slug} mode={mode.id} values={values}/>
    <figcaption><strong>{mode.formula}</strong><small>Diagram is not to scale.</small>{note && <p>{note}</p>}</figcaption>
    <details><summary>Which measurements do I need?</summary><p>{mode.explanation}</p></details>
  </figure>;
}
