import {localizedPage,localizedMetadata,localizedStaticParams} from '@/lib/i18n/pages';
export const revalidate=86400;
export const generateStaticParams=localizedStaticParams;
export const generateMetadata=localizedMetadata('hi');
export default localizedPage('hi');
