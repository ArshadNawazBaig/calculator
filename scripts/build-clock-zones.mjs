// IANA's public-domain zone tables. Refresh when the timezone database changes.
import {writeFile} from 'node:fs/promises';
const base = 'https://data.iana.org/time-zones/tzdb/';
const read = async file => {const response = await fetch(base + file); if (!response.ok) throw new Error(`${file}: ${response.status}`); return response.text();};
const [table, backward, etcetera, version] = await Promise.all(['zone.tab', 'backward', 'etcetera', 'version'].map(read));
const links = new Map(), records = new Map();
for (const line of (backward + '\n' + etcetera).split('\n')) {
  const parts = line.split(/\s+/);
  if (parts[0] === 'Link') links.set(parts[2], parts[1]);
}
for (const line of table.split('\n').filter(line => line && !line.startsWith('#'))) {
  const [country, , id] = line.split('\t');
  records.set(id, {id, country, aliases: []});
}
for (const line of etcetera.split('\n')) {
  const parts = line.split(/\s+/);
  if (parts[0] === 'Zone') records.set(parts[1], {id: parts[1], country: '', aliases: []});
}
records.set('UTC', {id: 'UTC', country: '', aliases: ['Etc/UTC', 'Etc/UCT', 'UCT', 'Universal', 'Zulu']});
records.delete('Etc/UTC');
for (const [alias, original] of links) {
  if (records.has(alias)) continue;
  let target = original;
  const seen = new Set([alias]);
  while (links.has(target) && !records.has(target) && !seen.has(target)) {seen.add(target); target = links.get(target);}
  if (target === 'Etc/UTC') target = 'UTC';
  if (records.has(target) && alias !== target) records.get(target).aliases.push(alias);
}
const zones = [...records.values()].map(zone => ({...zone, aliases: [...new Set(zone.aliases)].sort()})).sort((a,b) => a.id.localeCompare(b.id, 'en'));
await writeFile('src/data/clock-zones.json', JSON.stringify({version: version.trim(), source: base, zones}, null, 2) + '\n');
console.log(`${zones.length} zones, ${zones.reduce((sum, zone) => sum + zone.aliases.length, 0)} aliases; IANA ${version.trim()}`);
