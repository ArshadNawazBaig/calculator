import {localizedPage,localizedMetadata,localizedStaticParams} from '@/lib/i18n/pages';
export const revalidate=86400;
export const generateStaticParams=()=>localizedStaticParams('de');
export const generateMetadata=localizedMetadata('de');
export default localizedPage('de');
