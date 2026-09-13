import { describe, expect, it } from 'vitest';
import { add, determinant, inverse, multiply, scale, solveLinearSystem, subtract, transpose } from '../matrix';

describe('elementwise ops', () => {
  it('adds', () => {
    expect(add([[1, 2]], [[3, 4]])).toEqual([[4, 6]]);
  });
  it('subtracts', () => {
    expect(subtract([[5, 5]], [[2, 1]])).toEqual([[3, 4]]);
  });
  it('scales', () => {
    expect(scale([[1, 2], [3, 4]], 2)).toEqual([[2, 4], [6, 8]]);
  });
  it('rejects mismatched sizes', () => {
    expect(() => add([[1, 2]], [[1]])).toThrow();
  });
});

describe('multiply', () => {
  it('multiplies compatible matrices', () => {
    const a = [[1, 2], [3, 4]];
    const b = [[5, 6], [7, 8]];
    expect(multiply(a, b)).toEqual([
      [19, 22],
      [43, 50],
    ]);
  });
  it('rejects incompatible sizes', () => {
    expect(() => multiply([[1, 2]], [[1, 2]])).toThrow();
  });
});

describe('transpose', () => {
  it('transposes a non-square matrix', () => {
    expect(transpose([[1, 2, 3], [4, 5, 6]])).toEqual([
      [1, 4],
      [2, 5],
      [3, 6],
    ]);
  });
});

describe('determinant', () => {
  it('2x2', () => {
    expect(determinant([[1, 2], [3, 4]])).toBe(1 * 4 - 2 * 3);
  });
  it('3x3', () => {
    expect(determinant([[6, 1, 1], [4, -2, 5], [2, 8, 7]])).toBe(-306);
  });
  it('rejects non-square', () => {
    expect(() => determinant([[1, 2, 3]])).toThrow();
  });
});

describe('inverse', () => {
  it('inverts a 2x2 matrix', () => {
    const inv = inverse([[4, 7], [2, 6]]);
    expect(inv[0][0]).toBeCloseTo(0.6, 10);
    expect(inv[0][1]).toBeCloseTo(-0.7, 10);
    expect(inv[1][0]).toBeCloseTo(-0.2, 10);
    expect(inv[1][1]).toBeCloseTo(0.4, 10);
  });
  it('throws for a singular matrix', () => {
    expect(() => inverse([[1, 2], [2, 4]])).toThrow();
  });
});

describe('solveLinearSystem', () => {
  it('solves a 2x2 system', () => {
    // x + y = 3, x - y = 1  =>  x=2, y=1
    const [x, y] = solveLinearSystem([[1, 1], [1, -1]], [3, 1]);
    expect(x).toBeCloseTo(2, 9);
    expect(y).toBeCloseTo(1, 9);
  });

  it('solves a 3x3 system', () => {
    // 2x+y-z=8, -3x-y+2z=-11, -2x+y+2z=-3 => x=2,y=3,z=-1
    const [x, y, z] = solveLinearSystem(
      [
        [2, 1, -1],
        [-3, -1, 2],
        [-2, 1, 2],
      ],
      [8, -11, -3],
    );
    expect(x).toBeCloseTo(2, 9);
    expect(y).toBeCloseTo(3, 9);
    expect(z).toBeCloseTo(-1, 9);
  });

  it('throws when there is no unique solution', () => {
    expect(() => solveLinearSystem([[1, 1], [2, 2]], [1, 2])).toThrow();
  });
});
