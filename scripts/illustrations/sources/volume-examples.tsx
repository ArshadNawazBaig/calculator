import type {ReactNode} from 'react';
import {CalculatorArtwork, calculatorPalettes} from './calculator-artwork';

const palette = calculatorPalettes.math;

function MeasurementTile({position, value, children}: {position: 'upper' | 'lower'; value: string; children: ReactNode}) {
  const upper = position === 'upper';
  const ink = upper ? palette.dark : palette.accent;
  return <g transform={upper ? 'translate(841 181)' : 'translate(962 411)'}>
    <g transform="scale(3.6)" fill="none" stroke={ink} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{children}</g>
    <text y={upper ? 92 : 86} textAnchor="middle" fill={ink} fontFamily="Arial, sans-serif" fontSize="48" fontWeight="600">{value}</text>
  </g>;
}

function DepthMark() {
  return <path d="M-7 -11 H7 M-7 11 H7 M0 -10 V10 M-3 -6 L0 -10 L3 -6 M-3 6 L0 10 L3 6"/>;
}

export function TankWaterline() {
  const tank = <g fill="none" stroke={palette.accent} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
    {/* On the front wall, the waterline sits one eighth of the wall height below the rim. */}
    <path d="M181 305 H365 L433 261 V345 L365 389 H181 Z" fill={palette.accent} fillOpacity=".08" stroke="none"/>
    <path d="M181 305 L249 261 H433 L365 305 Z" fill={palette.accent} fillOpacity=".14" stroke="none"/>
    <path d="M181 293 L249 249 H433 V345 L365 389 H181 Z M181 293 H365 L433 249 M365 293 V389"/>
    <path d="M187 305 H365 L427 265" strokeWidth="4" strokeDasharray="10 9"/>
    <path d="M231 345 Q241 336 251 345 T271 345 T291 345" strokeWidth="5.5"/>
  </g>;
  return <CalculatorArtwork palette={palette}
    description="A rectangular tank filled to a water depth of 35 cm holds 175 L. A dashed line marks the water surface below the rim."
    primary={tank}
    upper={<MeasurementTile position="upper" value="35 cm"><DepthMark/></MeasurementTile>}
    lower={<MeasurementTile position="lower" value="175 L">
      <path d="M0 -11 C-1 -7 -8 -1 -8 4 A8 8 0 0 0 8 4 C8 -1 1 -7 0 -11 Z"/>
    </MeasurementTile>}/>;
}

export function TaperedPlanter() {
  const pot = <g fill="none" stroke={palette.accent} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
    {/* Straight sides narrow from 32 cm at the rim to 20 cm at the base. */}
    <path d="M198.5 258 Q310 289 421.5 258 L384 406 Q310 432 236 406 Z" fill={palette.accent} fillOpacity=".10" stroke="none"/>
    <ellipse cx="310" cy="228" rx="119" ry="25"/>
    <path d="M191 228 L236 406 Q310 432 384 406 L429 228"/>
    <path d="M198.5 258 Q310 289 421.5 258" strokeWidth="5" strokeDasharray="12 9"/>
  </g>;
  return <CalculatorArtwork palette={palette}
    description="A tapered planter with a dashed soil line. The pot is 30 cm across at the soil line, and the soil is 20 cm deep."
    primary={pot}
    upper={<MeasurementTile position="upper" value="30 cm">
      <ellipse rx="13" ry="7.8" strokeWidth="1.4"/>
      <path d="M-12.5 0 H12.5 M-9.5 -2.7 L-12.5 0 L-9.5 2.7 M9.5 -2.7 L12.5 0 L9.5 2.7" strokeWidth="1.25"/>
    </MeasurementTile>}
    lower={<MeasurementTile position="lower" value="20 cm"><DepthMark/></MeasurementTile>}/>;
}

function PipeDiameter({outside = false}: {outside?: boolean}) {
  const radius = outside ? 12 : 9.6;
  return <>
    <circle r="12" strokeWidth={outside ? 1.7 : .9} opacity={outside ? 1 : .42}/>
    <circle r="9.6" strokeWidth={outside ? .9 : 1.7} opacity={outside ? .42 : 1}/>
    <path d={`M${-radius} 0 H${radius} M${3 - radius} -2.5 L${-radius} 0 L${3 - radius} 2.5 M${radius - 3} -2.5 L${radius} 0 L${radius - 3} 2.5`} strokeWidth="1.25"/>
  </>;
}

export function PipeSection() {
  const pipe = <g transform="translate(310 315) rotate(-27)" fill="none" stroke={palette.accent} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <pattern id="pipe-hatching" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <path d="M0 0 V9" stroke={palette.accent} strokeWidth="3" strokeLinecap="butt"/>
      </pattern>
    </defs>
    <path d="M-66 -75 H66 A49 75 0 0 1 66 75 H-66 A49 75 0 0 0 -66 -75 Z" fill={palette.accent} fillOpacity=".05" stroke="none"/>
    <path d="M-66 -75 H66 A49 75 0 0 1 66 75 H-66"/>
    {/* The bore is four fifths of the outside diameter. Only the annulus is hatched. */}
    <path fill="url(#pipe-hatching)" fillRule="evenodd" stroke="none"
      d="M-115 0 a49 75 0 1 0 98 0 a49 75 0 1 0 -98 0 Z M-105.2 0 a39.2 60 0 1 0 78.4 0 a39.2 60 0 1 0 -78.4 0 Z"/>
    <ellipse cx="-66" rx="49" ry="75" strokeWidth="7"/>
    <ellipse cx="-66" rx="39.2" ry="60" strokeWidth="4.5"/>
  </g>;
  return <CalculatorArtwork palette={palette}
    description="A hollow pipe with a hatched wall. The inside diameter is 4 cm and the outside diameter is 5 cm."
    primary={pipe}
    upper={<MeasurementTile position="upper" value="4 cm"><PipeDiameter/></MeasurementTile>}
    lower={<MeasurementTile position="lower" value="5 cm"><PipeDiameter outside/></MeasurementTile>}/>;
}
