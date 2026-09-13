import type { AstNode } from '../parser/ast';
import { CalcError } from '../parser/errors';
import { add, mul, num, pow, sub } from './utils';

function notPolynomial(): never {
  throw new CalcError('unsupported', "Couldn't reduce this to a sum of terms like c*x^n — is it really a polynomial?");
}

/** Parses one already-expanded monomial (e.g. "3", "x", "-2x^3", "5*x") into {coeff, power}. */
function parseMonomial(node: AstNode, varName: string): { coeff: number; power: number } {
  switch (node.type) {
    case 'Number':
      return { coeff: node.value, power: 0 };
    case 'Variable':
      if (node.name !== varName) notPolynomial();
      return { coeff: 1, power: 1 };
    case 'Negate': {
      const inner = parseMonomial(node.operand, varName);
      return { coeff: -inner.coeff, power: inner.power };
    }
    case 'Binary':
      if (node.op === '^' && node.left.type === 'Variable' && node.left.name === varName && node.right.type === 'Number') {
        return { coeff: 1, power: node.right.value };
      }
      if (node.op === '*') {
        const l = parseMonomial(node.left, varName);
        const r = parseMonomial(node.right, varName);
        return { coeff: l.coeff * r.coeff, power: l.power + r.power };
      }
      notPolynomial();
      break;
    default:
      notPolynomial();
  }
}

/** Flattens an expanded +/- tree into signed monomial leaves. */
function flattenSum(node: AstNode, negated: boolean, out: Array<{ node: AstNode; negated: boolean }>): void {
  if (node.type === 'Binary' && (node.op === '+' || node.op === '-')) {
    flattenSum(node.left, negated, out);
    flattenSum(node.right, node.op === '-' ? !negated : negated, out);
    return;
  }
  out.push({ node, negated });
}

/** Converts an already-expanded polynomial into coefficients, ascending by power: [a0, a1, a2, ...]. */
export function toCoefficients(expandedNode: AstNode, varName: string): number[] {
  const leaves: Array<{ node: AstNode; negated: boolean }> = [];
  flattenSum(expandedNode, false, leaves);

  const coeffs: number[] = [];
  for (const { node, negated } of leaves) {
    const { coeff, power } = parseMonomial(node, varName);
    if (!Number.isInteger(power) || power < 0) notPolynomial();
    while (coeffs.length <= power) coeffs.push(0);
    coeffs[power] += negated ? -coeff : coeff;
  }
  if (coeffs.length === 0) coeffs.push(0);

  // Trim trailing (highest-degree) zero coefficients left over from cancellation.
  while (coeffs.length > 1 && coeffs[coeffs.length - 1] === 0) coeffs.pop();
  return coeffs;
}

/** Builds a*x^n + ... + a0 from ascending coefficients [a0, a1, ..., an]. */
export function fromCoefficients(coeffs: number[], varName: string): AstNode {
  let result: AstNode | null = null;
  for (let power = coeffs.length - 1; power >= 0; power--) {
    const c = coeffs[power];
    if (c === 0) continue;
    let term: AstNode;
    if (power === 0) {
      term = num(Math.abs(c));
    } else if (power === 1) {
      term = c === 1 || c === -1 ? { type: 'Variable', name: varName } : mul(num(Math.abs(c)), { type: 'Variable', name: varName });
    } else {
      const powerNode = pow({ type: 'Variable', name: varName }, num(power));
      term = Math.abs(c) === 1 ? powerNode : mul(num(Math.abs(c)), powerNode);
    }
    if (result === null) {
      result = c < 0 ? { type: 'Negate', operand: term } : term;
    } else {
      result = c < 0 ? sub(result, term) : add(result, term);
    }
  }
  return result ?? num(0);
}
