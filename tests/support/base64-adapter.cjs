/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
/** Pure dependency-injected adapter. No product import or file mutation. */
async function assertBase64Fixture(fixture, {codec, definitions, calculate, defaults}) {
  const x = fixture.inputs;
  let result;
  const invoke = async () => {
    if (fixture.group === 'base64-bytes') return x.direction === 'encode'
      ? codec.bytesToBase64(new Uint8Array(x.bytes))
      : codec.base64ToBytes(x.base64);
    const mode = definitions.find(d => d.slug === 'base64-encode-decode').modes.find(m => m.id === 'character-encoding');
    assert.ok(mode, 'Missing character-encoding mode');
    const values = {...defaults(mode), ...Object.fromEntries(Object.entries(x).map(([key, value]) => [key, String(value)]))};
    const output = await calculate('everyday', mode, values);
    return {mode, values, text: output.metrics.find(metric => metric.label === 'Result').value};
  };
  if (fixture.expectedError) {
    try {await invoke();} catch (error) {
      assert.ok(!/Maximum call stack|Cannot read properties|is not a function|Missing character-encoding/.test(error.message), 'Unexpected runtime error: '+error.message);
      return {expectedError: true, error: error.message};
    }
    assert.fail('Expected a validation error');
  }
  result = await invoke();
  if (fixture.group === 'base64-bytes') {
    assert.equal(result, fixture.expected.base64);
    assert.equal(codec.base64ToBytes(result).length, fixture.expected.byteLength);
    assert.deepEqual(Array.from(codec.base64ToBytes(result)), x.bytes);
  } else {
    assert.equal(result.text, fixture.expected.base64);
    assert.deepEqual(Array.from(codec.encodeCharset(x.text, x.charset, x.bom === 'include-on-encode')), fixture.expected.bytes);
    if (fixture.expected.roundTripText !== undefined) {
      const output = await calculate('everyday', result.mode, {...result.values, direction: 'decode', text: result.text, bom: 'none'});
      assert.equal(output.metrics.find(metric => metric.label === 'Result').value, fixture.expected.roundTripText);
    }
  }
  return {passed: true};
}
module.exports = {assertBase64Fixture};
