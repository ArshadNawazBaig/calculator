import {changesInvariant} from './i18n-invariants.mjs';

const placeholders = text => (text.match(/\{\w+\}/g) || []).sort().join('|');
const digits = text => text.normalize('NFKC').replace(/[٠-٩۰-۹०-९]/g, digit => String(digit.charCodeAt(0) - (digit <= '٩' ? 0x660 : digit <= '۹' ? 0x6f0 : 0x966)));
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const numberParsers = new Map();
function unarySign(text, index) {
  const prefix = text.slice(0, index), match = prefix.match(/([-−+])\s*$/);
  if (!match) return '';
  const sign = match[1], before = prefix.slice(0, match.index);
  // A date/range hyphen or binary operator belongs to the expression, not to
  // the next numeric literal. Prefix signs in prose, parentheses, and after an
  // equals sign do carry meaning and must survive translation.
  if (/[\p{L}\p{M}\d)\]]$/u.test(before) || /(?:\d|[)\]])\s+$/.test(before) || /^[A-Za-z]\s+$/.test(before)) return '';
  return sign === '−' ? '-' : sign;
}
function numberValues(text, locale = 'en') {
  if (!numberParsers.has(locale)) {
    const parts = new Intl.NumberFormat(locale === 'tl' ? 'fil' : locale === 'ar' ? 'ar-u-nu-arab' : locale).formatToParts(12345.6);
    const decimal = parts.find(part => part.type === 'decimal')?.value || '.';
    const group = digits(parts.find(part => part.type === 'group')?.value || ',');
    // Group separators are valid only between groups of three digits. Decimal
    // places retain their position: 1.2 must never become equivalent to 12.
    const grouping = `(?:${escape(group)}| )`;
    const indian = locale === 'hi' ? `\\d{1,2}(?:${grouping}\\d{2})*${grouping}\\d{3}(?!\\d)|` : '';
    const integer = `(?:${indian}\\d{1,3}(?:${grouping}\\d{3}(?!\\d))+|\\d+)`;
    numberParsers.set(locale, {decimal, group, pattern: new RegExp(`${integer}(?:${escape(decimal)}\\d+)?|(?<![\\p{L}\\p{N}\\p{M}])${escape(decimal)}\\d+`, 'gu')});
  }
  const {decimal, group, pattern} = numberParsers.get(locale);
  const normalized = digits(text);
  return [...normalized.matchAll(pattern)].map(match => {
    const value = match[0];
    const [whole, fraction = ''] = value.split(group).join('').replace(/ /g, '').split(decimal);
    const normalizedWhole = whole.replace(/^0+/, '') || '0';
    const normalizedFraction = fraction.replace(/0+$/, '');
    return unarySign(normalized, match.index) + normalizedWhole + (normalizedFraction ? `.${normalizedFraction}` : '');
  });
}
function sameNumbers(source, translation, locale, ordered = false) {
  const expected = numberValues(source);
  const normalized = digits(translation);
  const spans = [...normalized.matchAll(/\d+(?:(?:[.,٬٫]\d+)|(?: \d{3}(?!\d)))*|(?<![\p{L}\p{N}\p{M}])[.٫]\d+/gu)];
  const groups = spans.map(match => {
    const sign = unarySign(normalized, match.index);
    const options = ['en', locale].map(language => {
      const values = numberValues(match[0], language);
      if (sign && values.length) values[0] = sign + values[0];
      return values;
    });
    return options.filter((values, index) => index === 0 || values.join('|') !== options[0].join('|'));
  });
  const remaining = new Map();
  for (const value of expected) remaining.set(value, (remaining.get(value) || 0) + 1);
  // A translated paragraph can retain source notation inside a formula while
  // using localized separators in prose. Match each numeric span against the
  // source multiset instead of forcing one notation on the whole paragraph.
  function matchGroup(index, position = 0) {
    if (index === groups.length) return ordered ? position === expected.length : [...remaining.values()].every(count => count === 0);
    for (const option of groups[index]) {
      if (ordered) {
        if (option.every((value, offset) => expected[position + offset] === value) && matchGroup(index + 1, position + option.length)) return true;
        continue;
      }
      const used = [];
      for (const value of option) {
        if (!remaining.get(value)) break;
        remaining.set(value, remaining.get(value) - 1); used.push(value);
      }
      const matched = used.length === option.length && matchGroup(index + 1);
      for (const value of used) remaining.set(value, remaining.get(value) + 1);
      if (matched) return true;
    }
    return false;
  }
  return matchGroup(0);
}
const notation = text => (text.match(/[=×÷^+*Σ∑√≤≥±≠⁻²³≈−<>|\[\]()/]/g) || []).join('');
const supportedTranslations = new Set(['es', 'fr', 'de', 'pt', 'ar', 'hi', 'tl']);
const foreignScriptCharacters = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Cyrillic}]/gu;
function introducesForeignScript(source, translation, locale) {
  if (!supportedTranslations.has(locale)) return false;
  // Preserve literal examples and proper names already present in the source,
  // while rejecting unrelated-script tokens accidentally inserted into prose.
  const allowed = new Set(source.match(foreignScriptCharacters) || []);
  return (translation.match(foreignScriptCharacters) || []).some(character => !allowed.has(character));
}

/** Validate both server content and messages that must reach the shared client provider. */
export function translationIssues(source, ui, content, locale = 'en') {
  const dictionary = {...content, ...ui};
  return {
    missing: source.keys.filter(key => typeof dictionary[key] !== 'string' || !dictionary[key].trim()),
    missingShared: (source.sharedKeys || []).filter(key => typeof ui[key] !== 'string' || !ui[key].trim()),
    malformed: source.keys.filter(key => dictionary[key] && placeholders(key) !== placeholders(dictionary[key])),
    changedNumbers: source.keys.filter(key => dictionary[key] && !sameNumbers(key, dictionary[key], locale)),
    damagedFormulas: source.formulas.filter(key => dictionary[key] && (notation(key) !== notation(dictionary[key]) || !sameNumbers(key, dictionary[key], locale, true))),
    unreadable: source.keys.filter(key => dictionary[key] && /<unk>|⁇/.test(dictionary[key])),
    unexpectedScripts: source.keys.filter(key => dictionary[key] && introducesForeignScript(key, dictionary[key], locale)),
    changedIdentifiers: source.keys.filter(key => dictionary[key] && changesInvariant(key, dictionary[key])),
  };
}
