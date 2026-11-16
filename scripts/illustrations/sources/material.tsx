import styles from './drawing-styles';
import type {Measurement} from '@/components/calculators/material-measurement-diagram';

function Dimension({x1, y1, x2, y2, label, x, y}: {x1: number; y1: number; x2: number; y2: number; label: string; x: number; y: number}) {
  const length = Math.hypot(x2 - x1, y2 - y1), dx = (x2 - x1) / length, dy = (y2 - y1) / length;
  const arrow = (px: number, py: number, sign: number) => `M${px + sign * 6 * dx - 4 * dy} ${py + sign * 6 * dy + 4 * dx} L${px} ${py} L${px + sign * 6 * dx + 4 * dy} ${py + sign * 6 * dy - 4 * dx}`;
  return <><path className={styles.dimension} d={`M${x1} ${y1} L${x2} ${y2} ${arrow(x1, y1, 1)} ${arrow(x2, y2, -1)}`}/><text className={styles.label} x={x} y={y}>{label}</text></>;
}

export function MaterialDrawingSource({measurement}: {measurement: Measurement}) {
  const {shape, labels: labels = []} = measurement;
  return <svg className={styles.diagram} viewBox="0 0 260 180" width="260" height="180" role="img" aria-label={measurement.description} focusable="false">
    {(shape === 'rectangle' || shape === 'border') && <>
      <g className={styles.outline}><rect x="40" y="35" width="165" height="95"/>{shape === 'border' && <rect x="63" y="58" width="119" height="49" fill="var(--color-surface)"/>}</g>
      <Dimension x1={40} y1={150} x2={205} y2={150} label={labels[0]} x={122} y={173}/>
      <Dimension x1={227} y1={35} x2={227} y2={130} label={labels[1]} x={244} y={88}/>
      {shape === 'border' && <Dimension x1={40} y1={80} x2={63} y2={80} label={labels[2]} x={51} y={68}/>}
    </>}
    {(shape === 'circle' || shape === 'ring') && <>
      <g className={styles.outline}><circle cx="125" cy="85" r="58"/>{shape === 'ring' && <circle cx="125" cy="85" r="33" fill="var(--color-surface)"/>}</g>
      <Dimension x1={67} y1={85} x2={183} y2={85} label={labels[0]} x={125} y={75}/>
      {shape === 'ring' && <Dimension x1={148.33} y1={108.33} x2={166.01} y2={126.01} label={labels[1]} x={191} y={145}/>}
    </>}
    {(shape === 'triangle' || shape === 'base-height') && <>
      <g className={styles.outline}><path d="M34 134 H223 L109 30 Z"/></g>
      {shape === 'triangle' ? <>
        <text className={styles.label} x="183" y="75">{labels[0]}</text><text className={styles.label} x="54" y="77">{labels[1]}</text><text className={styles.label} x="127" y="159">{labels[2]}</text>
      </> : <>
        <path className={styles.height} d="M109 30 V134"/><path className={styles.measure} d="M109 122 H121 V134"/>
        <text className={styles.label} x="129" y="87">{labels[1]}</text><Dimension x1={34} y1={151} x2={223} y2={151} label={labels[0]} x={129} y={174}/>
      </>}
    </>}
    {(shape === 'trapezoid' || shape === 'parallelogram') && <>
      <g className={styles.outline}><path d={shape === 'trapezoid' ? 'M32 132 H226 L180 45 H78 Z' : 'M32 132 H181 L226 40 H77 Z'}/></g>
      <path className={styles.height} d={`M110 ${shape === 'trapezoid' ? 45 : 40} V132`}/><path className={styles.measure} d="M110 120 H122 V132"/>
      <text className={styles.label} x="131" y="91">{shape === 'trapezoid' ? labels[2] : labels[1]}</text>
      <Dimension x1={32} y1={152} x2={shape === 'trapezoid' ? 226 : 181} y2={152} label={shape === 'trapezoid' ? labels[1] : labels[0]} x={shape === 'trapezoid' ? 129 : 106} y={175}/>
      {shape === 'trapezoid' && <Dimension x1={78} y1={27} x2={180} y2={27} label={labels[0]} x={129} y={22}/>}
    </>}
    {shape === 'sector' && <>
      <g className={styles.outline}><path d="M76 132 V27 A105 105 0 0 1 174.67 96.09 Z"/></g><path className={styles.angle} d="M76 100 A32 32 0 0 1 106.07 121.06"/>
      <text className={styles.label} x="58" y="82">{labels[0]}</text><text className={styles.label} x="105" y="95">{labels[1]}</text>
    </>}
    {shape === 'slab' && <>
      <g className={styles.outline}><path d="M43 78 L98 36 H211 V105 L156 147 H43 Z"/><path d="M43 78 H156 V147 M156 78 L211 36" fill="none"/></g>
      <Dimension x1={43} y1={158} x2={156} y2={158} label={labels[0]} x={100} y={174}/>
      <Dimension x1={170} y1={153} x2={226} y2={110} label={labels[1]} x={220} y={148}/>
      <Dimension x1={25} y1={78} x2={25} y2={147} label={labels[2]} x={12} y={118}/>
    </>}
    {(shape === 'column' || shape === 'tube') && <>
      <g className={styles.outline}><path d="M65 45 V135 A65 19 0 0 0 195 135 V45 Z"/><ellipse cx="130" cy="45" rx="65" ry="19"/>{shape === 'tube' && <ellipse cx="130" cy="45" rx="34" ry="10" fill="var(--color-surface)"/>}</g>
      <path className={styles.height} d="M65 135 A65 19 0 0 1 195 135"/>
      <Dimension x1={65} y1={45} x2={195} y2={45} label={labels[0]} x={130} y={22}/>
      {shape === 'tube' && <><path className={styles.height} d="M96 45 V135 M164 45 V135"/><Dimension x1={96} y1={78} x2={164} y2={78} label={labels[1]} x={130} y={103}/></>}
      <Dimension x1={219} y1={45} x2={219} y2={135} label={shape === 'column' ? labels[1] : labels[2]} x={238} y={96}/>
    </>}
    {(shape === 'roof-pitch' || shape === 'roof-angle') && <>
      <g className={styles.outline}><path d="M42 132 L208 42 V132 Z"/></g><path className={styles.measure} d="M196 132 V120 H208"/>
      {shape === 'roof-pitch' ? <><Dimension x1={42} y1={152} x2={208} y2={152} label="12" x={125} y={174}/><Dimension x1={226} y1={42} x2={226} y2={132} label="p" x={243} y={93}/></> : <><path className={styles.angle} d="M82 132 A40 40 0 0 0 77.17 112.93"/><text className={styles.label} x="100" y="118">θ</text></>}
    </>}
    {shape === 'stairs' && <>
      <g className={styles.outline}><path d="M45 138 V113 H86 V88 H127 V63 H168 V38 H209 V138 Z"/></g>
      <Dimension x1={25} y1={38} x2={25} y2={138} label="H" x={12} y={95}/><Dimension x1={45} y1={155} x2={168} y2={155} label="R" x={106} y={174}/>
      <Dimension x1={86} y1={75} x2={127} y2={75} label="t" x={107} y={64}/><Dimension x1={61} y1={113} x2={61} y2={138} label="h" x={79} y={133}/>
      <path className={styles.height} d="M168 38 V148"/>
    </>}
    {shape === 'tiles' && <>
      <g className={styles.outline}><rect x="45" y="35" width="112" height="90"/><rect x="193" y="62" width="40" height="40"/></g>
      <Dimension x1={45} y1={144} x2={157} y2={144} label="L" x={94} y={167}/><Dimension x1={30} y1={35} x2={30} y2={125} label="W" x={14} y={86}/>
      <Dimension x1={193} y1={120} x2={233} y2={120} label="l" x={213} y={144}/><text className={styles.label} x="246" y="89">w</text>
    </>}
  </svg>;
}

