import {translator, type Dictionary} from '@/lib/i18n/config';
import {colorSwatches, type WheelDefinition} from './catalog';

/** Translate built-in presets once. User-edited entries remain exactly as entered. */
export function localizeWheel(wheel: WheelDefinition, messages: Dictionary): WheelDefinition {
  const t = translator(messages);
  return {...wheel, title: t(wheel.title), seoTitle: t(wheel.seoTitle), description: t(wheel.description), summary: t(wheel.summary), entryLabel: t(wheel.entryLabel),
    entries: wheel.entries.map(entry => t(entry)),
    presets: wheel.presets.map(preset => ({label: t(preset.label), entries: preset.entries.map(entry => t(entry))})),
    colorAliases: Object.fromEntries(Object.entries(colorSwatches).map(([name, hex]) => [t(name[0].toUpperCase() + name.slice(1)).toLowerCase(), hex])),
  };
}
