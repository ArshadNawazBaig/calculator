import {localizedPage,localizedMetadata,localizedStaticParams} from '@/lib/i18n/pages';
export const revalidate=86400;
export const generateStaticParams=()=>localizedStaticParams('es');
export const generateMetadata=localizedMetadata('es');
export default localizedPage('es');
