import { CalcError } from './parser/errors';

export type Matrix = number[][];

const EPSILON = 1e-10;

export function dimensions(m: Matrix): { rows: number; cols: number } {
  return { rows: m.length, cols: m[0]?.length ?? 0 };
}

function assertSameDimensions(a: Matrix, b: Matrix, op: string): void {
  const da = dimensions(a);
  const db = dimensions(b);
  if (da.rows !== db.rows || da.cols !== db.cols) {
    throw new CalcError('invalid-input', `Cannot ${op} matrices of different sizes`);
  }
}

function assertSquare(m: Matrix, op: string): number {
  const { rows, cols } = dimensions(m);
  if (rows !== cols) {
    throw new CalcError('invalid-input', `${op} requires a square matrix`);
  }
  return rows;
}

export function add(a: Matrix, b: Matrix): Matrix {
  assertSameDimensions(a, b, 'add');
  return a.map((row, i) => row.map((value, j) => value + b[i][j]));
}

export function subtract(a: Matrix, b: Matrix): Matrix {
  assertSameDimensions(a, b, 'subtract');
  return a.map((row, i) => row.map((value, j) => value - b[i][j]));
}

export function multiply(a: Matrix, b: Matrix): Matrix {
  const da = dimensions(a);
  const db = dimensions(b);
  if (da.cols !== db.rows) {
    throw new CalcError('invalid-input', 'Matrix sizes are not compatible for multiplication (A columns must equal B rows)');
  }
  const result: Matrix = [];
  for (let i = 0; i < da.rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < db.cols; j++) {
      let sum = 0;
      for (let k = 0; k < da.cols; k++) sum += a[i][k] * b[k][j];
      row.push(sum);
    }
    result.push(row);
  }
  return result;
}

export function scale(m: Matrix, factor: number): Matrix {
  return m.map((row) => row.map((value) => value * factor));
}

export function transpose(m: Matrix): Matrix {
  const { rows, cols } = dimensions(m);
  const result: Matrix = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) result[j][i] = m[i][j];
  }
  return result;
}

/** Cofactor-expansion determinant. Fine for the small matrices (<=6x6) a calculator UI supports. */
export function determinant(m: Matrix): number {
  const n = assertSquare(m, 'Determinant');
  if (n === 1) return m[0][0];
  if (n === 2) return m[0][0] * m[1][1] - m[0][1] * m[1][0];

  let det = 0;
  for (let col = 0; col < n; col++) {
    const minor = m.slice(1).map((row) => row.filter((_, j) => j !== col));
    const sign = col % 2 === 0 ? 1 : -1;
    det += sign * m[0][col] * determinant(minor);
  }
  return det;
}

/** Gauss-Jordan elimination with partial pivoting. Throws if the matrix is singular. */
export function inverse(m: Matrix): Matrix {
  const n = assertSquare(m, 'Inverse');
  const augmented: Matrix = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) pivotRow = row;
    }
    if (Math.abs(augmented[pivotRow][col]) < EPSILON) {
      throw new CalcError('domain', 'This matrix is singular and has no inverse');
    }
    [augmented[col], augmented[pivotRow]] = [augmented[pivotRow], augmented[col]];

    const pivot = augmented[col][col];
    for (let j = 0; j < 2 * n; j++) augmented[col][j] /= pivot;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = 0; j < 2 * n; j++) augmented[row][j] -= factor * augmented[col][j];
    }
  }

  return augmented.map((row) => row.slice(n));
}

/** Solves the linear system A x = b via Gaussian elimination with partial pivoting. */
export function solveLinearSystem(a: Matrix, b: number[]): number[] {
  const n = assertSquare(a, 'Linear system');
  if (b.length !== n) {
    throw new CalcError('invalid-input', 'The constants vector must have one entry per row');
  }

  const augmented: number[][] = a.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) pivotRow = row;
    }
    if (Math.abs(augmented[pivotRow][col]) < EPSILON) {
      throw new CalcError('domain', 'This system has no unique solution');
    }
    [augmented[col], augmented[pivotRow]] = [augmented[pivotRow], augmented[col]];

    const pivot = augmented[col][col];
    for (let j = col; j <= n; j++) augmented[col][j] /= pivot;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = col; j <= n; j++) augmented[row][j] -= factor * augmented[col][j];
    }
  }

  return augmented.map((row) => row[n]);
}
