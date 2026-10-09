'use client';
import NextLink from 'next/link';
import type {ComponentProps} from 'react';
import {useI18n} from './provider';
export default function Link({href, ...props}: ComponentProps<typeof NextLink>) {
  const {href: localize} = useI18n();
  return <NextLink {...props} href={typeof href === 'string' ? localize(href) : href}/>;
}
