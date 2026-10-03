/* Display-only decimal formatting; never evaluate expressions or mutate API results. */
((root) => {
  'use strict';
  // Round decimal text half away from zero, avoiding binary floating-point artifacts.
  function fixedDecimal(digits, position, places) {
    const cut = position + places;
    let kept = cut <= 0 ? '0' : digits.slice(0, cut).padEnd(cut, '0');
    if (cut >= 0 && cut < digits.length && digits[cut] >= '5') kept = String(BigInt(kept) + 1n);
    kept = kept.replace(/^0+(?=\d)/, '').padStart(places + 1, '0');
    return places ? `${kept.slice(0, -places)}.${kept.slice(-places)}` : kept;
  }
  function formatResult(value, { full = false, kind = 'calculate', decimalPlaces = 'auto' } = {}) {
    const raw = String(value);
    if (kind === 'base') return raw;
    const match = raw.match(/^([+-]?)(\d*\.?\d+)(?:e([+-]?\d+))?( (?:mm|cm|m|km|mg|g|kg|°?C|°?F|K))?$/i);
    if (!match) return raw;
    const [, sign, decimal, power = '0', unit = ''] = match;
    const places = !full && Number.isInteger(decimalPlaces) && decimalPlaces >= 0 && decimalPlaces <= 10 ? decimalPlaces : null;
    const shift = Number(power);
    if (!Number.isSafeInteger(shift) || Math.abs(shift) > 1000) return raw;
    const sourceDigits = decimal.replace('.', '');
    const first = sourceDigits.search(/[1-9]/);
    if (first < 0) return (places === null ? '0' : fixedDecimal('0', 1, places)) + unit;
    const point = decimal.includes('.') ? decimal.indexOf('.') : decimal.length;
    let exponent = point - first - 1 + shift;
    const digits = sourceDigits.slice(first).replace(/0+$/, '');
    const prefix = sign === '-' ? '-' : '';
    if (!full && (exponent >= 9 || exponent < -6)) {
      let mantissa = places === null ? (digits.length === 1 ? digits : `${digits[0]}.${digits.slice(1)}`) : fixedDecimal(digits, 1, places);
      if (mantissa === '10' || mantissa.startsWith('10.')) {
        exponent += 1;
        mantissa = places ? `1.${'0'.repeat(places)}` : '1';
      }
      const superscript = String(exponent).replace(/[-0-9]/g, char => ({ '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' })[char]);
      return `${prefix}${mantissa} × 10${superscript}${unit}`;
    }
    const position = exponent + 1;
    if (places !== null) {
      const rounded = fixedDecimal(digits, position, places);
      const signed = /[1-9]/.test(rounded) ? prefix + rounded : rounded;
      // Rounding can carry a normal decimal into the scientific display range.
      if (rounded.split('.')[0].length >= 10) return formatResult(signed + unit, { decimalPlaces: places });
      return signed + unit;
    }
    const expanded = position <= 0 ? `0.${'0'.repeat(-position)}${digits}`
      : position >= digits.length ? digits + '0'.repeat(position - digits.length)
        : `${digits.slice(0, position)}.${digits.slice(position)}`;
    return prefix + expanded + unit;
  }
  if (typeof module === 'object' && module.exports) module.exports = { formatResult };
  else root.CloverNumberFormat = { formatResult };
})(typeof window === 'object' ? window : {});
