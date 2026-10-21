import {localizedPage,localizedMetadata,localizedStaticParams} from '@/lib/i18n/pages';
export const revalidate=86400;
export const generateStaticParams=()=>localizedStaticParams('pt');
export const generateMetadata=localizedMetadata('pt');
export default localizedPage('pt');
