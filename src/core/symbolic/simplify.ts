import type { AstNode } from '../parser/ast';
import { isNumber, mul, num } from './utils';

function numberValue(node: AstNode): number {
  return (node as { value: number }).value;
}

/** Merges a numeric literal into a nested "number * rest" product, e.g. 3*(2*x) -> 6*x. */
function mergeNestedNumericFactor(coeff: number, node: AstNode): AstNode | null {
  if (node.type !== 'Binary' || node.op !== '*') return null;
  if (isNumber(node.left)) return mul(num(coeff * numberValue(node.left)), node.right);
  if (isNumber(node.right)) return mul(num(coeff * numberValue(node.right)), node.left);
  return null;
}

function simplifyOnce(node: AstNode): AstNode {
  switch (node.type) {
    case 'Number':
    case 'Constant':
    case 'Variable':
      return node;

    case 'Negate': {
      const operand = simplifyOnce(node.operand);
      if (isNumber(operand)) return num(-(operand as { value: number }).value);
      if (operand.type === 'Negate') return operand.operand;
      return { type: 'Negate', operand };
    }

    case 'Percent': {
      const operand = simplifyOnce(node.operand);
      if (isNumber(operand)) return num((operand as { value: number }).value / 100);
      return { type: 'Percent', operand };
    }

    case 'Factorial': {
      const operand = simplifyOnce(node.operand);
      return { type: 'Factorial', operand };
    }

    case 'Call': {
      const args = node.args.map(simplifyOnce);
      return { type: 'Call', name: node.name, args };
    }

    case 'Binary': {
      const left = simplifyOnce(node.left);
      const right = simplifyOnce(node.right);

      if (isNumber(left) && isNumber(right)) {
        const l = (left as { value: number }).value;
        const r = (right as { value: number }).value;
        switch (node.op) {
          case '+':
            return num(l + r);
          case '-':
            return num(l - r);
          case '*':
            return num(l * r);
          case '/':
            if (r !== 0) return num(l / r);
            break;
          case '^':
            return num(Math.pow(l, r));
        }
      }

      switch (node.op) {
        case '+':
          if (isNumber(left, 0)) return right;
          if (isNumber(right, 0)) return left;
          break;
        case '-':
          if (isNumber(right, 0)) return left;
          if (isNumber(left, 0)) return { type: 'Negate', operand: right };
          break;
        case '*': {
          if (isNumber(left, 0) || isNumber(right, 0)) return num(0);
          if (isNumber(left, 1)) return right;
          if (isNumber(right, 1)) return left;
          if (isNumber(left, -1)) return { type: 'Negate', operand: right };
          if (isNumber(right, -1)) return { type: 'Negate', operand: left };
          if (isNumber(left)) {
            const merged = mergeNestedNumericFactor(numberValue(left), right);
            if (merged) return merged;
          }
          if (isNumber(right)) {
            const merged = mergeNestedNumericFactor(numberValue(right), left);
            if (merged) return merged;
          }
          break;
        }
        case '/':
          if (isNumber(left, 0)) return num(0);
          if (isNumber(right, 1)) return left;
          break;
        case '^':
          if (isNumber(right, 0)) return num(1);
          if (isNumber(right, 1)) return left;
          if (isNumber(left, 0)) return num(0);
          if (isNumber(left, 1)) return num(1);
          break;
      }

      return { type: 'Binary', op: node.op, left, right };
    }
  }
}

function structurallyEqual(a: AstNode, b: AstNode): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Repeatedly applies algebraic simplification rules until a fixed point (or a safety cap). */
export function simplify(node: AstNode): AstNode {
  let current = node;
  for (let i = 0; i < 25; i++) {
    const next = simplifyOnce(current);
    if (structurallyEqual(next, current)) return next;
    current = next;
  }
  return current;
}
