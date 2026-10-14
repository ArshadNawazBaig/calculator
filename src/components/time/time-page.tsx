import {notFound} from 'next/navigation';
import Link from '@/components/i18n/link';
import {TranslationMessages} from '@/components/i18n/provider';
import {PageHero} from '@/components/content/page-hero';
import {Breadcrumbs} from '@/components/content/breadcrumbs';
import {JsonLd} from '@/components/content/json-ld';
import {translator, localizedPath, type Locale, type Dictionary} from '@/lib/i18n/config';
import {timeTools, timeRoute, zones, clockZoneVersion} from '@/lib/time/catalog';
import {timeGuides} from '@/lib/time/content';
import {timeMessages} from '@/lib/time/messages';
import {breadcrumbData} from '@/lib/structured-data';
import {site} from '@/lib/site';
import {WorldClock} from './world-clock';
import {ZoneDirectory} from './zone-directory';
import {TimerTool} from './timer-tool';
import styles from './time.module.css';

export function TimePage({path = '/time', locale = 'en', messages = {}}: {path?: string; locale?: Locale; messages?: Dictionary}) {
  const route = timeRoute(path);
  if (!route) notFound();
  const t = translator(messages), zone = 'zone' in route ? route.zone : undefined;
  const values = {place: zone?.place || ''};
  const title = t(route.title, values), description = t(route.description, values);
  const mode = path === '/time/timer' ? 'timer' : path === '/time/stopwatch' ? 'stopwatch' : path === '/time/time-zones' ? 'directory' : 'clock';
  const guide = timeGuides[mode];
  const countryNames = new Intl.DisplayNames([locale === 'tl' ? 'fil' : locale], {type: 'region'});
  const countries = Object.fromEntries(zones.filter(zone => zone.country).map(zone => [zone.country, countryNames.of(zone.country) || zone.country]));
  const breadcrumbs = path === '/time' ? [{label: t('Time & clocks')}] : [{label: t('Time & clocks'), href: '/time'}, {label: title}];
  const navigation = <nav className={styles.toolNav} aria-label={t('Time tools')}>{timeTools.map(tool => <Link key={tool.slug} href={tool.href} aria-current={(tool.href === path || tool.href === '/time' && zone) ? 'page' : undefined}>{t(tool.title)}</Link>)}</nav>;
  return <TranslationMessages messages={timeMessages(messages)}>
    {mode === 'clock' ? <WorldClock initialZone={zone}
      breadcrumbs={<Breadcrumbs items={breadcrumbs} tone="inverse"/>}
      introduction={<div className={styles.clockIntro}><h1 id="page-title">{title}</h1><p>{description}</p></div>}
      navigation={navigation}/>
      : <PageHero eyebrow={t('TIME & CLOCKS · FREE ONLINE TOOLS')} title={title} description={description} breadcrumbs={breadcrumbs}/>}
    <div className={`container tool-page${mode === 'clock' ? '' : ' page-content'}`}>
      {mode !== 'clock' && navigation}
      {(mode === 'timer' || mode === 'stopwatch') && <TimerTool stopwatch={mode === 'stopwatch'}/>}
      {(mode === 'clock' || mode === 'directory') && <ZoneDirectory countries={countries} compact={mode === 'clock'}/>}
      <div className={styles.guideLayout}>
        <article className={styles.article} aria-label={t('Guide to {title}', {title})}>
          <section className={styles.answer}><h2>{t(guide.question)}</h2><p>{t(guide.answer)}</p></section>
          {zone && <section><h2>{t('About the {place} clock', {place: zone.place})}</h2><p>{t('This page displays the current local time for {zone}. Its representative location is {place}. The clock’s date, UTC offset, and calendar information all use this selected zone.', {zone: zone.id, place: zone.place})}</p>{zone.country && <p>{t('Country or territory: {country}. Search the directory for other regional clocks and save the places you want to compare.', {country: countries[zone.country]})}</p>}{zone.aliases.length > 0 && <p>{t('Alternate time-zone names: {aliases}.', {aliases: zone.aliases.join(', ')})}</p>}</section>}
          {guide.sections.map(section => <section key={section.title}><h2>{t(section.title)}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{t(paragraph)}</p>)}</section>)}
          <p className={styles.note}>{t('Time-zone directory: IANA {version}. Live regional rules come from your browser.', {version: clockZoneVersion})}{' '}<a href="https://www.iana.org/time-zones">{t('IANA Time Zone Database')}</a></p>
        </article>
        <aside className={styles.related} aria-label={t('Related time tools')}><span className="eyebrow">{t('A LITTLE MORE CLARITY')}</span><h2>{t('Make time work for you.')}</h2><p>{t('Plan a call, check a date, or focus on what comes next.')}</p>{[...timeTools, {href: '/time-zone-calculator', title: 'Time Zone Calculator'}, {href: '/date-calculator', title: 'Date Calculator'}, {href: '/time-calculator', title: 'Time Calculator'}].filter(tool => tool.href !== path).map(tool => <Link href={tool.href} key={tool.href}>{t(tool.title)}<span aria-hidden="true">↗</span></Link>)}</aside>
      </div>
    </div>
    <JsonLd data={{'@context': 'https://schema.org', '@type': mode === 'directory' ? 'CollectionPage' : 'WebApplication', name: title, description, url: site.url + localizedPath(path, locale), inLanguage: locale, ...(mode !== 'directory' ? {applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', isAccessibleForFree: true, offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'}} : {})}}/>
    <JsonLd data={breadcrumbData([{name: t('Home'), path: '/'}, {name: t('Time & clocks'), path: '/time'}, ...(path === '/time' ? [] : [{name: title, path}])], locale)}/>
  </TranslationMessages>;
}
