import type {SVGProps} from 'react';
import toolSprite from '@/assets/tool-icons.svg';

type ToolIconProps = SVGProps<SVGSVGElement> & {slug: string; size?: number | string};

export function SpriteIcon({sprite, symbol, size = 24, color = 'currentColor', ...props}: SVGProps<SVGSVGElement> & {
  sprite: string | {src: string}; symbol: string; size?: number | string;
}) {
  return <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <use href={`${typeof sprite === 'string' ? sprite : sprite.src}#${symbol}`}/>
  </svg>;
}

export function ToolIcon({slug, ...props}: ToolIconProps) {
  return <SpriteIcon sprite={toolSprite} symbol={slug} data-tool-icon={slug} {...props}/>;
}
