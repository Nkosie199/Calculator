import { describe, expect, it } from 'vitest';
import { parse } from '../../parser/parser';
import { expand } from '../expand';
import { toCoefficients } from '../polynomial';

function coeffsOf(expr: string): number[] {
  return toCoefficients(expand(parse(expr), 'x'), 'x');
}

describe('expand + toCoefficients', () => {
  it('already-expanded polynomial', () => {
    expect(coeffsOf('3x^2 - 2x + 1')).toEqual([1, -2, 3]);
  });
  it('distributes a product', () => {
    // (x+1)(x+2) = x^2 + 3x + 2
    expect(coeffsOf('(x+1)*(x+2)')).toEqual([2, 3, 1]);
  });
  it('expands a squared binomial', () => {
    // (x-3)^2 = x^2 - 6x + 9
    expect(coeffsOf('(x-3)^2')).toEqual([9, -6, 1]);
  });
  it('expands a cubed binomial', () => {
    // (x+1)^3 = x^3 + 3x^2 + 3x + 1
    expect(coeffsOf('(x+1)^3')).toEqual([1, 3, 3, 1]);
  });
  it('handles negation of a sum', () => {
    // -(x^2 - 4) = -x^2 + 4
    expect(coeffsOf('-(x^2 - 4)')).toEqual([4, 0, -1]);
  });
  it('handles division by a constant', () => {
    expect(coeffsOf('x^2/2 + x')).toEqual([0, 1, 0.5]);
  });
  it('rejects a non-polynomial', () => {
    expect(() => coeffsOf('sin(x) + 1')).toThrow();
    expect(() => coeffsOf('1/x')).toThrow();
    expect(() => coeffsOf('x^0.5')).toThrow();
  });
});
