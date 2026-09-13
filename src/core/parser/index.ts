import { evaluate, type AngleMode, type EvalContext } from './evaluator';
import { parse } from './parser';

export { parse } from './parser';
export { evaluate } from './evaluator';
export { tokenize } from './tokenizer';
export { CalcError, type CalcErrorKind } from './errors';
export type { AstNode, BinaryOp } from './ast';
export type { AngleMode, EvalContext } from './evaluator';

/** Parses and evaluates a raw expression string in one step. Throws CalcError on invalid input. */
export function calculate(input: string, angleMode: AngleMode = 'deg'): number {
  const ctx: EvalContext = { angleMode };
  return evaluate(parse(input), ctx);
}

/** Parses `expr` once and returns a function that evaluates it at any x — for graphing and root-finding. */
export function compileFunctionOfX(expr: string, angleMode: AngleMode = 'deg'): (x: number) => number {
  const ast = parse(expr);
  return (x: number) => evaluate(ast, { angleMode, variables: { x } });
}
