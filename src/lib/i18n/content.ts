import {cache} from 'react';
import {getDictionary} from './dictionaries';
import {type Dictionary, type Locale} from './config';
import pageKeys from '@/data/locales/page-keys.json';
import runtimeKeys from '@/data/locales/runtime-keys.json';
import wheelRuntimeKeys from '@/data/locales/wheel-runtime-keys.json';
import homeRuntimeKeys from '@/data/locales/home-runtime-keys.json';
import {cardMessages} from './dictionaries';
import type {CategoryId} from '@/lib/site';

const content = {
  es: () => import('@/data/locales/content/es.json').then(m=>m.default),
  fr: () => import('@/data/locales/content/fr.json').then(m=>m.default),
  de: () => import('@/data/locales/content/de.json').then(m=>m.default),
  pt: () => import('@/data/locales/content/pt.json').then(m=>m.default),
  ar: () => import('@/data/locales/content/ar.json').then(m=>m.default),
  hi: () => import('@/data/locales/content/hi.json').then(m=>m.default),
  tl: () => import('@/data/locales/content/tl.json').then(m=>m.default),
};

export const getContentDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  if(locale==='en')return {};
  const [technical,ui]=await Promise.all([content[locale](),getDictionary(locale)]);
  return {...technical,...ui};
});

export function calculatorMessages(messages: Dictionary, slug: string, category: CategoryId): Dictionary {
  const keys = [...runtimeKeys[category],...((pageKeys as Record<string,string[]>)[slug]||[])];
  return Object.fromEntries(keys.filter(key=>Object.hasOwn(messages,key)).map(key=>[key,messages[key]]));
}

const pickMessages = (messages: Dictionary, keys: string[]) => Object.fromEntries(keys.filter(key => Object.hasOwn(messages,key)).map(key => [key,messages[key]]));
export function wheelMessages(messages: Dictionary, cards: ReadonlyArray<{slug:string}>) {
  return {...pickMessages(messages,wheelRuntimeKeys),...cardMessages(messages,cards)};
}
export function homeMessages(messages: Dictionary, cards: ReadonlyArray<{slug:string}>) {
  return {...pickMessages(messages,homeRuntimeKeys),...cardMessages(messages,cards)};
}
