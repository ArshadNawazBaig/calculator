import {Buffer} from 'buffer/';
import iconv from 'iconv-lite';
import Encoding from 'encoding-japanese';
import {metric, type Values, type Result} from './types';

export const MAX_BINARY_BYTES = 10 * 1024 * 1024;
export const MAX_BASE64_CHARACTERS = 4 * Math.ceil(MAX_BINARY_BYTES / 3);
export function bytesToBase64(bytes: Uint8Array): string {
  if (bytes.length > MAX_BINARY_BYTES) throw Error('Use a file no larger than 10 MiB.');
  return Buffer.from(bytes).toString('base64');
}
export function base64ToBytes(raw: string, whitespace = false): Uint8Array {
  if (raw.length > MAX_BASE64_CHARACTERS + (whitespace ? MAX_BINARY_BYTES : 0)) throw Error('The Base64 input exceeds the 10 MiB decoded-file limit.');
  const text = whitespace ? raw.replace(/[\t\n\f\r ]/g, '') : raw;
  const padding = text.endsWith('==') ? 2 : text.endsWith('=') ? 1 : 0;
  if (text.length > MAX_BASE64_CHARACTERS || text.length % 4 !== 0 || text.length / 4 * 3 - padding > MAX_BINARY_BYTES) throw Error('Enter canonical padded Base64 within the 10 MiB decoded-file limit.');
  for (let i = 0; i < text.length - padding; i++) {
    const c = text.charCodeAt(i);
    if (!((c >= 65 && c <= 90) || (c >= 97 && c <= 122) || (c >= 48 && c <= 57) || c === 43 || c === 47)) throw Error('Enter canonical padded Base64 using the standard +/ alphabet.');
  }
  const bytes = Buffer.from(text, 'base64');
  if (bytes.length > MAX_BINARY_BYTES || bytes.toString('base64') !== text) throw Error('Base64 has invalid padding bits or exceeds the file-size limit.');
  return new Uint8Array(bytes);
}
function scalarText(text: string) {
  if (text.isWellFormed ? !text.isWellFormed() : /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(text)) throw Error('Text contains an unpaired Unicode surrogate.');
}
const codecName = (charset: string) => ({'iso-8859-8-i': 'iso-8859-8', 'x-mac-cyrillic': 'maccyrillic', 'gb2312': 'gbk'}[charset] || charset);
function decodeRaw(bytes: Uint8Array, charset: string): string {
  if (charset === 'iso-2022-jp') {
    new TextDecoder('iso-2022-jp', {fatal: true, ignoreBOM: true}).decode(bytes);
    return Encoding.codeToString(Encoding.convert(Array.from(bytes), {from: 'JIS', to: 'UNICODE', type: 'array'}));
  }
  const codec = codecName(charset);
  if (!iconv.encodingExists(codec)) throw Error('This character encoding is unavailable.');
  return iconv.decode(Buffer.from(bytes), codec, {stripBOM: false});
}
function encodeRaw(text: string, charset: string): Uint8Array {
  if (charset === 'iso-2022-jp') return new Uint8Array(Encoding.convert(Encoding.stringToCode(text), {from: 'UNICODE', to: 'JIS', type: 'array'}));
  const codec = codecName(charset);
  if (!iconv.encodingExists(codec)) throw Error('This character encoding is unavailable.');
  return new Uint8Array(iconv.encode(text, codec, {addBOM: false}));
}
export function encodeCharset(text: string, charset: string, includeBom = false): Uint8Array {
  scalarText(text);
  if (includeBom && !['utf-8', 'utf-16le', 'utf-16be'].includes(charset)) throw Error('A Unicode BOM applies only to the UTF encoding choices.');
  const input = includeBom ? '\uFEFF' + text : text, bytes = encodeRaw(input, charset);
  if (decodeRaw(bytes, charset) !== input) throw Error('Some characters cannot be represented losslessly in this encoding.');
  return bytes;
}
export function decodeCharset(bytes: Uint8Array, charset: string, stripBom = false): string {
  if (['utf-8', 'utf-16le', 'utf-16be'].includes(charset)) new TextDecoder(charset, {fatal: true, ignoreBOM: true}).decode(bytes);
  const text = decodeRaw(bytes, charset);
  scalarText(text);
  const encoded = encodeRaw(text, charset);
  if (encoded.length !== bytes.length || encoded.some((byte, i) => byte !== bytes[i])) throw Error('These bytes do not form a canonical lossless text sequence for the selected encoding. Use binary-file decoding to preserve arbitrary bytes.');
  return stripBom && text.startsWith('\uFEFF') ? text.slice(1) : text;
}
export function runBase64Text(v: Values): Result {
  if (v.text.length > 100000) throw Error('Use at most 100,000 text characters; use the file tool for larger data.');
  const charset = v.charset || 'utf-8', encode = v.direction === 'encode';
  const output = encode ? bytesToBase64(encodeCharset(v.text, charset, v.bom === 'include-on-encode')) : decodeCharset(base64ToBytes(v.text, v.whitespace === 'yes'), charset, v.bom === 'strip-on-decode');
  return {metrics: [metric('Result', output)], notes: ['Base64 is an encoding, not encryption. Processing stays in this browser. Legacy text conversions require a lossless round trip; arbitrary binary data belongs in the file tool.', 'ASCII and ISO-8859-1 use their strict byte meanings. GBK includes GB2312-compatible characters; ISO-8859-8-I shares the Hebrew byte map with logical text ordering.']};
}
