import { describe, expect, it } from 'vitest';
import { answerQuery } from '../index';

function answerValue(input: string): string {
  const result = answerQuery(input);
  if (result.kind !== 'answer') throw new Error(`Expected an answer for "${input}", got ${JSON.stringify(result)}`);
  return result.value;
}

describe('answerQuery: plain expressions fall back to direct evaluation', () => {
  it('arithmetic', () => {
    expect(answerValue('2 + 3 * 4')).toBe('14');
  });
  it('function calls', () => {
    expect(answerValue('sqrt(16)')).toBe('4');
  });
});

describe('answerQuery: derivative', () => {
  it('derivative of x^2', () => {
    expect(answerValue('derivative of x^2')).toContain('2*x');
  });
  it('is case-insensitive', () => {
    expect(answerValue('DERIVATIVE OF x^2')).toContain('2*x');
  });
  it('second derivative', () => {
    expect(answerValue('second derivative of x^3')).toContain('6*x');
  });
  it('differentiate phrasing', () => {
    expect(answerValue('differentiate sin(x)')).toContain('cos(x)');
  });
  it('d/dx phrasing', () => {
    expect(answerValue('d/dx of x^2')).toContain('2*x');
  });
});

describe('answerQuery: integral', () => {
  it('integral of sin(x)', () => {
    expect(answerValue('integral of sin(x)')).toContain('-cos(x)');
  });
  it('integrate phrasing', () => {
    expect(answerValue('integrate x^2')).toContain('x^3/3');
  });
});

describe('answerQuery: factor / simplify', () => {
  it('factor', () => {
    const value = answerValue('factor x^2 - 5x + 6');
    expect(value).toContain('x - 3');
    expect(value).toContain('x - 2');
  });
  it('simplify', () => {
    expect(answerValue('simplify x + 0')).toBe('x');
  });
});

describe('answerQuery: solve', () => {
  it('linear with =', () => {
    expect(answerValue('solve 2x - 4 = 0')).toBe('x = 2');
  });
  it('quadratic with real roots', () => {
    const value = answerValue('solve x^2 - 4 = 0');
    expect(value).toContain('x = 2');
    expect(value).toContain('x = -2');
  });
  it('quadratic with complex roots', () => {
    const value = answerValue('solve x^2 + 1 = 0');
    expect(value).toMatch(/i/);
  });
  it('without an explicit = 0', () => {
    expect(answerValue('solve x^2 - 4')).toContain('x = 2');
  });
  it('non-polynomial falls back to a numeric search', () => {
    const value = answerValue('solve sin(x) = 0');
    expect(value).toContain('x =');
  });
});

describe('answerQuery: percentage', () => {
  it('N% of M', () => {
    expect(answerValue('15% of 240')).toBe('36');
  });
  it('what is N% of M', () => {
    expect(answerValue('what is 50% of 10')).toBe('5');
  });
});

describe('answerQuery: gcd/lcm', () => {
  it('gcd of a and b', () => {
    expect(answerValue('gcd of 48 and 18')).toBe('6');
  });
  it('lcm of a and b', () => {
    expect(answerValue('lcm of 4 and 6')).toBe('12');
  });
});

describe('answerQuery: unit conversion', () => {
  it('length: km to miles', () => {
    const value = answerValue('5 km in miles');
    expect(value).toContain('3.1');
  });
  it('temperature: f to c', () => {
    expect(answerValue('98.6 f to c')).toContain('37');
  });
  it('falls back to plain-expression failure for unrecognized unit words', () => {
    // "5 foo in bar" isn't a known unit pair, so it should NOT crash — it should
    // fail through to the generic "no pattern" error rather than throw.
    const result = answerQuery('5 foo in bar');
    expect(result.kind).toBe('error');
  });
});

describe('answerQuery: plot', () => {
  it('returns a navigate result', () => {
    const result = answerQuery('plot sin(x)');
    expect(result).toEqual({ kind: 'navigate', mode: 'graph', expression: 'sin(x)' });
  });
  it('graph phrasing also works', () => {
    const result = answerQuery('graph x^2');
    expect(result).toEqual({ kind: 'navigate', mode: 'graph', expression: 'x^2' });
  });
});

describe('answerQuery: graceful failure', () => {
  it('empty input', () => {
    expect(answerQuery('').kind).toBe('error');
  });
  it('a bare variable with no context', () => {
    const result = answerQuery('x^2');
    expect(result.kind).toBe('error');
  });
  it('total gibberish', () => {
    const result = answerQuery('asdkjfh qwoeiu');
    expect(result.kind).toBe('error');
    if (result.kind === 'error') {
      expect(result.suggestions.length).toBeGreaterThan(0);
    }
  });
});
