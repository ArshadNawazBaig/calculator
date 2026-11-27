import Link from '@/components/document-link';
import { Fragment } from 'react';
import {
  languages,
  localizedPath,
  translator,
  type Dictionary,
  type Locale,
} from '@/lib/i18n/config';
import { mathSearchContent } from '@/data/math-search-content';
import { site } from '@/lib/site';
import { SolidShapeDiagram } from '@/components/calculators/solid-shape-diagram';
import { AreaShapeDiagram } from '@/components/calculators/area-shape-diagram';
import { ContentIllustration } from '@/components/illustrations/content-illustration';
import styles from './explanation.module.css';

function guideDate(date: string, locale: Locale = 'en') {
  return new Intl.DateTimeFormat(languages[locale].tag, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export function MathGuideByline({
  publishedAt,
  modifiedAt,
}: {
  publishedAt: string;
  modifiedAt: string;
}) {
  return (
    <p className={styles.byline}>
      <span>
        By{' '}
        <Link href="/about" rel="author">
          {site.name}
        </Link>
      </span>
      <span>
        Published <time dateTime={publishedAt}>{guideDate(publishedAt)}</time>
      </span>
      <span>
        Updated <time dateTime={modifiedAt}>{guideDate(modifiedAt)}</time>
      </span>
    </p>
  );
}

/** Keep this component on the server so the direct answer is in the initial HTML. */
export function MathSearchAnswer({
  slug,
  messages = {},
}: {
  slug: string;
  messages?: Dictionary;
}) {
  const t = translator(messages);
  const content = mathSearchContent[slug];
  if (!content) return null;
  return (
    <section
      className={`${styles.panel} ${styles.insight}`}
      data-math-search-answer
      aria-labelledby="math-answer-heading"
    >
      <h2 id="math-answer-heading">{t(content.answerHeading)}</h2>
      <p>{t(content.answer)}</p>
      <nav
        className={styles.methodLinks}
        aria-label={t('Calculation reference')}
      >
        <a href="#calculator-inputs">{t('Use the calculator')}</a>
        <a href="#formula-reference">{t('Formulas and examples')}</a>
        {content.quickLinks?.map((link) => (
          <a key={link.href} href={link.href}>
            {t(link.label)}
          </a>
        ))}
        <a href="#common-questions">{t('Common questions')}</a>
      </nav>
    </section>
  );
}

/** Task-specific reference content shared by every published language. */
export function MathSearchContent({
  slug,
  messages = {},
  locale = 'en',
}: {
  slug: string;
  messages?: Dictionary;
  locale?: Locale;
}) {
  const t = translator(messages);
  const content = mathSearchContent[slug];
  if (!content) return null;
  const illustrated = [
    'area-calculator',
    'volume-calculator',
    'surface-area-calculator',
  ].includes(slug);
  return (
    <div data-math-search-content>
      <section
        id="formula-reference"
        className={styles.panel}
        aria-labelledby="formula-reference-heading"
      >
        <h2 id="formula-reference-heading">{t(content.tableHeading)}</h2>
        <p>{t(content.tableIntroduction)}</p>
        {illustrated && (
          <p>
            {t(
              'Select a shape name below to load its calculator. Diagrams show which dimensions to measure and are not to scale.',
            )}
          </p>
        )}
        <p id="formula-scroll-hint" className={styles.scrollHint}>
          {t('Scroll sideways to see all columns.')}
        </p>
        <div
          className={styles.scroll}
          role="region"
          aria-labelledby="formula-reference-heading"
          aria-describedby="formula-scroll-hint"
          tabIndex={0}
        >
          <table className={styles.table}>
            <caption>{t(content.tableCaption)}</caption>
            <thead>
              <tr>
                <th scope="col">{t(content.firstColumn)}</th>
                <th scope="col">{t('Formula')}</th>
                <th scope="col">{t('Example inputs')}</th>
                <th scope="col">{t('Result')}</th>
              </tr>
            </thead>
            <tbody>
              {content.rows.map((row) => (
                <tr
                  key={row.id}
                  id={illustrated ? `method-${row.id}` : undefined}
                >
                  <th scope="row">
                    {illustrated ? (
                      <>
                        <a href={`#mode-${row.id}`}>{t(row.label)}</a>
                        <span className={styles.shapeDiagram}>
                          {slug === 'area-calculator' ? (
                            <AreaShapeDiagram
                              shape={row.id}
                              messages={messages}
                            />
                          ) : (
                            <SolidShapeDiagram
                              shape={row.id}
                              messages={messages}
                            />
                          )}
                        </span>
                      </>
                    ) : row.modeId ? (
                      <a href={`#mode-${row.modeId}`}>{t(row.label)}</a>
                    ) : (
                      t(row.label)
                    )}
                  </th>
                  <td>{t(row.formula)}</td>
                  <td>{t(row.example)}</td>
                  <td data-numeric>{t(row.result)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {content.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className={styles.panel}
          aria-labelledby={`${section.id}-heading`}
        >
          <h2 id={`${section.id}-heading`}>{t(section.heading)}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <Fragment key={index}>
              <p>{t(paragraph)}</p>
              {index === 0 && section.figure && (
                <figure className={styles.exampleFigure}>
                  <ContentIllustration
                    id={section.figure.id}
                    messages={messages}
                    sizes="auto, (max-width: 720px) calc(100vw - 36px), 680px"
                  />
                  <figcaption>{t(section.figure.caption)}</figcaption>
                </figure>
              )}
            </Fragment>
          ))}
          {section.steps && (
            <ol className={styles.exampleSteps}>
              {section.steps.map((step) => (
                <li key={step}>{t(step)}</li>
              ))}
            </ol>
          )}
          {section.link && (
            <p>
              {t(section.link.sentence)
                .split('{calculatorLink}')
                .map((part, index) => (
                  <Fragment key={index}>
                    {index > 0 && (
                      <Link href={localizedPath(section.link!.href, locale)}>
                        {t(section.link!.label)}
                      </Link>
                    )}
                    {part}
                  </Fragment>
                ))}
            </p>
          )}
        </section>
      ))}
      {illustrated && !(locale === 'en' && content.publishedAt) && (
        <p className="editorial-note">
          {t('Content and calculation examples updated')}{' '}
          <time dateTime={content.modifiedAt}>
            {guideDate(content.modifiedAt, locale)}
          </time>
          .
        </p>
      )}
    </div>
  );
}
