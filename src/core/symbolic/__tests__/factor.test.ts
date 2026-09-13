import { describe, expect, it } from 'vitest';
import { parse } from '../../parser/parser';
import { factor } from '../factor';
import { evalAt } from './testUtils';

function checkFactorizationMatchesOriginal(expr: string, points: number[]) {
  const original = parse(expr);
  const { node: factored } = factor(original, 'x');
  for (const x of points) {
    expect(evalAt(factored, x)).toBeCloseTo(evalAt(original, x), 6);
  }
  return factored;
}

describe('factor: preserves the polynomial\'s value (numeric cross-check)', () => {
  it('simple quadratic with two rational roots', () => {
    checkFactorizationMatchesOriginal('x^2 - 5x + 6', [0, 1, 2.5, 4, -3]);
  });

  it('quadratic with a repeated root', () => {
    checkFactorizationMatchesOriginal('x^2 - 6x + 9', [0, 1, 3, 5]);
  });

  it('quadratic irreducible over the reals', () => {
    const { note } = factor(parse('x^2 + 1'));
    expect(note).toMatch(/irreducible|complex/i);
    checkFactorizationMatchesOriginal('x^2 + 1', [0, 1, -2, 3]);
  });

  it('cubic with three rational roots', () => {
    checkFactorizationMatchesOriginal('x^3 - 6x^2 + 11x - 6', [0, 0.5, 4, -1]);
  });

  it('cubic with one rational root and an irreducible quadratic remainder', () => {
    const { note } = factor(parse('x^3 + 1'));
    expect(note).toBeTruthy();
    checkFactorizationMatchesOriginal('x^3 + 1', [0, 1, -2, 2]);
  });

  it('factors out a common power of x', () => {
    checkFactorizationMatchesOriginal('x^3 - 4x', [0, 1, 2, -1, 3]);
  });

  it('leading coefficient other than 1', () => {
    checkFactorizationMatchesOriginal('2x^2 - 8', [0, 1, 2, -2]);
  });
});

describe('factor: limitations', () => {
  it('throws for non-integer coefficients at degree 3+', () => {
    // No common factor of x here, so this genuinely stays a degree-3 polynomial with a
    // non-integer coefficient — unlike "0.5x^3 - x", which reduces to a degree-2 remainder
    // (real quadratics are always solvable) after factoring out x.
    expect(() => factor(parse('0.5x^3 - x^2 + x - 1'))).toThrow();
  });

  it('throws for a degree above the search limit', () => {
    expect(() => factor(parse('x^9 + x^2 + 1'))).toThrow();
  });

  it('linear factors fine regardless of integer-ness', () => {
    checkFactorizationMatchesOriginal('0.5x + 3', [0, 2, -4]);
  });
});
