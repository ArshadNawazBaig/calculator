import Image from 'next/image';
import illustrations from '@/data/illustrations.json';
import {translator, type Dictionary} from '@/lib/i18n/config';

type Illustration = {src: string; width: number; height: number; alt: string};
const assets = illustrations as Record<string, Illustration>;

export function ContentIllustration({id, alt, compact = false, messages = {}, className, sizes = 'auto, 240px'}: {
  id: string; alt?: string; compact?: boolean; messages?: Dictionary; className?: string; sizes?: string;
}) {
  const asset = assets[id];
  if (!asset) return null;
  return <Image src={asset.src} overrideSrc={asset.src} width={asset.width} height={asset.height}
    alt={compact ? '' : alt ?? translator(messages)(asset.alt)}
    aria-hidden={compact || undefined} data-compact={compact || undefined}
    className={className} sizes={compact ? undefined : sizes} loading="lazy"/>;
}
