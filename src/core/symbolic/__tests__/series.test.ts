import { describe, expect, it } from 'vitest';
import { parse } from '../../parser/parser';
import { seriesToExpression, taylorSeries } from '../series';
import { evalAt } from './testUtils';

describe('taylorSeries', () => {
  it('exp(x) Maclaurin coefficients are 1/k!', () => {
    const terms = taylorSeries(parse('exp(x)'), 'x', 0, 5);
    expect(terms.map((t) => t.coefficient)).toEqual([1, 1, 0.5, 1 / 6, 1 / 24]);
  });

  it('sin(x) Maclaurin series matches sin(x) near 0', () => {
    const terms = taylorSeries(parse('sin(x)'), 'x', 0, 8, 'rad');
    const approx = seriesToExpression(terms, 'x', 0);
    for (const x of [0.1, 0.3, -0.4, 0.6]) {
      expect(evalAt(approx, x, 'rad')).toBeCloseTo(Math.sin(x), 4);
    }
  });

  it('cos(x) Taylor series centered away from 0', () => {
    const center = Math.PI / 4;
    const terms = taylorSeries(parse('cos(x)'), 'x', center, 6, 'rad');
    const approx = seriesToExpression(terms, 'x', center);
    for (const x of [center - 0.2, center, center + 0.15]) {
      expect(evalAt(approx, x, 'rad')).toBeCloseTo(Math.cos(x), 3);
    }
  });

  it('a Maclaurin series of a polynomial reproduces the polynomial exactly', () => {
    const terms = taylorSeries(parse('x^2 + 3x + 1'), 'x', 0, 3);
    const approx = seriesToExpression(terms, 'x', 0);
    for (const x of [0, 1, -2, 5]) {
      expect(evalAt(approx, x)).toBeCloseTo(x * x + 3 * x + 1, 9);
    }
  });

  it('rejects a non-positive term count', () => {
    expect(() => taylorSeries(parse('x'), 'x', 0, 0)).toThrow();
  });
});
