import { complex, type Complex } from './complex';
import { CalcError } from './parser/errors';

/** Solves ax + b = 0. */
export function solveLinear(a: number, b: number): number {
  if (a === 0) {
    throw new CalcError('domain', b === 0 ? 'Every value of x is a solution' : 'There is no solution');
  }
  return -b / a;
}

export interface QuadraticSolution {
  root1: Complex;
  root2: Complex;
  discriminant: number;
}

/** Solves ax^2 + bx + c = 0, including complex roots when the discriminant is negative. */
export function solveQuadratic(a: number, b: number, c: number): QuadraticSolution {
  if (a === 0) {
    const root = solveLinear(b, c);
    return { root1: complex(root), root2: complex(root), discriminant: 0 };
  }

  const discriminant = b * b - 4 * a * c;
  if (discriminant >= 0) {
    const sqrtD = Math.sqrt(discriminant);
    return {
      root1: complex((-b + sqrtD) / (2 * a)),
      root2: complex((-b - sqrtD) / (2 * a)),
      discriminant,
    };
  }

  const sqrtD = Math.sqrt(-discriminant);
  return {
    root1: complex(-b / (2 * a), sqrtD / (2 * a)),
    root2: complex(-b / (2 * a), -sqrtD / (2 * a)),
    discriminant,
  };
}

export interface RootFindOptions {
  min: number;
  max: number;
  /** Number of sample intervals to scan for sign changes before bisecting. */
  steps?: number;
  tolerance?: number;
}

/**
 * Numerically finds real roots of an arbitrary continuous function over [min, max] by scanning
 * for sign changes and bisecting each bracket. Deterministic (fixed iteration count), no
 * randomness. May miss roots that don't cross zero (e.g. a root that only touches zero) or
 * multiple roots inside one scan interval — increase `steps` for a finer scan.
 */
export function findRoots(f: (x: number) => number, options: RootFindOptions): number[] {
  const { min, max, steps = 200, tolerance = 1e-10 } = options;
  if (min >= max) {
    throw new CalcError('invalid-input', 'The search range must have min < max');
  }

  const roots: number[] = [];
  const width = (max - min) / steps;
  let prevX = min;
  let prevY = safeEval(f, prevX);

  for (let i = 1; i <= steps; i++) {
    const x = min + i * width;
    const y = safeEval(f, x);

    if (prevY !== null && y !== null) {
      if (prevY === 0) {
        roots.push(prevX);
      } else if (Math.sign(prevY) !== Math.sign(y)) {
        roots.push(bisect(f, prevX, x, tolerance));
      }
    }
    prevX = x;
    prevY = y;
  }

  if (prevY === 0) roots.push(prevX);

  return dedupe(roots, tolerance * 10);
}

function safeEval(f: (x: number) => number, x: number): number | null {
  try {
    const y = f(x);
    return Number.isFinite(y) ? y : null;
  } catch {
    return null;
  }
}

function bisect(f: (x: number) => number, a: number, b: number, tolerance: number): number {
  let lo = a;
  let hi = b;
  let fLo = f(lo);
  for (let i = 0; i < 100 && hi - lo > tolerance; i++) {
    const mid = (lo + hi) / 2;
    const fMid = f(mid);
    if (fMid === 0) return mid;
    if (Math.sign(fMid) === Math.sign(fLo)) {
      lo = mid;
      fLo = fMid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

function dedupe(values: number[], tolerance: number): number[] {
  const result: number[] = [];
  for (const v of values.sort((a, b) => a - b)) {
    if (result.length === 0 || Math.abs(v - result[result.length - 1]) > tolerance) {
      result.push(v);
    }
  }
  return result;
}
