import { describe, expect, it } from 'vitest';
import { add, argument, complex, divide, formatComplex, fromPolar, modulus, multiply, subtract, toPolar } from '../complex';

describe('complex arithmetic', () => {
  it('adds', () => {
    expect(add(complex(1, 2), complex(3, 4))).toEqual({ re: 4, im: 6 });
  });

  it('subtracts', () => {
    expect(subtract(complex(5, 5), complex(2, 1))).toEqual({ re: 3, im: 4 });
  });

  it('multiplies', () => {
    // (2+3i)(4-1i) = 8 -2i +12i -3i^2 = 8+10i+3 = 11+10i
    expect(multiply(complex(2, 3), complex(4, -1))).toEqual({ re: 11, im: 10 });
  });

  it('divides', () => {
    const result = divide(complex(4, 0), complex(2, 0));
    expect(result.re).toBeCloseTo(2, 10);
    expect(result.im).toBeCloseTo(0, 10);
  });

  it('throws on division by zero', () => {
    expect(() => divide(complex(1, 1), complex(0, 0))).toThrow();
  });
});

describe('polar form', () => {
  it('modulus of 3+4i is 5', () => {
    expect(modulus(complex(3, 4))).toBe(5);
  });

  it('argument of 1+1i is pi/4', () => {
    expect(argument(complex(1, 1))).toBeCloseTo(Math.PI / 4, 10);
  });

  it('round-trips through polar form', () => {
    const original = complex(3, 4);
    const polar = toPolar(original);
    const back = fromPolar(polar.r, polar.theta);
    expect(back.re).toBeCloseTo(original.re, 9);
    expect(back.im).toBeCloseTo(original.im, 9);
  });
});

describe('formatComplex', () => {
  it('formats a pure real number', () => {
    expect(formatComplex(complex(5, 0))).toBe('5');
  });
  it('formats a pure imaginary number', () => {
    expect(formatComplex(complex(0, 3))).toBe('3i');
  });
  it('formats a mixed number', () => {
    expect(formatComplex(complex(3, -4))).toBe('3 - 4i');
  });
  it('formats a mixed positive-imaginary number', () => {
    expect(formatComplex(complex(2, 5))).toBe('2 + 5i');
  });
});
