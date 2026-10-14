export const MAX_ENTRIES = 100;
export const MAX_ENTRY_LENGTH = 60;

export function parseWheelEntries(text: string): {entries: string[]; error: string | null} {
  const entries = text.split(/\r?\n/).map(entry => entry.trim()).filter(Boolean);
  const error = !entries.length ? 'Add at least one entry to spin.'
    : entries.length > MAX_ENTRIES ? `Use ${MAX_ENTRIES} entries or fewer.`
    : entries.some(entry => Array.from(entry).length > MAX_ENTRY_LENGTH) ? `Keep each entry to ${MAX_ENTRY_LENGTH} characters or fewer.` : null;
  return {entries, error};
}

export function numberEntries(minimum: string, maximum: string): string[] {
  if (!minimum.trim() || !maximum.trim()) throw new Error('Enter both the first and last number.');
  const min = Number(minimum), max = Number(maximum);
  if (![min, max].every(value => Number.isSafeInteger(value) && Math.abs(value) <= 1_000_000)) throw new Error('Use whole numbers between -1,000,000 and 1,000,000.');
  if (max < min) throw new Error('The last number must be at least the first number.');
  if (max - min + 1 > MAX_ENTRIES) throw new Error(`Choose a range containing ${MAX_ENTRIES} numbers or fewer.`);
  return Array.from({length: max - min + 1}, (_, index) => String(min + index));
}

function randomWord(): number {
  const bytes = new Uint32Array(1);
  globalThis.crypto.getRandomValues(bytes);
  return bytes[0];
}

/** Rejection sampling gives every entry the same probability, including duplicates. */
export function pickIndex(count: number, draw: () => number = randomWord): number {
  if (!Number.isInteger(count) || count < 1 || count > MAX_ENTRIES) throw new Error('Choose between 1 and 100 entries.');
  const limit = Math.floor(2 ** 32 / count) * count;
  for (let attempt = 0; attempt < 1000; attempt++) {
    const value = draw();
    if (!Number.isInteger(value) || value < 0 || value >= 2 ** 32) throw new Error('Random selection is unavailable. Please try again.');
    if (value < limit) return value % count;
  }
  throw new Error('Random selection is unavailable. Please try again.');
}

export function shuffleEntries(entries: string[], draw?: () => number): string[] {
  const result = [...entries];
  for (let index = result.length - 1; index > 0; index--) {
    const other = pickIndex(index + 1, draw);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

/** The fixed top pointer lands at the center of the chosen SVG segment. */
export function landingRotation(current: number, index: number, count: number): number {
  const target = 360 - (index + .5) * (360 / count);
  return current + 360 * 5 + ((target - current % 360 + 360) % 360);
}

export function segmentPath(index: number, count: number): string {
  const angle = 2 * Math.PI / count;
  const start = index * angle - Math.PI / 2, end = start + angle;
  // Trigonometry can differ slightly between server and browser runtimes.
  // Subpixel precision keeps SVG attributes identical during hydration.
  const point = (radians: number) => `${(200 + 188 * Math.cos(radians)).toFixed(4)} ${(200 + 188 * Math.sin(radians)).toFixed(4)}`;
  return `M 200 200 L ${point(start)} A 188 188 0 ${angle > Math.PI ? 1 : 0} 1 ${point(end)} Z`;
}

export function segmentInk(hex: string): string {
  const rgb = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  const luminance = rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  return luminance > .179 ? '#101113' : '#ffffff';
}
