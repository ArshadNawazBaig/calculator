'use client';
import { useState } from 'react';
import { useI18n } from '@/components/i18n/provider';
import { useHydrated } from '@/lib/use-hydrated';
import { SearchHero } from '@/components/content/search-hero';
import Link from '@/components/i18n/link';
import { categorySlug } from '@/lib/catalog-paths';
import type { HomeFeaturedTool } from '@/lib/home-featured';
import { categoryHref, type ToolCategoryId } from '@/lib/site';
import { homeFilters, spotlights, type HomeCategory } from '@/lib/home-content';
import { FeaturedToolGrid, SpotlightPanel } from './featured-tools';
import { SectionHeading } from './section-heading';
import styles from './home.module.css';
import tabStyles from '@/components/ui/segmented-tabs.module.css';

function FeaturedFilters({
  category,
  onSelect,
}: {
  category: HomeCategory;
  onSelect: (value: HomeCategory) => void;
}) {
  const { t } = useI18n();
  const hydrated = useHydrated();
  return (
    <div
      className={`${tabStyles.tabs} ${styles.filters}`}
      role="group"
      aria-label={t('Filter featured calculators')}
    >
      {homeFilters.map((filter) => (
        <button
          className={tabStyles.item}
          key={filter.id}
          type="button"
          disabled={!hydrated}
          aria-pressed={category === filter.id}
          aria-controls="featured-calculators"
          onClick={() => onSelect(filter.id)}
        >
          {t(filter.label)}
        </button>
      ))}
    </div>
  );
}

export function HomeExplorer({
  tools,
}: {
  tools: Record<ToolCategoryId, HomeFeaturedTool[]>;
}) {
  const { t } = useI18n();
  const [category, setCategory] = useState<HomeCategory>('all');
  const collectionHref =
    category === 'all' ? '/calculators' : categoryHref(category);
  const collectionLabel =
    category === 'time'
      ? t('Explore time tools')
      : category === 'spin-wheels'
        ? t('Explore spin wheels')
        : t('View all calculators');
  const groups = homeFilters.filter(
    (filter): filter is { id: ToolCategoryId; label: string } =>
      filter.id !== 'all' && (category === 'all' || filter.id === category),
  );
  return (
    <>
      <SearchHero
        id="home-title"
        eyebrow={t('A little clarity goes a long way')}
        title={t('Find your answer.')}
        highlight={t('answer.')}
        description={t(
          'Free calculators for life’s big and small decisions. From your next home to your everyday numbers.',
        )}
        category={category === 'all' ? undefined : category}
        onClearCategory={() => setCategory('all')}
      />
      {/* <nav
        className={`container ${styles.jumpLinks}`}
        aria-label={t('On this page')}
      >
        <span>{t('On this page')}</span>
        <a href="#featured-title">{t('Calculators')}</a>
        <a href="#how-it-works-title">{t('How it works')}</a>
        <a href="#guides-title">{t('Guides')}</a>
      </nav> */}
      <section
        className={`container ${styles.section}`}
        aria-labelledby="featured-title"
      >
        <SectionHeading
          id="featured-title"
          eyebrow={t('Your everyday toolkit')}
          title={t('Start with a calculator.')}
          link={{ href: collectionHref, label: collectionLabel }}
        />
        <FeaturedFilters category={category} onSelect={setCategory} />
        <div
          id="featured-calculators"
          className={styles.featuredLayout}
          aria-label={t('Featured tools')}
        >
          <div className={styles.featuredGroups}>
            {groups.map((group) => {
              const subcategories = [
                ...new Set(tools[group.id].map((tool) => tool.subcategory)),
              ];
              return (
                <section
                  key={group.id}
                  data-featured-group={group.id}
                  aria-label={t(group.label)}
                >
                  <div className={styles.featuredSubgroups}>
                    {subcategories.map((subcategory) => {
                      const subgroupId = [
                        'featured',
                        'subgroup',
                        group.id,
                        categorySlug(subcategory),
                      ].join('-');
                      const subgroupHref =
                        group.id === 'spin-wheels'
                          ? '/spin-wheels'
                          : group.id === 'time'
                            ? '/time'
                            : `/calculators/${group.id}/${categorySlug(subcategory)}`;
                      return (
                        <section
                          key={subcategory}
                          data-featured-subcategory={subcategory}
                          aria-labelledby={subgroupId}
                        >
                          <h3
                            id={subgroupId}
                            className={styles.featuredSubheading}
                          >
                            <Link href={subgroupHref}>{t(subcategory)}</Link>
                          </h3>
                          <FeaturedToolGrid
                            tools={tools[group.id].filter(
                              (tool) => tool.subcategory === subcategory,
                            )}
                          />
                        </section>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          <SpotlightPanel
            spotlight={spotlights[category === 'all' ? 'finance' : category]}
          />
        </div>
      </section>
    </>
  );
}
