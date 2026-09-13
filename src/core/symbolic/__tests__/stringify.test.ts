import { describe, expect, it } from 'vitest';
import { parse } from '../../parser/parser';
import { calculate } from '../../parser';
import { stringify } from '../stringify';

/** Round-trips expr through parse -> stringify -> parse -> evaluate, and checks it matches direct evaluation. */
function checkRoundTrip(expr: string) {
  const reStringified = stringify(parse(expr));
  expect(calculate(reStringified)).toBeCloseTo(calculate(expr), 9);
}

describe('stringify: parenthesization is always correct (round-trips through the parser)', () => {
  it('simple sum', () => checkRoundTrip('1 + 2 + 3'));
  it('subtraction associativity', () => checkRoundTrip('10 - 3 - 2'));
  it('mixed precedence', () => checkRoundTrip('2 + 3 * 4'));
  it('negation of a sum', () => checkRoundTrip('-(3 + 4)'));
  it('power of a negation', () => checkRoundTrip('(-2)^2'));
  it('negation of a power', () => checkRoundTrip('-2^2'));
  it('right-associative power', () => checkRoundTrip('2^2^3'));
  it('division associativity', () => checkRoundTrip('100 / 5 / 2'));
  it('nested functions', () => checkRoundTrip('sin(cos(1))'));
  it('factorial of a sum', () => checkRoundTrip('(1+2)!'));
});
