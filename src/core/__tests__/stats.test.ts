import { describe, expect, it } from 'vitest';
import { linearRegression, mean, median, mode, quartiles, stdev, variance } from '../stats';

const data = [2, 4, 4, 4, 5, 5, 7, 9];

describe('descriptive stats', () => {
  it('mean', () => {
    expect(mean(data)).toBe(5);
  });
  it('median (even length)', () => {
    expect(median(data)).toBe(4.5);
  });
  it('median (odd length)', () => {
    expect(median([1, 2, 3])).toBe(2);
  });
  it('mode', () => {
    expect(mode(data)).toEqual([4]);
  });
  it('mode returns empty when nothing repeats', () => {
    expect(mode([1, 2, 3])).toEqual([]);
  });
  it('population variance and stdev', () => {
    expect(variance(data, 'population')).toBeCloseTo(4, 10);
    expect(stdev(data, 'population')).toBeCloseTo(2, 10);
  });
  it('sample variance differs from population variance', () => {
    expect(variance(data, 'sample')).toBeCloseTo((4 * 8) / 7, 10);
  });
  it('throws on empty input', () => {
    expect(() => mean([])).toThrow();
  });
  it('sample variance needs at least 2 points', () => {
    expect(() => variance([5], 'sample')).toThrow();
  });
});

describe('quartiles', () => {
  it('computes q1/q2/q3', () => {
    const q = quartiles(data);
    expect(q.q1).toBeCloseTo(4, 10);
    expect(q.q2).toBeCloseTo(4.5, 10);
    expect(q.q3).toBeCloseTo(6, 10);
  });
});

describe('linearRegression', () => {
  it('fits a perfect line y = 2x + 1', () => {
    const points: Array<[number, number]> = [
      [0, 1],
      [1, 3],
      [2, 5],
      [3, 7],
    ];
    const { slope, intercept, r } = linearRegression(points);
    expect(slope).toBeCloseTo(2, 9);
    expect(intercept).toBeCloseTo(1, 9);
    expect(Math.abs(r)).toBeCloseTo(1, 9);
  });

  it('throws with fewer than 2 points', () => {
    expect(() => linearRegression([[0, 0]])).toThrow();
  });

  it('throws when every x is identical', () => {
    expect(() =>
      linearRegression([
        [1, 2],
        [1, 5],
      ]),
    ).toThrow();
  });
});
