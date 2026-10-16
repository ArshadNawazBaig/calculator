import {ToolChooser} from './tool-chooser';
import {PageHero} from './page-hero';
import {CategoryNavigation} from './category-navigation';
import {StudentTools} from './student-tools';
import {JsonLd} from './json-ld';
import {studentDirectory, studentTools, studentToolHref} from '@/lib/student-tools';
import {localizedPath, translator, type Dictionary, type Locale} from '@/lib/i18n/config';
import {breadcrumbData} from '@/lib/structured-data';
import {site} from '@/lib/site';

export function StudentDirectory({locale = 'en', messages = {}}: {locale?: Locale; messages?: Dictionary}) {
  const t = translator(messages);
  return <>
    <PageHero eyebrow={t('The calculator library')} title={t(studentDirectory.title)} description={t(studentDirectory.description)} breadcrumbs={[{label: t('All calculators'), href: '/calculators'}, {label: t('Student tools')}]}/>
    <div className="container directory-page page-content">
      <CategoryNavigation currentPath={studentDirectory.path} locale={locale} messages={messages}/>
      <StudentTools locale={locale} messages={messages}/>
      <ToolChooser slugs={studentTools.map(tool => tool.slug)} locale={locale} messages={messages}/>
    </div>
    <JsonLd data={{'@context': 'https://schema.org', '@type': 'CollectionPage', name: t(studentDirectory.title), description: t(studentDirectory.description), url: site.url + localizedPath(studentDirectory.path, locale), inLanguage: locale, mainEntity: {'@type': 'ItemList', itemListElement: studentTools.map((tool, index) => ({'@type': 'ListItem', position: index + 1, name: t(tool.title), url: site.url + localizedPath(studentToolHref(tool), locale)}))}}}/>
    <JsonLd data={breadcrumbData([{name: t('Home'), path: '/'}, {name: t('All calculators'), path: '/calculators'}, {name: t(studentDirectory.title), path: studentDirectory.path}], locale)}/>
  </>;
}
