import type { AstNode } from '../parser/ast';
import { solveQuadratic } from '../equations';
import { CalcError } from '../parser/errors';
import { expand } from './expand';
import { fromCoefficients, toCoefficients } from './polynomial';
import { add, mul, num, sub } from './utils';

/** Builds (x - r), or (x + |r|) when r is negative, so factors never print as the ugly "x - -1". */
function linearRootFactor(varName: string, root: number): AstNode {
  const x: AstNode = { type: 'Variable', name: varName };
  return root >= 0 ? sub(x, num(root)) : add(x, num(-root));
}

const EPSILON = 1e-9;
const MAX_RATIONAL_ROOT_SEARCH_DEGREE = 8;

export interface FactorResult {
  node: AstNode;
  /** Set when the result includes a factor we couldn't reduce further (e.g. irreducible complex quadratic). */
  note?: string;
}

function isNearInteger(x: number): boolean {
  return Math.abs(x - Math.round(x)) < EPSILON;
}

function divisors(n: number): number[] {
  const result: number[] = [];
  const abs = Math.abs(Math.round(n));
  for (let i = 1; i <= abs; i++) {
    if (abs % i === 0) result.push(i);
  }
  return result;
}

/** Finds one rational root of a descending-order integer-coefficient polynomial, or null. */
function findRationalRoot(desc: number[]): number | null {
  const a0 = desc[desc.length - 1];
  const an = desc[0];
  if (a0 === 0) return 0;

  const pCandidates = divisors(a0);
  const qCandidates = divisors(an);
  for (const p of pCandidates) {
    for (const q of qCandidates) {
      for (const candidate of [p / q, -p / q]) {
        if (Math.abs(evaluateDescending(desc, candidate)) < EPSILON) return candidate;
      }
    }
  }
  return null;
}

function evaluateDescending(desc: number[], x: number): number {
  return desc.reduce((acc, coeff) => acc * x + coeff, 0);
}

function syntheticDivide(desc: number[], root: number): number[] {
  const result = [desc[0]];
  for (let i = 1; i < desc.length; i++) {
    result.push(desc[i] + root * result[i - 1]);
  }
  result.pop(); // last value is the remainder, which the caller has already verified is ~0
  return result;
}

/**
 * Factors a single-variable polynomial with a monic-friendly method: extract factors of the
 * variable itself, then repeatedly pull out rational roots via the rational root theorem and
 * synthetic division, falling back to the quadratic formula for the final degree-2 remainder.
 * Only handles integer-ish coefficients for degree 3+ (the quadratic/linear/constant cases work
 * for any real coefficients).
 */
export function factor(node: AstNode, varName = 'x'): FactorResult {
  const expanded = expand(node, varName);
  let coeffs = toCoefficients(expanded, varName); // ascending

  let xMultiplicity = 0;
  while (coeffs.length > 1 && coeffs[0] === 0) {
    coeffs = coeffs.slice(1);
    xMultiplicity++;
  }

  const factors: AstNode[] = [];
  let note: string | undefined;

  for (let i = 0; i < xMultiplicity; i++) factors.push({ type: 'Variable', name: varName });

  const degree = coeffs.length - 1;
  const leadingCoeff = coeffs[degree];

  if (degree === 0) {
    factors.push(num(coeffs[0]));
    return { node: buildProduct(factors), note };
  }

  if (degree >= 3) {
    if (degree > MAX_RATIONAL_ROOT_SEARCH_DEGREE) {
      throw new CalcError('unsupported', `Degree ${degree} is too high for this factoring method`);
    }
    if (!coeffs.every(isNearInteger)) {
      throw new CalcError('unsupported', 'Factoring degree 3+ polynomials only works with whole-number coefficients here');
    }
    coeffs = coeffs.map((c) => Math.round(c));

    let remaining = coeffs;
    while (remaining.length - 1 >= 3) {
      const desc = [...remaining].reverse();
      const root = findRationalRoot(desc);
      if (root === null) {
        note = `The remaining degree-${remaining.length - 1} factor has no rational roots, so it's left unfactored`;
        factors.push(fromCoefficients(remaining, varName));
        remaining = [1]; // consumed; stop the loop
        break;
      }
      factors.push(root === 0 ? { type: 'Variable', name: varName } : linearRootFactor(varName, root));
      const quotientDesc = syntheticDivide(desc, root);
      remaining = [...quotientDesc].reverse();
    }
    coeffs = remaining;
  }

  const finalDegree = coeffs.length - 1;
  if (finalDegree === 2) {
    const [c, b, a] = coeffs;
    const { root1, root2, discriminant } = solveQuadratic(a, b, c);
    if (discriminant >= 0) {
      if (a !== 1) factors.push(num(a));
      factors.push(linearRootFactor(varName, root1.re));
      factors.push(linearRootFactor(varName, root2.re));
    } else {
      note = note ?? 'This quadratic factor is irreducible over the reals (its roots are complex)';
      factors.push(fromCoefficients(coeffs, varName));
    }
  } else if (finalDegree === 1) {
    const [c, a] = coeffs;
    if (a !== 1) factors.push(num(a));
    factors.push(linearRootFactor(varName, -c / a));
  } else if (finalDegree === 0 && coeffs[0] !== 1) {
    factors.push(num(coeffs[0]));
  }

  if (factors.length === 0) factors.push(num(leadingCoeff));

  return { node: buildProduct(factors), note };
}

function buildProduct(factors: AstNode[]): AstNode {
  if (factors.length === 0) return num(1);
  return factors.reduce((acc, f) => (acc === null ? f : mul(acc, f)), null as AstNode | null) as AstNode;
}
