import {DirectoryGuidance, directoryContent} from '@/components/content/directory-guidance';
import {Suspense} from 'react';
import {notFound} from 'next/navigation';
import Link from '@/components/i18n/link';
import {PageHero} from '@/components/content/page-hero';
import {SearchHero} from '@/components/content/search-hero';
import {SearchResults} from '@/components/content/search-results';
import {ToolDirectory} from '@/components/content/tool-directory';
import {FilterableToolDirectory} from '@/components/content/filterable-tool-directory';
import {CalculatorForm} from '@/components/calculators/calculator';
import {CalculatorCard} from '@/components/calculators/calculator-card';
import {JsonLd} from '@/components/content/json-ld';
import {LocalizedHome} from '@/components/i18n/localized-home';
import {CalculatorArticle} from '@/components/i18n/calculator-article';
import {TranslationMessages} from '@/components/i18n/provider';
import {getContentDictionary, calculatorMessages} from './content';
import {cardMessages} from './dictionaries';
import {breadcrumbData, guideData, organizationData} from '@/lib/structured-data';
import translatedPages from '@/data/locales/translated-pages.json';
import {catalog, toolMap, definitionMap, relatedTools, noInitialExampleTools, sensitiveTools, blocked} from '@/lib/calculators/registry';
import {calculate} from '@/lib/calculators/engine';
import {defaults} from '@/lib/calculators/types';
import {calculatorCardData} from '@/lib/calculator-cards';
import {categorySlug} from '@/lib/catalog-paths';
import {categories, site} from '@/lib/site';
import {information} from '@/data/information';
import {guides} from '@/data/guides';
import {pageMetadata} from '@/lib/metadata';
import {isTranslatedPage, localizedPath, translator, type Locale} from './config';

