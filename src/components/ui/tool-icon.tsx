import type {LucideProps} from 'lucide-react';
import {calculatorIcons} from '@/lib/calculator-icons';

export function ToolIcon({slug,...props}:{slug:string}&LucideProps){
  const Component=calculatorIcons[slug];
  if(!Component)return null;
  return <Component aria-hidden="true" focusable="false" strokeWidth={1.8} data-tool-icon={slug} {...props}/>;
}
