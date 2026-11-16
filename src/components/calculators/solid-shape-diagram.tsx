import {translator, type Dictionary} from '@/lib/i18n/config';
import styles from './area-shapes.module.css';

const descriptions: Record<string, string> = {
  sphere: 'Sphere with radius r from the center to its surface',
  cone: 'Right circular cone with base radius r and perpendicular height h, not slant height',
  cube: 'Cube with edge length a; all edges have the same length',
  cylinder: 'Closed cylinder with radius r and perpendicular height h',
  cuboid: 'Rectangular prism with length a, width b, and perpendicular height h',
  capsule: 'Capsule with radius r and straight cylinder length h between its two hemispherical ends',
  cap: 'Spherical cap with sphere radius r and cap height h from the cutting plane to the top of the sphere',
  frustum: 'Right conical frustum with bottom radius r, top radius r₂, and perpendicular height h',
  ellipsoid: 'Ellipsoid with three semi-axes from its center: a to the right, b into the depth, and c upwards',
  pyramid: 'Right rectangular pyramid with base length a, base width b, and height h perpendicular to the center of its base',
  tube: 'Hollow cylinder with outer radius r, inner radius r₂, and height h; both radii start at the same center',
};

const iconFrames: Record<string, string> = {
  sphere: '61 16 138 138', cone: '54 10 152 156', cube: '47 10 165 145',
  cylinder: '54 17 152 145', cuboid: '35 21 188 138', capsule: '28 33 204 114',
  cap: '59 28 142 80', frustum: '46 20 168 142', ellipsoid: '24 22 212 138',
  pyramid: '33 12 194 155', tube: '54 17 152 145', 'cap-inverse': '59 28 142 80',
};

function Dimension({x1, y1, x2, y2, label, labelX, labelY, both = true}: {
  x1: number; y1: number; x2: number; y2: number; label: string; labelX: number; labelY: number; both?: boolean;
}) {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const dx = (x2 - x1) / length;
  const dy = (y2 - y1) / length;
  const tip = (x: number, y: number, direction: number) => `M${x + direction * 6 * dx - 4 * dy} ${y + direction * 6 * dy + 4 * dx} L${x} ${y} L${x + direction * 6 * dx + 4 * dy} ${y + direction * 6 * dy - 4 * dx}`;
  return <>
    <path className={styles.dimension} d={`M${x1} ${y1} L${x2} ${y2} ${both ? tip(x1, y1, 1) : ''} ${tip(x2, y2, -1)}`}/>
    <text className={styles.label} x={labelX} y={labelY}>{label}</text>
  </>;
}

function Center({x, y}: {x: number; y: number}) {
  return <circle className={styles.point} cx={x} cy={y} r="3"/>;
}

