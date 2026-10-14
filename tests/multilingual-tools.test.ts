import {describe,expect,it} from 'vitest';
import {locales,translator} from '@/lib/i18n/config';
import {getContentDictionary,homeMessages,wheelMessages} from '@/lib/i18n/content';
import {spinWheels,colorForEntry} from '@/lib/spin-wheels/catalog';
import {localizeWheel} from '@/lib/spin-wheels/localize';
import {parseWheelEntries} from '@/lib/spin-wheels/engine';
import {localizeToolDefaults} from '@/lib/i18n/tool-defaults';
import {toolkitDefinitions} from '@/lib/calculators/toolkit-definitions';
import {calculate} from '@/lib/calculators/engine';
import {defaults} from '@/lib/calculators/types';

describe('complete wheel and toolkit localization',()=>{
 it('provides usable localized presets and retains color meanings in every language',async()=>{
  for(const locale of locales.filter(locale=>locale!=='en')){
   const messages=await getContentDictionary(locale),t=translator(messages);
   for(const wheel of spinWheels){
    const localized=localizeWheel(wheel,messages);
    expect(localized.title,locale).not.toBe(wheel.title);
    for(const entries of [localized.entries,...localized.presets.map(preset=>preset.entries)])expect(parseWheelEntries(entries.join('\n')).error,`${locale} ${wheel.slug}`).toBeNull();
    if(wheel.slug==='random-color-wheel')expect(colorForEntry(t('Red'),localized.colorAliases)).toBe('#ef4444');
    if(wheel.slug==='wheel-of-names')expect(localized.entries).toEqual(wheel.entries);
   }
   expect(translator(wheelMessages(messages,[]))('Removed {entry}. {count} entries remain.',{entry:'My Custom Name',count:2})).toContain('My Custom Name');
   expect(translator(homeMessages(messages,[]))('Let the wheel choose.')).not.toBe('Let the wheel choose.');
  }
 });
 it('translates toolkit examples without changing options or numerical results',async()=>{
  for(const locale of ['es','ar','hi'] as const){
   const messages=await getContentDictionary(locale);
   for(const definition of toolkitDefinitions){
    const localized=localizeToolDefaults(definition,messages);
    for(const [index,mode] of definition.modes.entries()){
     const translated=localized.modes[index];
     expect(translated.fields.map(field=>field.options)).toEqual(mode.fields.map(field=>field.options));
     const original=await calculate('finance',mode,defaults(mode));
     const result=await calculate('finance',translated,defaults(translated));
     expect(result.metrics.filter(metric=>typeof metric.value==='number').map(metric=>metric.value),`${locale} ${definition.slug}`).toEqual(original.metrics.filter(metric=>typeof metric.value==='number').map(metric=>metric.value));
    }
   }
  }
 });
});
