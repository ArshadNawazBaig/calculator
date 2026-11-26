import type {Mode} from '@/lib/calculators/types';
import type {CategoryId} from '@/lib/site';
import {calculationModeIconName} from '@/lib/calculators/mode-icons';
import {SpriteIcon} from '@/components/ui/tool-icon';
import sprite from '@/assets/mode-icons.svg';
export {calculationAlgorithmIcons, calculationModeIconName} from '@/lib/calculators/mode-icons';

export function CalculationModeIcon(props: {
  slug: string; mode: Pick<Mode, 'id' | 'algorithm'>; category: CategoryId;
}) {
  const name = calculationModeIconName(props);
  return <SpriteIcon sprite={sprite} symbol={name} size={24} strokeWidth={1.75} data-mode-icon={name}/>;
}
