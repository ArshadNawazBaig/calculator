'use client';
import DocumentLink, {type DocumentLinkProps} from '@/components/document-link';
import {useI18n} from './provider';
export default function Link({href, ...props}: DocumentLinkProps) {
  const {href: localize} = useI18n();
  return <DocumentLink {...props} href={localize(href)}/>;
}
