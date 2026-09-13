import type { AstNode } from '../parser/ast';
import { CalcError } from '../parser/errors';
import { containsVariable, mul, num, tryEvalConstant } from './utils';

const MAX_POWER = 12;

function notPolynomial(): never {
  throw new CalcError('unsupported', 'This is not a polynomial in a single variable — expand/factor only handles those');
}

/** Distributes multiplication over addition and expands small integer powers of sums, e.g. (x+1)^2 -> x^2+2x+1. */
export function expand(node: AstNode, varName: string): AstNode {
  switch (node.type) {
    case 'Number':
    case 'Constant':
      return node;
    case 'Variable':
      if (node.name !== varName) notPolynomial();
      return node;
    case 'Negate':
      return negateExpanded(expand(node.operand, varName));
    case 'Binary':
      return expandBinary(node, varName);
    default:
      notPolynomial();
  }
}

function expandBinary(node: Extract<AstNode, { type: 'Binary' }>, varName: string): AstNode {
  const { op, left, right } = node;

  if (op === '+' || op === '-') {
    return { type: 'Binary', op, left: expand(left, varName), right: expand(right, varName) };
  }

  if (op === '*') {
    return distributeMul(expand(left, varName), expand(right, varName));
  }

  if (op === '/') {
    const denominator = tryEvalConstant(right);
    if (denominator === null || denominator === 0) notPolynomial();
    return distributeMul(expand(left, varName), num(1 / denominator));
  }

  if (op === '^') {
    if (containsVariable(right, varName)) notPolynomial();
    const exponent = tryEvalConstant(right);
    if (exponent === null || !Number.isInteger(exponent) || exponent < 0) notPolynomial();
    if (exponent > MAX_POWER) {
      throw new CalcError('unsupported', `Exponent is too large to expand (limit ${MAX_POWER})`);
    }
    const base = expand(left, varName);
    if (exponent === 0) return num(1);
    let result = base;
    for (let i = 1; i < exponent; i++) result = distributeMul(result, base);
    return result;
  }

  notPolynomial();
}

function negateExpanded(node: AstNode): AstNode {
  if (node.type === 'Binary' && (node.op === '+' || node.op === '-')) {
    return { type: 'Binary', op: node.op, left: negateExpanded(node.left), right: negateExpanded(node.right) };
  }
  if (node.type === 'Negate') return node.operand;
  return { type: 'Negate', operand: node };
}

/** Multiplies two already-expanded expressions, distributing over any +/- structure in either side. */
function distributeMul(a: AstNode, b: AstNode): AstNode {
  if (a.type === 'Binary' && (a.op === '+' || a.op === '-')) {
    return { type: 'Binary', op: a.op, left: distributeMul(a.left, b), right: distributeMul(a.right, b) };
  }
  if (b.type === 'Binary' && (b.op === '+' || b.op === '-')) {
    return { type: 'Binary', op: b.op, left: distributeMul(a, b.left), right: distributeMul(a, b.right) };
  }
  return mul(a, b);
}
