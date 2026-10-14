import keys from '@/data/locales/time-runtime-keys.json';
import type {Dictionary} from '@/lib/i18n/config';
/** Keep guides on the server and send only clock controls to the browser. */
export function timeMessages(messages: Dictionary): Dictionary {
  return Object.fromEntries(keys.filter(key => Object.hasOwn(messages, key)).map(key => [key, messages[key]]));
}
