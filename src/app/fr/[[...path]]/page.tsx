import {localizedPage,localizedMetadata,localizedStaticParams} from '@/lib/i18n/pages';
export const revalidate=86400;
export const generateStaticParams=()=>localizedStaticParams('fr');
export const generateMetadata=localizedMetadata('fr');
export default localizedPage('fr');
