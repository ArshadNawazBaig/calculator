import {localizedPage,localizedMetadata,localizedStaticParams} from '@/lib/i18n/pages';
export const revalidate=86400;
export const generateStaticParams=()=>localizedStaticParams('tl');
export const generateMetadata=localizedMetadata('tl');
export default localizedPage('tl');
