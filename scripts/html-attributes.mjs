const namedEntities = {amp: '&', quot: '"', apos: "'", lt: '<', gt: '>'};

function decodeAttribute(value) {
  return value.replace(/&(amp|quot|apos|lt|gt|#\d+|#x[0-9a-f]+);/gi, (_, entity) => {
    if (entity[0] !== '#') return namedEntities[entity.toLowerCase()];
    const hexadecimal = entity[1].toLowerCase() === 'x';
    const point = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
      ? String.fromCodePoint(point) : '\ufffd';
  });
}

export function attributes(tag) {
  const matches = tag.matchAll(/\s([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g);
  return Object.fromEntries(Array.from(matches, ([, name, double, single, unquoted]) =>
    [name.toLowerCase(), decodeAttribute(double ?? single ?? unquoted ?? '')]));
}
