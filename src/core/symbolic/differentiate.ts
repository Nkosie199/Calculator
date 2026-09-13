import type { AstNode } from '../parser/ast';
import { CalcError } from '../parser/errors';
import { simplify } from './simplify';
import { add, call, containsVariable, div, mul, neg, num, ONE, pow, sub, ZERO } from './utils';

const NOT_DIFFERENTIABLE = new Set(['floor', 'ceil', 'round']);
const NOT_SUPPORTED = new Set(['gcd', 'lcm', 'npr', 'ncr']);

/** Symbolically differentiates `node` with respect to `varName` (unsimplified — call simplify() after). */
function diffRaw(node: AstNode, varName: string): AstNode {
  if (!containsVariable(node, varName)) return ZERO;

  switch (node.type) {
    case 'Number':
    case 'Constant':
      return ZERO;

    case 'Variable':
      return node.name === varName ? ONE : ZERO;

    case 'Negate':
      return neg(diffRaw(node.operand, varName));

    case 'Percent':
      // x% means x/100.
      return diffRaw(div(node.operand, num(100)), varName);

    case 'Factorial':
      throw new CalcError('unsupported', "Can't symbolically differentiate a factorial");

    case 'Binary':
      return diffBinary(node, varName);

    case 'Call':
      return diffCall(node, varName);
  }
}

function diffBinary(node: Extract<AstNode, { type: 'Binary' }>, varName: string): AstNode {
  const { op, left, right } = node;
  const leftHasVar = containsVariable(left, varName);
  const rightHasVar = containsVariable(right, varName);

  switch (op) {
    case '+':
      return add(diffRaw(left, varName), diffRaw(right, varName));
    case '-':
      return sub(diffRaw(left, varName), diffRaw(right, varName));
    case '*': {
      const leftPrime = diffRaw(left, varName);
      const rightPrime = diffRaw(right, varName);
      return add(mul(leftPrime, right), mul(left, rightPrime));
    }
    case '/': {
      const leftPrime = diffRaw(left, varName);
      const rightPrime = diffRaw(right, varName);
      return div(sub(mul(leftPrime, right), mul(left, rightPrime)), pow(right, num(2)));
    }
    case '^': {
      if (!rightHasVar) {
        // Power rule: d/dx[u^n] = n * u^(n-1) * u'
        const uPrime = diffRaw(left, varName);
        return mul(mul(right, pow(left, sub(right, num(1)))), uPrime);
      }
      if (!leftHasVar) {
        // Exponential rule: d/dx[a^v] = a^v * ln(a) * v'
        const vPrime = diffRaw(right, varName);
        return mul(mul(node, call('ln', left)), vPrime);
      }
      // General case: d/dx[u^v] = u^v * (v' * ln(u) + v * u'/u)
      const uPrime = diffRaw(left, varName);
      const vPrime = diffRaw(right, varName);
      return mul(node, add(mul(vPrime, call('ln', left)), mul(right, div(uPrime, left))));
    }
  }
}

function diffCall(node: Extract<AstNode, { type: 'Call' }>, varName: string): AstNode {
  const { name, args } = node;

  if (NOT_SUPPORTED.has(name)) {
    throw new CalcError('unsupported', `Can't symbolically differentiate ${name}()`);
  }
  if (NOT_DIFFERENTIABLE.has(name)) {
    return ZERO;
  }

  if (name === 'logb') {
    // Rewrite log_b(u) as ln(u)/ln(b) and differentiate that instead.
    return diffRaw(div(call('ln', args[0]), call('ln', args[1])), varName);
  }

  const [u] = args;
  const uPrime = diffRaw(u, varName);

  const outerDerivative: AstNode = (() => {
    switch (name) {
      case 'sin':
        return call('cos', u);
      case 'cos':
        return neg(call('sin', u));
      case 'tan':
        return div(ONE, pow(call('cos', u), num(2)));
      case 'asin':
        return div(ONE, call('sqrt', sub(ONE, pow(u, num(2)))));
      case 'acos':
        return neg(div(ONE, call('sqrt', sub(ONE, pow(u, num(2))))));
      case 'atan':
        return div(ONE, add(ONE, pow(u, num(2))));
      case 'sinh':
        return call('cosh', u);
      case 'cosh':
        return call('sinh', u);
      case 'tanh':
        return div(ONE, pow(call('cosh', u), num(2)));
      case 'asinh':
        return div(ONE, call('sqrt', add(pow(u, num(2)), ONE)));
      case 'acosh':
        return div(ONE, call('sqrt', sub(pow(u, num(2)), ONE)));
      case 'atanh':
        return div(ONE, sub(ONE, pow(u, num(2))));
      case 'ln':
        return div(ONE, u);
      case 'log':
        return div(ONE, mul(u, call('ln', num(10))));
      case 'exp':
        return call('exp', u);
      case 'sqrt':
        return div(ONE, mul(num(2), call('sqrt', u)));
      case 'cbrt':
        return div(ONE, mul(num(3), pow(call('cbrt', u), num(2))));
      case 'abs':
        return div(u, call('abs', u));
      default:
        throw new CalcError('unsupported', `Can't symbolically differentiate ${name}()`);
    }
  })();

  return mul(outerDerivative, uPrime);
}

/** Symbolically differentiates `node` with respect to `varName` (default "x"), n times, then simplifies. */
export function differentiate(node: AstNode, varName = 'x', order = 1): AstNode {
  if (!Number.isInteger(order) || order < 1) {
    throw new CalcError('invalid-input', 'The derivative order must be a positive integer');
  }
  let result = node;
  for (let i = 0; i < order; i++) {
    result = simplify(diffRaw(result, varName));
  }
  return result;
}
