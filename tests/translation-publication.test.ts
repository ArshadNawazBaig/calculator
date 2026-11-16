import {afterEach, describe, expect, it, vi} from 'vitest';
import {locales, publishedLocales, type Locale} from '@/lib/i18n/config';
import {localizedPage, localizedStaticParams} from '@/lib/i18n/pages';

const publication = vi.hoisted(() => ({withdrawn: null as string | null}));
vi.mock('@/lib/i18n/config', async importOriginal => {
  const config = await importOriginal<typeof import('@/lib/i18n/config')>();
  return {...config, isPublishedLocale: (locale: Locale) => locale !== publication.withdrawn && config.isPublishedLocale(locale)};
});
vi.mock('next/navigation', async importOriginal => ({
  ...await importOriginal<typeof import('next/navigation')>(),
  redirect: (destination: string) => {throw new Error(`Redirect to ${destination}`);},
}));
afterEach(() => {publication.withdrawn = null;});

describe('translation publication', () => {
  it('enables every supported language', () => {
    expect(publishedLocales).toEqual(locales);
  });

  it.each(locales)('%s generates translated landing and calculator routes', locale => {
    const paths = localizedStaticParams(locale);
    expect(paths).toContainEqual({path: []});
    expect(paths).toContainEqual({path: ['grade-calculator']});
    expect(paths).toContainEqual({path: ['workspace']});
  });

  it.each(locales.filter(locale => locale !== 'en'))('%s renders its homepage without redirecting to English', async locale => {
    await expect(localizedPage(locale)({params: Promise.resolve({})})).resolves.toBeTruthy();
  });

  it('retains safe temporary redirects if a language is later withdrawn', async () => {
    publication.withdrawn = 'tl';
    expect(localizedStaticParams('tl')).toEqual([]);
    const page = localizedPage('tl');
    await expect(page({params: Promise.resolve({path: ['grade-calculator']}), searchParams: Promise.resolve({mode: 'points', term: ['a+b', 'c']})}))
      .rejects.toThrow('Redirect to /grade-calculator?mode=points&term=a%2Bb&term=c');
    await expect(page({params: Promise.resolve({})})).rejects.toThrow('Redirect to /');
    await expect(page({params: Promise.resolve({path: ['unknown-route']})})).rejects.toThrow('Redirect to /unknown-route');
    await expect(page({params: Promise.resolve({path: ['/outside.example']})})).rejects.toThrow('Redirect to /%2Foutside.example');
  });
});
