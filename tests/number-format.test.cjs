'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { formatResult: format } = require('../scripts/number-format');

test('automatic thresholds, signs, zero and normal decimals', () => {
  for (const [raw, expected] of [
    ['999999999', '999999999'], ['1000000000', '1 × 10⁹'],
    ['-1000000000', '-1 × 10⁹'], ['0.000001', '0.000001'],
    ['0.000000999', '9.99 × 10⁻⁷'], ['-0.0000001', '-1 × 10⁻⁷'],
    ['0', '0'], ['-0', '0'], ['123.456', '123.456'],
    ['1000000000000000 m', '1 × 10¹⁵ m'], ['0.0000001 °C', '1 × 10⁻⁷ °C']
  ]) assert.equal(format(raw), expected);
});

test('formatting preserves decimal digits without Number rounding', () => {
  assert.equal(format('123456789012345678901'), '1.23456789012345678901 × 10²⁰');
  assert.equal(format('123456789012345678901', { full: true }), '123456789012345678901');
  assert.equal(format('1.23456789012345e+21', { full: true }), '1234567890123450000000');
  assert.equal(format('1.23456789012345e-7'), '1.23456789012345 × 10⁻⁷');
  assert.equal(format('1e-7', { full: true }), '0.0000001');
  assert.equal(format('1e-6'), '0.000001');
  assert.equal(format('5e-324'), '5 × 10⁻³²⁴');
  assert.equal(format('1e+308', { full: true }), '1' + '0'.repeat(308));
});

test('bases bypass formatting and invalid labels pass through safely', () => {
  for (const value of ['100000000000000000000', '101010101010', '1E10', 'FF']) {
    assert.equal(format(value, { kind: 'base' }), value);
    assert.equal(format(value, { kind: 'base', full: true }), value);
  }
  for (const value of ['Error', '—', 'Infinity', 'NaN', '<script>', '1e999999']) assert.equal(format(value), value);
});

test('fixed decimals round decimal text, preserve trailing zeros and avoid negative zero', () => {
  for (const [raw, places, expected] of [
    ['1.23456', 2, '1.23'], ['1.235', 2, '1.24'], ['1.005', 2, '1.01'],
    ['-1.235', 2, '-1.24'], ['1.2', 4, '1.2000'], ['2.5', 0, '3'],
    ['-2.5', 0, '-3'], ['0', 2, '0.00'], ['-0.004', 2, '0.00'],
    ['9.999', 2, '10.00'], ['0.00001', 2, '0.00'], ['0.005', 2, '0.01'],
    ['1.23456789015', 10, '1.2345678902'], ['12.345 kg', 2, '12.35 kg']
  ]) assert.equal(format(raw, { decimalPlaces: places }), expected);
});

test('scientific coefficient rounding normalizes carries and preserves units', () => {
  assert.equal(format('1234567890000 m', { decimalPlaces: 2 }), '1.23 × 10¹² m');
  assert.equal(format('9.999e20', { decimalPlaces: 2 }), '1.00 × 10²¹');
  assert.equal(format('-9.999e-7', { decimalPlaces: 2 }), '-1.00 × 10⁻⁶');
  assert.equal(format('999999999.999', { decimalPlaces: 2 }), '1.00 × 10⁹');
  assert.equal(format('1e-7', { decimalPlaces: 0 }), '1 × 10⁻⁷');
  assert.equal(format('5e-324', { decimalPlaces: 10 }), '5.0000000000 × 10⁻³²⁴');
});

test('full values and bases bypass rounding; Auto and invalid settings retain digits', () => {
  assert.equal(format('1.23456e-7', { decimalPlaces: 2, full: true }), '0.000000123456');
  assert.equal(format('1000000000000001', { decimalPlaces: 2, kind: 'base' }), '1000000000000001');
  for (const setting of ['auto', -1, 11, 1.5, null, NaN]) {
    assert.equal(format('1.23456', { decimalPlaces: setting }), '1.23456');
  }
});
