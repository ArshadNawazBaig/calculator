import {site} from './site';

const configuredToken = process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?.trim() || '';
// The public site token is configuration, not an account API credential.
export const analyticsToken = site.indexable && /^[a-f0-9]{32}$/i.test(configuredToken) ? configuredToken : null;
