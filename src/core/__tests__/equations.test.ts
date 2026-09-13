import { describe, expect, it } from 'vitest';
import { findRoots, solveLinear, solveQuadratic } from '../equations';

describe('solveLinear', () => {
  it('solves 2x - 4 = 0', () => {
    expect(solveLinear(2, -4)).toBe(2);
  });
  it('throws when a is 0 and no solution exists', () => {
    expect(() => solveLinear(0, 5)).toThrow();
  });
});

describe('solveQuadratic', () => {
  it('solves real roots: x^2 - 3x + 2 = 0 -> x=1,2', () => {
    const { root1, root2, discriminant } = solveQuadratic(1, -3, 2);
    expect(discriminant).toBeGreaterThan(0);
    const roots = [root1.re, root2.re].sort((a, b) => a - b);
    expect(roots[0]).toBeCloseTo(1, 10);
    expect(roots[1]).toBeCloseTo(2, 10);
  });

  it('solves a repeated root: x^2 - 2x + 1 = 0 -> x=1', () => {
    const { root1, root2 } = solveQuadratic(1, -2, 1);
    expect(root1.re).toBeCloseTo(1, 10);
    expect(root2.re).toBeCloseTo(1, 10);
  });

  it('solves complex roots: x^2 + 1 = 0 -> x=+-i', () => {
    const { root1, root2, discriminant } = solveQuadratic(1, 0, 1);
    expect(discriminant).toBeLessThan(0);
    expect(root1.re).toBeCloseTo(0, 10);
    expect(Math.abs(root1.im)).toBeCloseTo(1, 10);
    expect(root2.re).toBeCloseTo(0, 10);
    expect(Math.abs(root2.im)).toBeCloseTo(1, 10);
  });

  it('falls back to linear when a is 0', () => {
    const { root1 } = solveQuadratic(0, 2, -4);
    expect(root1.re).toBeCloseTo(2, 10);
  });
});

describe('findRoots', () => {
  it('finds the root of x - 5', () => {
    const roots = findRoots((x) => x - 5, { min: 0, max: 10 });
    expect(roots).toHaveLength(1);
    expect(roots[0]).toBeCloseTo(5, 6);
  });

  it('finds both roots of x^2 - 4 over a symmetric range', () => {
    const roots = findRoots((x) => x * x - 4, { min: -10, max: 10 });
    expect(roots).toHaveLength(2);
    expect(roots[0]).toBeCloseTo(-2, 6);
    expect(roots[1]).toBeCloseTo(2, 6);
  });

  it('finds no roots when the function never crosses zero', () => {
    const roots = findRoots((x) => x * x + 1, { min: -10, max: 10 });
    expect(roots).toHaveLength(0);
  });

  it('rejects an invalid range', () => {
    expect(() => findRoots((x) => x, { min: 5, max: 1 })).toThrow();
  });
});
