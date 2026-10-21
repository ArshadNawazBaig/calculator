import {describe, expect, it, vi} from 'vitest';
import {locales, isPublishedLocale} from '@/lib/i18n/config';
import {localizedPage, localizedStaticParams} from '@/lib/i18n/pages';

vi.mock('next/navigation', async importOriginal => ({
  ...await importOriginal<typeof import('next/navigation')>(),
  redirect: (destination: string) => {throw new Error(`Redirect to ${destination}`);},
}));

describe('translation publication guards', () => {
  it.each(locales.filter(locale => !isPublishedLocale(locale)))('%s retains its renderer but cannot render unpublished content', async locale => {
    expect(localizedStaticParams(locale)).toEqual([]);
    const page = localizedPage(locale);
    await expect(page({params: Promise.resolve({path: ['grade-calculator']}), searchParams: Promise.resolve({mode: 'points', term: ['a+b', 'c']})}))
      .rejects.toThrow('Redirect to /grade-calculator?mode=points&term=a%2Bb&term=c');
    await expect(page({params: Promise.resolve({})})).rejects.toThrow('Redirect to /');
    await expect(page({params: Promise.resolve({path: ['unknown-route']})})).rejects.toThrow('Redirect to /unknown-route');
  });

  it('encodes decoded route segments so the fallback cannot redirect to another origin', async () => {
    await expect(localizedPage('tl')({params: Promise.resolve({path: ['/outside.example']})}))
      .rejects.toThrow('Redirect to /%2Foutside.example');
  });
});
