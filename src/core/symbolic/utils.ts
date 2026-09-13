import type { AstNode } from '../parser/ast';

export const ZERO: AstNode = { type: 'Number', value: 0 };
export const ONE: AstNode = { type: 'Number', value: 1 };

export function num(value: number): AstNode {
  return { type: 'Number', value };
}

export function isNumber(node: AstNode, value?: number): boolean {
  return node.type === 'Number' && (value === undefined || node.value === value);
}

/** True if `node` contains the variable `name` anywhere (so it isn't a constant with respect to it). */
export function containsVariable(node: AstNode, name: string): boolean {
  switch (node.type) {
    case 'Number':
    case 'Constant':
      return false;
    case 'Variable':
      return node.name === name;
    case 'Negate':
    case 'Percent':
    case 'Factorial':
      return containsVariable(node.operand, name);
    case 'Binary':
      return containsVariable(node.left, name) || containsVariable(node.right, name);
    case 'Call':
      return node.args.some((arg) => containsVariable(arg, name));
  }
}

export function add(a: AstNode, b: AstNode): AstNode {
  return { type: 'Binary', op: '+', left: a, right: b };
}

export function sub(a: AstNode, b: AstNode): AstNode {
  return { type: 'Binary', op: '-', left: a, right: b };
}

export function mul(a: AstNode, b: AstNode): AstNode {
  return { type: 'Binary', op: '*', left: a, right: b };
}

export function div(a: AstNode, b: AstNode): AstNode {
  return { type: 'Binary', op: '/', left: a, right: b };
}

export function pow(a: AstNode, b: AstNode): AstNode {
  return { type: 'Binary', op: '^', left: a, right: b };
}

export function neg(a: AstNode): AstNode {
  return { type: 'Negate', operand: a };
}

export function call(name: string, ...args: AstNode[]): AstNode {
  return { type: 'Call', name, args };
}

/** If `node` is an affine function of `varName` (a*varName + b with constant a, b), returns {a, b}. */
export function linearCoefficients(node: AstNode, varName: string): { a: number; b: number } | null {
  if (!containsVariable(node, varName)) {
    const constValue = tryEvalConstant(node);
    return constValue === null ? null : { a: 0, b: constValue };
  }
  if (node.type === 'Variable' && node.name === varName) {
    return { a: 1, b: 0 };
  }
  if (node.type === 'Negate') {
    const inner = linearCoefficients(node.operand, varName);
    return inner === null ? null : { a: -inner.a, b: -inner.b };
  }
  if (node.type === 'Binary' && (node.op === '+' || node.op === '-')) {
    const left = linearCoefficients(node.left, varName);
    const right = linearCoefficients(node.right, varName);
    if (left === null || right === null) return null;
    return node.op === '+' ? { a: left.a + right.a, b: left.b + right.b } : { a: left.a - right.a, b: left.b - right.b };
  }
  if (node.type === 'Binary' && node.op === '*') {
    const leftConst = tryEvalConstant(node.left);
    const rightConst = tryEvalConstant(node.right);
    if (leftConst !== null) {
      const right = linearCoefficients(node.right, varName);
      return right === null ? null : { a: leftConst * right.a, b: leftConst * right.b };
    }
    if (rightConst !== null) {
      const left = linearCoefficients(node.left, varName);
      return left === null ? null : { a: left.a * rightConst, b: left.b * rightConst };
    }
    return null;
  }
  return null;
}

/** Evaluates `node` if it contains no variables (only numbers/constants), else returns null. Used for constant folding. */
export function tryEvalConstant(node: AstNode): number | null {
  switch (node.type) {
    case 'Number':
      return node.value;
    case 'Constant':
      return node.name === 'pi' ? Math.PI : Math.E;
    case 'Negate': {
      const v = tryEvalConstant(node.operand);
      return v === null ? null : -v;
    }
    case 'Binary': {
      const l = tryEvalConstant(node.left);
      const r = tryEvalConstant(node.right);
      if (l === null || r === null) return null;
      switch (node.op) {
        case '+':
          return l + r;
        case '-':
          return l - r;
        case '*':
          return l * r;
        case '/':
          return r === 0 ? null : l / r;
        case '^':
          return Math.pow(l, r);
      }
      return null;
    }
    default:
      return null;
  }
}
