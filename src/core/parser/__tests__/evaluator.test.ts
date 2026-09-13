import { describe, expect, it } from 'vitest';
import { calculate, CalcError, compileFunctionOfX } from '../index';

describe('basic arithmetic', () => {
  const cases: [string, number][] = [
    ['1 + 1', 2],
    ['10 - 3', 7],
    ['4 * 5', 20],
    ['9 / 3', 3],
    ['2 + 3 * 4', 14], // precedence
    ['(2 + 3) * 4', 20],
    ['-5 + 2', -3],
    ['3 - -2', 5],
    ['2 ^ 10', 1024],
    ['2 ^ -1', 0.5],
    ['2 ^ 2 ^ 3', 256], // right-associative: 2^(2^3)
    ['10 % ', 0.1],
    ['50%', 0.5],
    ['5!', 120],
    ['0!', 1],
    ['1 + 2 - 3 + 4', 4],
    ['2 * (3 + 4) * 5', 70],
  ];

  it.each(cases)('%s = %s', (expr, expected) => {
    expect(calculate(expr)).toBeCloseTo(expected, 10);
  });
});

describe('implicit multiplication', () => {
  it('number next to a constant', () => {
    expect(calculate('2pi')).toBeCloseTo(2 * Math.PI, 10);
  });

  it('number next to parentheses', () => {
    expect(calculate('3(4+5)')).toBe(27);
  });

  it('parentheses next to parentheses', () => {
    expect(calculate('(2)(3)')).toBe(6);
  });

  it('number next to a function call', () => {
    expect(calculate('2sqrt(9)')).toBe(6);
  });

  it('exponent binds tighter than an implicit factor', () => {
    // 2*pi^2, not (2*pi)^2
    expect(calculate('2pi^2')).toBeCloseTo(2 * Math.PI ** 2, 10);
  });
});

describe('constants', () => {
  it('pi', () => {
    expect(calculate('pi')).toBeCloseTo(Math.PI, 10);
  });
  it('e', () => {
    expect(calculate('e')).toBeCloseTo(Math.E, 10);
  });
});

describe('functions in degree mode (default)', () => {
  it('sin(30) = 0.5', () => {
    expect(calculate('sin(30)', 'deg')).toBeCloseTo(0.5, 10);
  });
  it('cos(60) = 0.5', () => {
    expect(calculate('cos(60)', 'deg')).toBeCloseTo(0.5, 10);
  });
  it('asin(0.5) = 30', () => {
    expect(calculate('asin(0.5)', 'deg')).toBeCloseTo(30, 9);
  });
});

describe('functions in radian mode', () => {
  it('sin(pi/2) = 1', () => {
    expect(calculate('sin(pi/2)', 'rad')).toBeCloseTo(1, 10);
  });
  it('cos(pi) = -1', () => {
    expect(calculate('cos(pi)', 'rad')).toBeCloseTo(-1, 10);
  });
});

describe('other functions', () => {
  const cases: [string, number][] = [
    ['log(100)', 2],
    ['ln(1)', 0],
    ['sqrt(16)', 4],
    ['cbrt(27)', 3],
    ['abs(-5)', 5],
    ['floor(3.7)', 3],
    ['ceil(3.2)', 4],
    ['round(3.5)', 4],
    ['exp(0)', 1],
  ];

  it.each(cases)('%s = %s', (expr, expected) => {
    expect(calculate(expr)).toBeCloseTo(expected, 10);
  });
});

describe('typed errors', () => {
  it('division by zero', () => {
    expect(() => calculate('1/0')).toThrowError(CalcError);
    try {
      calculate('1/0');
    } catch (e) {
      expect((e as CalcError).kind).toBe('division-by-zero');
    }
  });

  it('sqrt of a negative number is a domain error', () => {
    try {
      calculate('sqrt(-1)');
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(CalcError);
      expect((e as CalcError).kind).toBe('domain');
    }
  });

  it('asin outside [-1, 1] is a domain error', () => {
    try {
      calculate('asin(2)');
      expect.unreachable();
    } catch (e) {
      expect((e as CalcError).kind).toBe('domain');
    }
  });

  it('factorial of a negative number is a domain error', () => {
    try {
      calculate('(-1)!');
      expect.unreachable();
    } catch (e) {
      expect((e as CalcError).kind).toBe('domain');
    }
  });

  it('factorial of a non-integer is a domain error', () => {
    try {
      calculate('2.5!');
      expect.unreachable();
    } catch (e) {
      expect((e as CalcError).kind).toBe('domain');
    }
  });

  it('unbalanced parentheses is a syntax error', () => {
    try {
      calculate('(1 + 2');
      expect.unreachable();
    } catch (e) {
      expect((e as CalcError).kind).toBe('syntax');
    }
  });

  it('unknown function is an unknown-identifier error', () => {
    try {
      calculate('foo(1)');
      expect.unreachable();
    } catch (e) {
      expect((e as CalcError).kind).toBe('unknown-identifier');
    }
  });

  it('wrong arity is an arity error', () => {
    try {
      calculate('sin(1, 2)');
      expect.unreachable();
    } catch (e) {
      expect((e as CalcError).kind).toBe('arity');
    }
  });
});

describe('phase 2 functions', () => {
  const cases: [string, number][] = [
    ['gcd(48, 18)', 6],
    ['lcm(4, 6)', 12],
    ['npr(5, 2)', 20],
    ['ncr(5, 2)', 10],
    ['logb(8, 2)', 3],
    ['asinh(0)', 0],
    ['acosh(1)', 0],
    ['atanh(0)', 0],
  ];

  it.each(cases)('%s = %s', (expr, expected) => {
    expect(calculate(expr)).toBeCloseTo(expected, 10);
  });

  it('acosh below 1 is a domain error', () => {
    try {
      calculate('acosh(0)');
      expect.unreachable();
    } catch (e) {
      expect((e as CalcError).kind).toBe('domain');
    }
  });

  it('ncr requires r <= n', () => {
    try {
      calculate('ncr(2, 5)');
      expect.unreachable();
    } catch (e) {
      expect((e as CalcError).kind).toBe('domain');
    }
  });
});

describe('the x variable', () => {
  it('evaluates a compiled function of x at several points', () => {
    const f = compileFunctionOfX('x^2 + 1');
    expect(f(0)).toBe(1);
    expect(f(2)).toBe(5);
    expect(f(-3)).toBe(10);
  });

  it('x is undefined outside a variable context', () => {
    try {
      calculate('x + 1');
      expect.unreachable();
    } catch (e) {
      expect((e as CalcError).kind).toBe('unknown-identifier');
    }
  });
});

describe('determinism', () => {
  it('the same expression always produces the same result', () => {
    const expr = '2 + 3 * (4 - 1) ^ 2 / sqrt(9) - sin(30)';
    const first = calculate(expr);
    for (let i = 0; i < 50; i++) {
      expect(calculate(expr)).toBe(first);
    }
  });
});
