import { describe, expect, it } from 'vitest';
import { parse } from '../../parser/parser';
import { integrate } from '../integrate';
import { stringify } from '../stringify';
import { evalAt, numericIntegral } from './testUtils';

function checkDefiniteIntegral(expr: string, a: number, b: number, angleMode: 'deg' | 'rad' = 'rad') {
  const integrand = parse(expr);
  const antiderivative = integrate(integrand, 'x');
  const symbolic = evalAt(antiderivative, b, angleMode) - evalAt(antiderivative, a, angleMode);
  const numeric = numericIntegral((v) => evalAt(integrand, v, angleMode), a, b);
  expect(symbolic).toBeCloseTo(numeric, 3);
}

describe('integrate: exact simplified forms', () => {
  it('constant', () => {
    expect(stringify(integrate(parse('3')))).toBe('3*x');
  });
  it('x -> x^2/2', () => {
    expect(stringify(integrate(parse('x')))).toBe('x^2/2');
  });
  it('x^2 -> x^3/3', () => {
    expect(stringify(integrate(parse('x^2')))).toBe('x^3/3');
  });
  it('sin(x) -> -cos(x)', () => {
    expect(stringify(integrate(parse('sin(x)')))).toBe('-cos(x)');
  });
  it('exp(x) -> exp(x)', () => {
    expect(stringify(integrate(parse('exp(x)')))).toBe('exp(x)');
  });
  it('1/x -> ln(abs(x))', () => {
    expect(stringify(integrate(parse('1/x')))).toBe('ln(abs(x))');
  });
});

describe('integrate: numeric cross-check (definite integral vs. Simpson\'s rule)', () => {
  it('polynomial', () => checkDefiniteIntegral('3x^2 - 2x + 1', 0, 3));
  it('sin', () => checkDefiniteIntegral('sin(x)', 0, Math.PI));
  it('cos with linear argument', () => checkDefiniteIntegral('cos(2x + 1)', 0, 2));
  it('exp with linear argument', () => checkDefiniteIntegral('exp(-x)', 0, 2));
  it('constant multiple of a function', () => checkDefiniteIntegral('5*sin(x)', 0, 1.5));
  it('sum of terms', () => checkDefiniteIntegral('x^2 + sin(x) + 3', -1, 2));
  it('power of a linear expression', () => checkDefiniteIntegral('(2x + 1)^3', 0, 2));
  it('reciprocal of a linear expression', () => checkDefiniteIntegral('1 / (2x + 5)', 0, 3));
  it('division by a constant', () => checkDefiniteIntegral('x^2 / 4', 0, 2));
  it('constant base to a linear exponent (a^x)', () => checkDefiniteIntegral('2^x', 0, 3));
});

describe('integrate: unsupported forms', () => {
  it('product of two x-dependent factors', () => {
    expect(() => integrate(parse('x * sin(x)'))).toThrow();
  });
  it('x in both the base and the exponent', () => {
    expect(() => integrate(parse('x^x'))).toThrow();
  });
});
