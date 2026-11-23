'use client';

import {createContext, useContext, type ReactNode} from 'react';
import type {Locale} from '@/lib/i18n/config';
import {supportsZone} from '@/lib/time/engine';
import {ClockComparison} from './clock-comparison';

export const SelectedClockZone = createContext('UTC');

export function SelectedClockComparison({children, at, locale}: {
  children: ReactNode; at: number; locale: Locale;
}) {
  const zone = useContext(SelectedClockZone);
  // Keep the server's formatted UTC example for the first render and for visitors without JavaScript.
  if (zone === 'UTC') return children;
  if (!supportsZone(zone)) return null;
  return <ClockComparison key={zone} zoneId={zone} at={at} locale={locale}/>;
}
