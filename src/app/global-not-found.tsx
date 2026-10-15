import type {Metadata} from 'next';
import RootLayout from './(en)/layout';
import {NotFoundContent} from '@/components/content/not-found-content';

export {viewport} from '@/lib/base-metadata';
export const metadata: Metadata = {
  title: 'Page not found | Finflo',
  description: 'This page may have moved. Browse the directory to find a calculator.',
  robots: {index: false, follow: true},
};

// Global not-found bypasses route layouts. Reuse the English document so the
// font, theme, header, footer, preferences and skip link stay consistent.
export default function GlobalNotFound() {
  return <RootLayout><NotFoundContent/></RootLayout>;
}
