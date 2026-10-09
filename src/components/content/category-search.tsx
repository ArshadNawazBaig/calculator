import {Search} from '@/components/search';
import {categoryLabels,type CategoryId} from '@/lib/site';
import styles from './category-search.module.css';

const placeholders:Record<CategoryId,string>={
  finance:'Try mortgage, interest, or loan',
  health:'Try BMI, calories, or ideal weight',
  math:'Try percentage, fraction, or ratio',
  everyday:'Try age, date, or unit conversion',
};

export function CategorySearch({category}:{category:CategoryId}){
  const titleId=`${category}-search-title`;
  return <section className={styles.root} aria-labelledby={titleId}>
    <h2 id={titleId}>Search {categoryLabels[category].toLowerCase()} calculators</h2>
    <Search key={category} category={category} keyboardShortcut placeholder={placeholders[category]}/>
  </section>;
}
