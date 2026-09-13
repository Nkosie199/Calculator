import type { AstNode } from './ast';
import { CalcError } from './errors';

export type AngleMode = 'deg' | 'rad';

export interface EvalContext {
  angleMode: AngleMode;
  variables?: Record<string, number>;
}

const MAX_FACTORIAL_N = 170; // 171! exceeds Number.MAX_VALUE

function toRadians(x: number, ctx: EvalContext): number {
  return ctx.angleMode === 'deg' ? (x * Math.PI) / 180 : x;
}

function fromRadians(x: number, ctx: EvalContext): number {
  return ctx.angleMode === 'deg' ? (x * 180) / Math.PI : x;
}

function assertFinite(value: number, message: string): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    throw new CalcError('domain', message);
  }
  return value;
}

function assertNonNegativeInteger(n: number, label: string): void {
  if (!Number.isInteger(n) || n < 0) {
    throw new CalcError('domain', `${label} is only defined for non-negative integers`);
  }
}

function gcd(a: number, b: number): number {
  assertNonNegativeInteger(a, 'gcd');
  assertNonNegativeInteger(b, 'gcd');
  let x = a;
  let y = b;
  while (y !== 0) {
    [x, y] = [y, x % y];
  }
  return x;
}

function lcm(a: number, b: number): number {
  assertNonNegativeInteger(a, 'lcm');
  assertNonNegativeInteger(b, 'lcm');
  if (a === 0 || b === 0) return 0;
  return assertFinite((a / gcd(a, b)) * b, 'lcm result is too large');
}

function nPr(n: number, r: number): number {
  assertNonNegativeInteger(n, 'nPr');
  assertNonNegativeInteger(r, 'nPr');
  if (r > n) throw new CalcError('domain', 'nPr requires r <= n');
  return factorial(n) / factorial(n - r);
}

function nCr(n: number, r: number): number {
  assertNonNegativeInteger(n, 'nCr');
  assertNonNegativeInteger(r, 'nCr');
  if (r > n) throw new CalcError('domain', 'nCr requires r <= n');
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function callFunction(name: string, args: number[], ctx: EvalContext): number {
  const x = args[0];
  switch (name) {
    case 'sin':
      return Math.sin(toRadians(x, ctx));
    case 'cos':
      return Math.cos(toRadians(x, ctx));
    case 'tan':
      return Math.tan(toRadians(x, ctx));
    case 'asin':
      if (x < -1 || x > 1) throw new CalcError('domain', 'asin is only defined for values between -1 and 1');
      return fromRadians(Math.asin(x), ctx);
    case 'acos':
      if (x < -1 || x > 1) throw new CalcError('domain', 'acos is only defined for values between -1 and 1');
      return fromRadians(Math.acos(x), ctx);
    case 'atan':
      return fromRadians(Math.atan(x), ctx);
    case 'sinh':
      return Math.sinh(x);
    case 'cosh':
      return Math.cosh(x);
    case 'tanh':
      return Math.tanh(x);
    case 'asinh':
      return Math.asinh(x);
    case 'acosh':
      if (x < 1) throw new CalcError('domain', 'acosh is only defined for values >= 1');
      return Math.acosh(x);
    case 'atanh':
      if (x <= -1 || x >= 1) throw new CalcError('domain', 'atanh is only defined for values between -1 and 1');
      return Math.atanh(x);
    case 'log':
      if (x <= 0) throw new CalcError('domain', 'log is only defined for positive numbers');
      return Math.log10(x);
    case 'logb': {
      const base = args[1];
      if (x <= 0) throw new CalcError('domain', 'logb is only defined for positive numbers');
      if (base <= 0 || base === 1) throw new CalcError('domain', 'logb requires a positive base other than 1');
      return Math.log(x) / Math.log(base);
    }
    case 'ln':
      if (x <= 0) throw new CalcError('domain', 'ln is only defined for positive numbers');
      return Math.log(x);
    case 'exp':
      return assertFinite(Math.exp(x), 'exp overflowed');
    case 'sqrt':
      if (x < 0) throw new CalcError('domain', 'sqrt is only defined for non-negative numbers');
      return Math.sqrt(x);
    case 'cbrt':
      return Math.cbrt(x);
    case 'abs':
      return Math.abs(x);
    case 'floor':
      return Math.floor(x);
    case 'ceil':
      return Math.ceil(x);
    case 'round':
      return Math.round(x);
    case 'gcd':
      return gcd(x, args[1]);
    case 'lcm':
      return lcm(x, args[1]);
    case 'npr':
      return nPr(x, args[1]);
    case 'ncr':
      return nCr(x, args[1]);
    default:
      // Unreachable: the parser already validated the function name and arity.
      throw new CalcError('unknown-identifier', `Unknown function "${name}"`);
  }
}

export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new CalcError('domain', 'Factorial is only defined for non-negative integers');
  }
  if (n > MAX_FACTORIAL_N) {
    throw new CalcError('domain', 'Factorial result is too large');
  }
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

/** Walks the AST and computes a numeric result. Throws CalcError for any invalid operation. */
export function evaluate(node: AstNode, ctx: EvalContext): number {
  switch (node.type) {
    case 'Number':
      return node.value;

    case 'Constant':
      return node.name === 'pi' ? Math.PI : Math.E;

    case 'Variable': {
      const value = ctx.variables?.[node.name];
      if (value === undefined) {
        throw new CalcError('unknown-identifier', `"${node.name}" has no value here`);
      }
      return value;
    }

    case 'Negate':
      return -evaluate(node.operand, ctx);

    case 'Percent':
      return evaluate(node.operand, ctx) / 100;

    case 'Factorial':
      return factorial(evaluate(node.operand, ctx));

    case 'Call':
      return callFunction(
        node.name,
        node.args.map((arg) => evaluate(arg, ctx)),
        ctx,
      );

    case 'Binary': {
      const left = evaluate(node.left, ctx);
      const right = evaluate(node.right, ctx);
      switch (node.op) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          if (right === 0) throw new CalcError('division-by-zero', 'Division by zero');
          return left / right;
        case '^':
          return assertFinite(Math.pow(left, right), 'That power is undefined for these values');
        default: {
          const exhaustive: never = node.op;
          throw new CalcError('syntax', `Unknown operator "${exhaustive}"`);
        }
      }
    }

    default: {
      const exhaustive: never = node;
      throw new CalcError('syntax', `Unknown node type "${JSON.stringify(exhaustive)}"`);
    }
  }
}
