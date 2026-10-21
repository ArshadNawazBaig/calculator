import {localizedPage,localizedMetadata,localizedStaticParams} from '@/lib/i18n/pages';
export const revalidate=86400;
export const generateStaticParams=()=>localizedStaticParams('ar');
export const generateMetadata=localizedMetadata('ar');
export default localizedPage('ar');
