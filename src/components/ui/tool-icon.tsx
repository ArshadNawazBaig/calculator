import {CircleHelp, Disc3, Hash, ListChecks, Palette, PartyPopper, UsersRound, Utensils, type LucideIcon, type LucideProps} from 'lucide-react';
import {calculatorIcons} from '@/lib/calculator-icons';

const wheelIcons: Record<string, LucideIcon> = {'spin-the-wheel': Disc3, 'wheel-of-names': UsersRound, 'yes-or-no-wheel': CircleHelp, 'number-picker-wheel': Hash, 'what-to-eat-wheel': Utensils, 'random-color-wheel': Palette, 'truth-or-dare-wheel': PartyPopper, 'activity-wheel': ListChecks};

export function ToolIcon({slug,...props}:{slug:string}&LucideProps){
  const Component=calculatorIcons[slug] || wheelIcons[slug];
  if(!Component)return null;
  return <Component aria-hidden="true" focusable="false" strokeWidth={1.8} data-tool-icon={slug} {...props}/>;
}
