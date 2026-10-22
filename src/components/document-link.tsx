import type {ComponentProps} from 'react';

export type DocumentLinkProps = Omit<ComponentProps<'a'>, 'href'> & {href: string};

// Document navigation avoids stale metadata after early App Router navigation.
// https://github.com/vercel/next.js/issues/97472
export default function DocumentLink({href, ...props}: DocumentLinkProps) {
  return <a {...props} href={href}/>;
}
