import {BookOpen, Calculator, Clock3, Disc3, FolderHeart, Info, type LucideIcon} from 'lucide-react';

export type NavigationLink = {label: string; href: string; icon: LucideIcon};

export const navigationLinks: NavigationLink[] = [
  {label: 'Calculators', href: '/calculators', icon: Calculator},
  {label: 'Spin wheels', href: '/spin-wheels', icon: Disc3},
  {label: 'Time & clocks', href: '/time', icon: Clock3},
  {label: 'My workspace', href: '/workspace', icon: FolderHeart},
];

export const secondaryNavigationLinks: NavigationLink[] = [
  {label: 'Guides', href: '/guides', icon: BookOpen},
  {label: 'About Finflo', href: '/about', icon: Info},
];

export function isNavigationActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
