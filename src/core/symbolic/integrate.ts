import type { AstNode } from '../parser/ast';
import { CalcError } from '../parser/errors';
import { simplify } from './simplify';
import { add, call, containsVariable, div, linearCoefficients, mul, neg, num, pow, sub, tryEvalConstant } from './utils';

const LINEAR_ANTIDERIVATIVES: Record<string, (u: AstNode) => AstNode> = {
  sin: (u) => neg(call('cos', u)),
  cos: (u) => call('sin', u),
  exp: (u) => call('exp', u),
  sinh: (u) => call('cosh', u),
  cosh: (u) => call('sinh', u),
};

function unsupported(): never {
  throw new CalcError('unsupported', "Can't symbolically integrate this expression — try a simpler or different form");
}

function integrateRaw(node: AstNode, varName: string): AstNode {
  if (!containsVariable(node, varName)) {
    return mul(node, { type: 'Variable', name: varName });
  }

  if (node.type === 'Variable' && node.name === varName) {
    return div(pow(node, num(2)), num(2));
  }

  if (node.type === 'Negate') {
    return neg(integrateRaw(node.operand, varName));
  }

  if (node.type === 'Binary') {
    const { op, left, right } = node;

    if (op === '+') return add(integrateRaw(left, varName), integrateRaw(right, varName));
    if (op === '-') return sub(integrateRaw(left, varName), integrateRaw(right, varName));

    if (op === '*') {
      const leftIsConst = !containsVariable(left, varName);
      const rightIsConst = !containsVariable(right, varName);
      if (leftIsConst) return mul(left, integrateRaw(right, varName));
      if (rightIsConst) return mul(integrateRaw(left, varName), right);
      unsupported();
    }

    if (op === '/') {
      const rightIsConst = !containsVariable(right, varName);
      if (rightIsConst) return div(integrateRaw(left, varName), right);
      // c / (a*x+b): a constant numerator over a linear denominator.
      const numeratorConst = tryEvalConstant(left);
      const lin = linearCoefficients(right, varName);
      if (numeratorConst !== null && lin !== null && lin.a !== 0) {
        return mul(num(numeratorConst / lin.a), call('ln', call('abs', right)));
      }
      unsupported();
    }

    if (op === '^') {
      const rightIsConst = !containsVariable(right, varName);
      const leftIsConst = !containsVariable(left, varName);

      if (rightIsConst) {
        const exponent = tryEvalConstant(right);
        const lin = linearCoefficients(left, varName);
        if (exponent !== null && lin !== null && lin.a !== 0) {
          if (exponent === -1) {
            return mul(num(1 / lin.a), call('ln', call('abs', left)));
          }
          return div({ type: 'Binary', op: '^', left, right: num(exponent + 1) }, num((exponent + 1) * lin.a));
        }
      } else if (leftIsConst) {
        // Exponential rule: integral of a^(k*x+m) dx = a^(k*x+m) / (k * ln(a))
        const lin = linearCoefficients(right, varName);
        if (lin !== null && lin.a !== 0) {
          return div(node, mul(num(lin.a), call('ln', left)));
        }
      }
      unsupported();
    }
  }

  if (node.type === 'Call' && node.args.length === 1) {
    const lin = linearCoefficients(node.args[0], varName);
    const antiderivative = LINEAR_ANTIDERIVATIVES[node.name];
    if (lin !== null && lin.a !== 0 && antiderivative) {
      return div(antiderivative(node.args[0]), num(lin.a));
    }
  }

  unsupported();
}

/** Symbolically integrates `node` with respect to `varName` (default "x"). The result omits "+ C". */
export function integrate(node: AstNode, varName = 'x'): AstNode {
  return simplify(integrateRaw(node, varName));
}
