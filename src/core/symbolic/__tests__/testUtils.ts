import type { AstNode } from '../../parser/ast';
import { evaluate, type AngleMode } from '../../parser/evaluator';

export function evalAt(node: AstNode, x: number, angleMode: AngleMode = 'rad'): number {
  return evaluate(node, { angleMode, variables: { x } });
}

/** Central-difference numeric derivative, used as an independent check on symbolic differentiation. */
export function numericDerivative(f: (x: number) => number, x: number, h = 1e-5): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}

/** Composite Simpson's rule, used as an independent check on symbolic integration. */
export function numericIntegral(f: (x: number) => number, a: number, b: number, n = 1000): number {
  const evenN = n % 2 === 0 ? n : n + 1;
  const h = (b - a) / evenN;
  let sum = f(a) + f(b);
  for (let i = 1; i < evenN; i++) {
    sum += f(a + i * h) * (i % 2 === 0 ? 2 : 4);
  }
  return (h / 3) * sum;
}
