import { describe, expect, it } from 'vitest';
import { parse } from '../../parser/parser';
import { differentiate } from '../differentiate';
import { stringify } from '../stringify';
import { evalAt, numericDerivative } from './testUtils';

function checkAgainstNumeric(expr: string, points: number[], angleMode: 'deg' | 'rad' = 'rad') {
  const original = parse(expr);
  const derivative = differentiate(original, 'x', 1);
  for (const x of points) {
    const symbolic = evalAt(derivative, x, angleMode);
    const numeric = numericDerivative((v) => evalAt(original, v, angleMode), x);
    expect(symbolic).toBeCloseTo(numeric, 3);
  }
}

describe('differentiate: exact simplified forms', () => {
  it('constant', () => {
    expect(stringify(differentiate(parse('5')))).toBe('0');
  });
  it('x', () => {
    expect(stringify(differentiate(parse('x')))).toBe('1');
  });
  it('x^2 -> 2x', () => {
    expect(stringify(differentiate(parse('x^2')))).toBe('2*x');
  });
  it('x^3 -> 3x^2', () => {
    expect(stringify(differentiate(parse('x^3')))).toBe('3*x^2');
  });
  it('sin(x) -> cos(x)', () => {
    expect(stringify(differentiate(parse('sin(x)')))).toBe('cos(x)');
  });
  it('exp(x) -> exp(x)', () => {
    expect(stringify(differentiate(parse('exp(x)')))).toBe('exp(x)');
  });
  it('ln(x) -> 1/x', () => {
    expect(stringify(differentiate(parse('ln(x)')))).toBe('1/x');
  });
});

describe('differentiate: numeric cross-check against finite differences', () => {
  const points = [0.3, 0.7, 1.5, 2.1, -1.2];

  it('polynomial', () => checkAgainstNumeric('3x^3 - 2x^2 + x - 7', points));
  it('product rule', () => checkAgainstNumeric('x^2 * sin(x)', points));
  it('quotient rule', () => checkAgainstNumeric('sin(x) / x', points.filter((p) => p !== 0)));
  it('chain rule with sin', () => checkAgainstNumeric('sin(x^2)', points));
  it('chain rule with exp', () => checkAgainstNumeric('exp(2x + 1)', points));
  it('nested chain rule', () => checkAgainstNumeric('sqrt(x^2 + 1)', points));
  it('tan', () => checkAgainstNumeric('tan(x)', [0.2, 0.5, -0.3]));
  it('power with variable exponent (a^x)', () => checkAgainstNumeric('2^x', points));
  it('general u^v', () => checkAgainstNumeric('x^x', [0.5, 1.2, 2.0]));
  it('atan', () => checkAgainstNumeric('atan(x)', points));
  it('cosh/sinh', () => checkAgainstNumeric('cosh(x) + sinh(x)', points));
});

describe('differentiate: higher order', () => {
  it('second derivative of x^4 is 12x^2', () => {
    const result = differentiate(parse('x^4'), 'x', 2);
    for (const x of [0.5, 2, -3]) {
      expect(evalAt(result, x)).toBeCloseTo(12 * x * x, 6);
    }
  });

  it('rejects a non-positive order', () => {
    expect(() => differentiate(parse('x'), 'x', 0)).toThrow();
  });
});

describe('differentiate: unsupported operations', () => {
  it('factorial of x', () => {
    expect(() => differentiate(parse('x!'))).toThrow();
  });
  it('gcd with x', () => {
    expect(() => differentiate(parse('gcd(x, 2)'))).toThrow();
  });
});