type PageProps = {params: Promise<{path?: string[]}>};
export const localizedLandingPaths = ['/', '/calculators', ...categories.map(c => `/calculators/${c.id}`), ...new Set(catalog.map(tool => `/calculators/${tool.category}/${categorySlug(tool.subcategory)}`))];
export function localizedStaticParams() {
  return [...new Set([...localizedLandingPaths,...translatedPages])].map(path => ({path: path.split('/').filter(Boolean)}));
}
function routeInfo(path: string) {
  if (path === '/') return {title: 'Find your answer.', description: 'Free calculators for money, health, math, and everyday life.'};
  if (path === '/sitemap') return {title:'Sitemap', description:'Browse Finflo’s calculators, categories, guides, and website information.'};
  if (path === '/calculators') return {title:'All calculators', description:directoryContent[path].description};
  const parts = path.split('/').filter(Boolean);
  const category = categories.find(c => c.id === parts[1]);
  if (parts[0] === 'calculators' && category && parts.length <= 3) {
    const subcategory = parts[2] && catalog.find(tool => tool.category === category.id && categorySlug(tool.subcategory) === parts[2])?.subcategory;
    if (parts[2] && !subcategory) return null;
    return {title: subcategory || category.label, description: directoryContent[path]?.description || category.description, category, subcategory};
  }
  if (path === '/search') return {title: 'Search calculators', description: 'Find the right tool for your next question.'};
  if (path === '/guides') return {title: 'Guides', description: 'Practical guides to the formulas, assumptions, and limits behind your calculations.'};
  if (parts[0] === 'guides' && parts.length === 2 && guides[parts[1]]) return {title: guides[parts[1]].title, description: guides[parts[1]].description, info: guides[parts[1]]};
  if (parts.length !== 1) return null;
  const slug = parts[0];
  if (information[slug]) return {title: ({about:'About Finflo',contact:'Contact',privacy:'Privacy',terms:'Terms','editorial-policy':'Editorial policy',accessibility:'Accessibility',disclaimer:'Disclaimer',cookies:'Cookies'} as Record<string,string>)[slug] || information[slug].title, description: information[slug].description, info: information[slug]};
  const tool = toolMap.get(slug);
  if (tool) return {title: `tool.${slug}`, description: definitionMap.get(slug)?.description || blocked[slug] || 'Explore calculators for property and home ownership.', tool};
  if(slug==='maintenance')return {title:'We’ll be back shortly.',description:'Finflo is temporarily unavailable for maintenance. Please try again later.'};
  if (['offline','network-error'].includes(slug)) return {title: 'You’re offline.', description: 'You’re offline. Loaded calculators can keep working; new pages may need a connection.'};
  return null;
}
export function localizedMetadata(locale: Locale) {
  return async ({params}: PageProps) => {
    const path = '/' + ((await params).path || []).join('/'), route = routeInfo(path);
    if (!route) return {title: '404', robots: {index: false, follow: true}};
    const t = translator(await getContentDictionary(locale));
    const title='category' in route&&route.subcategory?`${t(route.subcategory)} · ${t(route.category.name)}`:t(route.title);
    return pageMetadata(title, t(route.description), path, isTranslatedPage(path), locale);
  };
}
export function localizedPage(locale: Locale) {
  return async function LocalizedPage({params}: PageProps) {
    const path = '/' + ((await params).path || []).join('/'), route = routeInfo(path);
    if (!route) notFound();
    const messages = await getContentDictionary(locale), t = translator(messages);
    if (path === '/') return <><JsonLd data={{'@context':'https://schema.org','@type':'WebSite',name:'Finflo',url:site.url+localizedPath('/',locale),inLanguage:locale,description:t(route.description)}}/><JsonLd data={{'@context':'https://schema.org',...organizationData()}}/><LocalizedHome messages={messages}/></>;
    if (path === '/calculators' || path === '/sitemap') return <>
      <SearchHero id="directory-title" eyebrow={t('The calculator library')} title={t(route.title)} highlight={t(route.title)} description={t(route.description)}/>
      <div className="container directory-page page-content">
        <nav className="category-pills" aria-label={t('Browse by category')}>{categories.map(c => <a href={`#${c.id}`} key={c.id}>{t(c.name)}<span>{catalog.filter(tool => tool.category === c.id).length}</span></a>)}</nav>
        <TranslationMessages messages={cardMessages(messages,catalog)}>{categories.map(c => <section className="category-directory" key={c.id} id={c.id}><div className="section-heading"><h2>{t(c.name)}</h2><Link className="text-link" href={`/calculators/${c.id}`}>{t(c.label)}</Link></div><ToolDirectory tools={catalog.filter(tool => tool.category === c.id)}/></section>)}</TranslationMessages>
        <DirectoryGuidance path={path} messages={messages} locale={locale}/>
      </div>
    </>;
    if ('category' in route && route.category) {
      const category = route.category;
      const tools = catalog.filter(tool => tool.category === category.id && (!route.subcategory || tool.subcategory === route.subcategory));
      return <><PageHero eyebrow={t('The calculator library')} title={route.subcategory?`${t(route.subcategory)} · ${t(category.name)}`:t(route.title)} description={t(route.description)} breadcrumbs={[{label:t('All calculators'),href:'/calculators'},{label:t(category.name),...(route.subcategory?{href:`/calculators/${category.id}`}:{})},...(route.subcategory?[{label:t(route.subcategory)}]:[])]}/><div className="container directory-page page-content"><TranslationMessages messages={cardMessages(messages,tools)}><FilterableToolDirectory category={category.id} tools={tools} grouped={!route.subcategory}/></TranslationMessages><DirectoryGuidance path={path} messages={messages} locale={locale}/></div></>;
    }
    if (path === '/search') return <><PageHero eyebrow="FINFLO" title={t(route.title)} description={t(route.description)}/><div className="container directory-page page-content"><TranslationMessages messages={cardMessages(messages,catalog)}><Suspense fallback={null}><SearchResults/></Suspense></TranslationMessages></div></>;
    if ('tool' in route && route.tool) {
      const tool = route.tool, def = definitionMap.get(tool.slug), category = categories.find(c => c.id === tool.category)!;
      const currency = tool.slug === 'mortgage-calculator-uk' ? 'GBP' : tool.slug === 'canadian-mortgage-calculator' ? 'CAD' : 'USD';
      const initial = def && !noInitialExampleTools.has(tool.slug) ? await calculate(tool.category, def.modes[0], defaults(def.modes[0])) : null;
      return <>
        <PageHero eyebrow={`${t(category.name)} · ${t('Free online tool')}`} title={t(route.title)} description={t(route.description)} breadcrumbs={[{label:t(category.name),href:`/calculators/${tool.category}`},{label:t(route.title)}]}/>
        <TranslationMessages messages={cardMessages(messages,relatedTools(tool))}><div className="container tool-page page-content">
          {def ? <TranslationMessages messages={calculatorMessages(messages,tool.slug,tool.category)}><CalculatorForm key={`${locale}-${tool.slug}`} definition={def} title={t(`tool.${tool.slug}`)} category={tool.category} initial={initial} currency={currency} privateInput={sensitiveTools.has(tool.slug)}/></TranslationMessages> : blocked[tool.slug] ? <div className="availability-panel"><h2>{t('Not available yet')}</h2><p>{t(blocked[tool.slug])}</p></div> : <ToolDirectory tools={relatedTools(tool)} grouped={false}/>}
          {tool.slug === 'real-estate-calculator' && <DirectoryGuidance path="/calculators/finance/mortgage-and-real-estate" messages={messages} locale={locale}/>}
          <div className="tool-reading">{def&&<CalculatorArticle definition={def} initial={initial} currency={currency} messages={messages} locale={locale}/>}<aside className="related-tools"><h2>{t('Related calculators')}</h2><div className="related-card-grid">{relatedTools(tool).map(item => <CalculatorCard key={item.slug} tool={calculatorCardData(item)} size="compact"/>)}</div></aside></div>
          {def&&<JsonLd data={{'@context':'https://schema.org','@type':'WebApplication',name:t(route.title),url:site.url+localizedPath(path,locale),description:t(route.description),inLanguage:locale,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',isAccessibleForFree:true,offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}}}/>}
          {def&&<JsonLd data={breadcrumbData([{name:t('Home'),path:'/'},{name:t(category.name),path:`/calculators/${tool.category}`},{name:t(route.title),path}],locale)}/>}
        </div></TranslationMessages>
      </>;
    }
    if ('info' in route && route.info) {
      const guide = path.startsWith('/guides/');
      return <><PageHero eyebrow="FINFLO" title={t(route.title)} description={t(route.description)} breadcrumbs={[...(guide?[{label:t('Guides'),href:'/guides'}]:[]),{label:t(route.title)}]}/><div className="container document-page page-content"><article className="document-body">
        {guide&&<p className="editorial-note"><Link href="/about">{t('Prepared by Finflo.')}</Link> <Link href="/methodology">{t('Our methodology')}</Link> · <Link href="/editorial-policy">{t('Editorial policy')}</Link></p>}
        {route.info.sections.map((section,index) => <section key={index}><h2>{t(section.title)}</h2>{section.paragraphs.map((paragraph,i) => <p key={i}>{t(paragraph)}</p>)}{section.links && <ul>{section.links.map(link => <li key={link.href}><Link href={link.href}>{t(link.label)}</Link></li>)}</ul>}</section>)}
      </article></div>{guide&&<><JsonLd data={guideData(t(route.title),t(route.description),path,locale)}/><JsonLd data={breadcrumbData([{name:t('Home'),path:'/'},{name:t('Guides'),path:'/guides'},{name:t(route.title),path}],locale)}/></>}</>;
    }
    if (path === '/guides') return <><PageHero eyebrow="FINFLO" title={t('Guides')} description={t('Practical guides to the formulas, assumptions, and limits behind your calculations.')}/><div className="container directory-page page-content"><div className="guide-grid">{Object.entries(guides).map(([slug,guide]) => <article className="guide-card" key={slug}><h2><Link href={`/guides/${slug}`}>{t(guide.title)}</Link></h2><p>{t(guide.description)}</p></article>)}</div></div></>;
    return <PageHero eyebrow="FINFLO" title={t(route.title)} description={t(route.description)}><Link className="button button-primary" href="/">{t('Go home')}</Link></PageHero>;
  };
}