/** Native, server-rendered vectors shared by solid selectors and measurement guides. */
export function SolidShapeDiagram({shape, compact = false, known = 'base-height', messages = {}}: {
  shape: string; compact?: boolean; known?: string; messages?: Dictionary;
}) {
  const t = translator(messages);
  const cap = shape === 'cap' || shape === 'cap-inverse';
  const capHeight = shape === 'cap' || known === 'base-height';
  const sphereRadius = shape === 'cap' || known === 'sphere-base';
  const description = shape === 'cap-inverse'
    ? known === 'sphere-base'
      ? 'Minor spherical cap with sphere radius r and circular base radius a; the same radii can also describe a major cap'
      : 'Spherical cap with circular base radius a and cap height h measured perpendicular to the base'
    : descriptions[shape];

  return <svg className={styles.diagram} data-compact={compact || undefined}
    viewBox={compact ? iconFrames[shape] : '0 0 260 180'} width="260" height="180"
    role={compact ? undefined : 'img'} aria-label={compact ? undefined : t(description)}
    aria-hidden={compact || undefined} focusable="false">
    {shape === 'sphere' && <>
      <g className={styles.outline}><circle cx="130" cy="85" r="57"/></g>
      <path className={styles.height} d="M73 85 A57 16 0 0 1 187 85"/>
      <path className={styles.measure} d="M73 85 A57 16 0 0 0 187 85"/>
      {!compact && <><Dimension x1={130} y1={85} x2={187} y2={85} label="r" labelX={158} labelY={72} both={false}/><Center x={130} y={85}/></>}
    </>}
    {shape === 'cone' && <>
      <g className={styles.outline}><path d="M65 135 L130 22 L195 135 A65 18 0 0 1 65 135 Z"/></g>
      <path className={styles.height} d="M65 135 A65 18 0 0 1 195 135"/>
      {!compact && <>
        <path className={styles.height} d="M130 22 V135"/>
        <path className={styles.measure} d="M130 124 H141 V135"/>
        <text className={styles.label} x="111" y="88">h</text>
        <Dimension x1={130} y1={135} x2={195} y2={135} label="r" labelX={166} labelY={123} both={false}/>
      </>}
    </>}
    {(shape === 'cube' || shape === 'cuboid') && <>
      <g className={styles.outline}>
        {shape === 'cube' ? <>
          <path d="M59 52 L107 22 H199 V112 L151 143 H59 Z"/>
          <path d="M59 52 H151 V143 M151 52 L199 22" fill="none"/>
        </> : <>
          <path d="M47 64 L97 33 H211 V112 L161 143 H47 Z"/>
          <path d="M47 64 H161 V143 M161 64 L211 33" fill="none"/>
        </>}
      </g>
      {!compact && (shape === 'cube'
        ? <Dimension x1={59} y1={150} x2={151} y2={150} label="a" labelX={105} labelY={173}/>
        : <>
          <Dimension x1={47} y1={150} x2={161} y2={150} label="a" labelX={104} labelY={173}/>
          <Dimension x1={173} y1={151} x2={223} y2={120} label="b" labelX={212} labelY={154}/>
          <path className={styles.extension} d="M41 64 H23 M41 143 H23"/>
          <Dimension x1={29} y1={64} x2={29} y2={143} label="h" labelX={13} labelY={110}/>
        </>)}
    </>}
    {(shape === 'cylinder' || shape === 'tube') && <>
      <g className={styles.outline}>
        <path d="M66 46 V132 A64 18 0 0 0 194 132 V46 A64 18 0 0 1 66 46 Z"/>
        {shape === 'tube'
          ? <path d="M66 46 A64 18 0 1 0 194 46 A64 18 0 1 0 66 46 Z M97 46 A33 9.3 0 1 0 163 46 A33 9.3 0 1 0 97 46 Z" fillRule="evenodd"/>
          : <ellipse cx="130" cy="46" rx="64" ry="18"/>}
      </g>
      <path className={styles.height} d="M66 132 A64 18 0 0 1 194 132"/>
      {shape === 'tube' && <path className={styles.height} d="M97 46 V132 A33 9.3 0 0 0 163 132 V46 M97 132 A33 9.3 0 0 1 163 132"/>}
      {!compact && <>
        <path className={styles.extension} d="M200 46 H231 M200 132 H231"/>
        <Dimension x1={224} y1={46} x2={224} y2={132} label="h" labelX={243} labelY={96}/>
        <Dimension x1={130} y1={46} x2={194} y2={46} label="r" labelX={171} labelY={29} both={false}/>
        {shape === 'tube' && <Dimension x1={130} y1={46} x2={97} y2={46} label="r₂" labelX={106} labelY={28} both={false}/>}
        <Center x={130} y={46}/>
      </>}
    </>}
    {shape === 'capsule' && <>
      <g className={styles.outline}><path d="M85 45 H175 A45 45 0 0 1 175 135 H85 A45 45 0 0 1 85 45 Z"/></g>
      <path className={styles.height} d="M85 45 A13 45 0 0 0 85 135 M175 45 A13 45 0 0 0 175 135"/>
      <path className={styles.measure} d="M85 45 A13 45 0 0 1 85 135 M175 45 A13 45 0 0 1 175 135"/>
      {!compact && <>
        <path className={styles.extension} d="M85 39 V28 M175 39 V28"/>
        <Dimension x1={85} y1={34} x2={175} y2={34} label="h" labelX={130} labelY={22}/>
        <Dimension x1={175} y1={90} x2={175} y2={45} label="r" labelX={193} labelY={76} both={false}/>
        <Center x={175} y={90}/>
      </>}
    </>}
    {cap && <>
      {!compact && sphereRadius && <circle className={styles.height} cx="130" cy="105" r="66"/>}
      <g className={styles.outline}><path d="M68.137 82 A66 66 0 0 1 191.863 82 A61.863 16 0 0 1 68.137 82 Z"/></g>
      <path className={styles.height} d="M68.137 82 A61.863 16 0 0 1 191.863 82"/>
      {!compact && <>
        {capHeight && <>
          <path className={styles.extension} d="M130 39 H227 M198 82 H227"/>
          <Dimension x1={220} y1={39} x2={220} y2={82} label="h" labelX={241} labelY={68}/>
        </>}
        {sphereRadius && <>
          <Dimension x1={130} y1={105} x2={176.669} y2={151.669} label="r" labelX={142} labelY={142} both={false}/>
          <Center x={130} y={105}/>
        </>}
        {shape === 'cap-inverse' && <>
          <Dimension x1={130} y1={82} x2={191.863} y2={82} label="a" labelX={163} labelY={71} both={false}/>
          <Center x={130} y={82}/>
        </>}
      </>}
    </>}
    {shape === 'frustum' && <>
      <g className={styles.outline}>
        <path d="M91 44 L58 131 A72 20 0 0 0 202 131 L169 44 Z"/>
        <ellipse cx="130" cy="44" rx="39" ry="12"/>
      </g>
      <path className={styles.height} d="M58 131 A72 20 0 0 1 202 131"/>
      {!compact && <>
        <path className={styles.extension} d="M175 44 H233 M208 131 H233"/>
        <Dimension x1={226} y1={44} x2={226} y2={131} label="h" labelX={246} labelY={95}/>
        <Dimension x1={130} y1={44} x2={169} y2={44} label="r₂" labelX={149} labelY={24} both={false}/>
        <Dimension x1={130} y1={131} x2={202} y2={131} label="r" labelX={168} labelY={119} both={false}/>
        <Center x={130} y={44}/><Center x={130} y={131}/>
      </>}
    </>}
    {shape === 'ellipsoid' && <>
      <g className={styles.outline}><ellipse cx="130" cy="90" rx="94" ry="51.35" transform="rotate(5.96 130 90)"/></g>
      <path className={styles.height} d="M218 90 C200.327 78.954 146.6 70 98 70 C49.4 70 24.327 78.954 42 90"/>
      <path className={styles.measure} d="M42 90 C59.673 101.046 113.4 110 162 110 C210.6 110 235.673 101.046 218 90"/>
      {!compact && <>
        <Dimension x1={130} y1={90} x2={218} y2={90} label="a" labelX={182} labelY={81} both={false}/>
        <Dimension x1={130} y1={90} x2={98} y2={70} label="b" labelX={94} labelY={62} both={false}/>
        <Dimension x1={130} y1={90} x2={130} y2={42} label="c" labelX={148} labelY={62} both={false}/>
        <Center x={130} y={90}/>
      </>}
    </>}
    {shape === 'pyramid' && <>
      <g className={styles.outline}>
        <path d="M45 132 L143 155 L215 117 L130 24 Z"/>
        <path d="M130 24 L143 155" fill="none"/>
      </g>
      <path className={styles.height} d="M45 132 L117 94 L215 117 M117 94 L130 24"/>
      {!compact && <>
        <path className={styles.height} d="M130 24 V124.5"/>
        <path className={styles.measure} d="M130 114.5 L139 116.6 V126.6"/>
        <text className={styles.label} x="112" y="83">h</text>
        <text className={styles.label} x="85" y="166">a</text>
        <text className={styles.label} x="193" y="155">b</text>
      </>}
    </>}
  </svg>;
}
