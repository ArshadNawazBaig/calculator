import {site} from './site';
import {localizedPath, type Locale} from './i18n/config';

export function organizationData() {
  return {
    '@type': 'Organization', '@id': `${site.url}/#organization`,
    name: site.name, url: site.url, logo: `${site.url}/icon-512.png`,
  };
}

export function breadcrumbData(items: {name: string; path: string}[], locale: Locale = 'en') {
  return {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: items.map(({name, path}, i) => ({
      '@type': 'ListItem', position: i + 1, name, item: site.url + localizedPath(path, locale),
    })),
  };
}

export function guideData(title: string, description: string, path: string, locale: Locale = 'en') {
  const url = site.url + localizedPath(path, locale);
  return {
    '@context': 'https://schema.org', '@type': 'Article', '@id': `${url}#article`,
    headline: title, description, url, mainEntityOfPage: url, inLanguage: locale,
    author: {...organizationData(), url: site.url + localizedPath('/about', locale)},
    publisher: organizationData(),
  };
}
