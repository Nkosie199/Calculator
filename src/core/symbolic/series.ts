import type { AstNode } from '../parser/ast';
import { CalcError } from '../parser/errors';
import { evaluate, factorial, type AngleMode } from '../parser/evaluator';
import { differentiate } from './differentiate';
import { add, mul, num, pow, sub } from './utils';

export interface SeriesTerm {
  coefficient: number;
  power: number;
}

// Powers 0..numTerms-1 by repeated symbolic differentiation; Maclaurin is center = 0.
export function taylorSeries(node: AstNode, varName = 'x', center = 0, numTerms = 6, angleMode: AngleMode = 'rad'): SeriesTerm[] {
  if (!Number.isInteger(numTerms) || numTerms < 1) {
    throw new CalcError('invalid-input', 'The number of terms must be a positive integer');
  }

  const terms: SeriesTerm[] = [];
  let current = node;

  for (let k = 0; k < numTerms; k++) {
    let value: number;
    try {
      value = evaluate(current, { angleMode, variables: { [varName]: center } });
    } catch {
      throw new CalcError('domain', `The ${k === 0 ? 'function' : `${k}-th derivative`} isn't defined at x = ${center}`);
    }
    if (!Number.isFinite(value)) {
      throw new CalcError('domain', `The ${k === 0 ? 'function' : `${k}-th derivative`} isn't finite at x = ${center}`);
    }
    terms.push({ coefficient: value / factorial(k), power: k });

    if (k < numTerms - 1) {
      current = differentiate(current, varName, 1);
    }
  }

  return terms;
}

/** Builds a polynomial AST in (x - center) from Taylor series terms, e.g. for graphing the approximation. */
export function seriesToExpression(terms: SeriesTerm[], varName: string, center: number): AstNode {
  const xTerm: AstNode = center === 0 ? { type: 'Variable', name: varName } : sub({ type: 'Variable', name: varName }, num(center));

  let result: AstNode | null = null;
  for (const { coefficient, power } of terms) {
    if (coefficient === 0) continue;
    const absCoeff = Math.abs(coefficient);
    const powerNode = power === 0 ? num(1) : power === 1 ? xTerm : pow(xTerm, num(power));
    const term = power === 0 ? num(absCoeff) : absCoeff === 1 ? powerNode : mul(num(absCoeff), powerNode);
    if (result === null) {
      result = coefficient < 0 ? { type: 'Negate', operand: term } : term;
    } else {
      result = coefficient < 0 ? sub(result, term) : add(result, term);
    }
  }
  return result ?? num(0);
}
