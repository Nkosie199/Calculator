import { CalcError } from './parser/errors';

function assertNonEmpty(data: number[]): void {
  if (data.length === 0) {
    throw new CalcError('invalid-input', 'Enter at least one number');
  }
}

export function mean(data: number[]): number {
  assertNonEmpty(data);
  return data.reduce((sum, v) => sum + v, 0) / data.length;
}

export function median(data: number[]): number {
  assertNonEmpty(data);
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Returns every value tied for the highest frequency (empty if every value appears once). */
export function mode(data: number[]): number[] {
  assertNonEmpty(data);
  const counts = new Map<number, number>();
  for (const v of data) counts.set(v, (counts.get(v) ?? 0) + 1);
  const maxCount = Math.max(...counts.values());
  if (maxCount === 1) return [];
  return [...counts.entries()].filter(([, count]) => count === maxCount).map(([value]) => value);
}

export function variance(data: number[], type: 'population' | 'sample' = 'sample'): number {
  assertNonEmpty(data);
  if (type === 'sample' && data.length < 2) {
    throw new CalcError('invalid-input', 'Sample variance needs at least 2 numbers');
  }
  const m = mean(data);
  const sumSquares = data.reduce((sum, v) => sum + (v - m) ** 2, 0);
  return sumSquares / (type === 'sample' ? data.length - 1 : data.length);
}

export function stdev(data: number[], type: 'population' | 'sample' = 'sample'): number {
  return Math.sqrt(variance(data, type));
}

export interface Quartiles {
  q1: number;
  q2: number;
  q3: number;
}

/** Quartiles via the median-of-halves method (excludes the overall median from each half when odd-length). */
export function quartiles(data: number[]): Quartiles {
  assertNonEmpty(data);
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lowerHalf = sorted.slice(0, mid);
  const upperHalf = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);
  return {
    q1: median(lowerHalf),
    q2: median(sorted),
    q3: median(upperHalf),
  };
}

export interface LinearRegression {
  slope: number;
  intercept: number;
  /** Pearson correlation coefficient, r. */
  r: number;
}

/** Least-squares linear regression y = slope*x + intercept over paired (x, y) points. */
export function linearRegression(points: Array<[number, number]>): LinearRegression {
  if (points.length < 2) {
    throw new CalcError('invalid-input', 'Linear regression needs at least 2 points');
  }
  const n = points.length;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const meanX = mean(xs);
  const meanY = mean(ys);

  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    sumXY += dx * dy;
    sumXX += dx * dx;
    sumYY += dy * dy;
  }

  if (sumXX === 0) {
    throw new CalcError('domain', 'All x values are identical — no well-defined line');
  }

  const slope = sumXY / sumXX;
  const intercept = meanY - slope * meanX;
  const r = sumYY === 0 ? 1 : sumXY / Math.sqrt(sumXX * sumYY);

  return { slope, intercept, r };
}
