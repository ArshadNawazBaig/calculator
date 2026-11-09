import type {Metadata} from 'next';
import {connection} from 'next/server';

export const metadata: Metadata = {
  title: {default: 'Blog administration | Finflo', template: '%s | Finflo admin'},
  robots: {index: false, follow: false, nocache: true},
};
export const runtime = 'nodejs';
export default async function AdminLayout({children}: {children: React.ReactNode}) {await connection(); return children;}
