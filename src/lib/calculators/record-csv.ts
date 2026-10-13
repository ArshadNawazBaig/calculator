import type {RowColumn} from './types';

/** Bounded RFC-style CSV parsing, including quoted commas and multiline cells. */
export function parseRecordCsv(raw: string, columns: RowColumn[]): string {
  if (raw.length > 200_000) throw Error('Use a CSV file smaller than 200 KB.');
  const text = raw.replace(/^\uFEFF/, ''), records: string[][] = [];
  let row: string[] = [], cell = '', quoted = false, closed = false;
  function endCell() {row.push(cell); cell = ''; closed = false;}
  function endRow() {
    endCell();
    if (row.some(value => value.trim())) records.push(row);
    if (records.length > 101) throw Error('Import at most 100 data rows.');
    row = [];
  }
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {cell += '"'; i++;} else {quoted = false; closed = true;}
      } else cell += char;
      continue;
    }
    if (char === ',') {endCell(); continue;}
    if (char === '\n' || char === '\r') {if (char === '\r' && text[i + 1] === '\n') i++; endRow(); continue;}
    if (closed) throw Error('Unexpected text after a quoted CSV cell.');
    if (char === '"') {if (cell) throw Error('A CSV quote must start a cell.'); quoted = true;} else cell += char;
  }
  if (quoted) throw Error('The CSV contains an unfinished quoted cell.');
  if (cell || row.length || closed) endRow();
  const header = records.shift();
  if (!header) throw Error('Include a header row. Download the template to see the expected columns.');
  const mapped = header.map(label => columns.find(column => [column.key.toLowerCase(), column.label.toLowerCase()].includes(label.trim().toLowerCase()))?.key);
  if (mapped.some(key => !key) || new Set(mapped).size !== columns.length || mapped.length !== columns.length) throw Error('CSV headers must match the template columns exactly, with each column included once.');
  if (records.some(record => record.length !== header.length)) throw Error('Every CSV row must have the same number of cells as the header.');
  return JSON.stringify(records.map(record => Object.fromEntries(mapped.map((key, index) => [key!, record[index]]))));
}

/** Prevent text beginning with spreadsheet commands from becoming formulas. */
export function csvCell(value: string): string {
  const unsafe = /^[\s\u0000-\u001f]*[=+@-]/.test(value) && !/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value.trim());
  return `"${(unsafe ? "'" + value : value).replace(/"/g, '""')}"`;
}
export function recordCsvTemplate(columns: RowColumn[]) {
  return new Blob(['\uFEFF' + [columns.map(column => column.key), columns.map(column => column.default ?? '')].map(row => row.map(csvCell).join(',')).join('\r\n')], {type: 'text/csv;charset=utf-8'});
}
