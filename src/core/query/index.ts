import { formatComplex } from '../complex';
import { findRoots, solveLinear, solveQuadratic } from '../equations';
import { CalcError, calculate, compileFunctionOfX, parse, type AngleMode } from '../parser';
import { differentiate } from '../symbolic/differentiate';
import { expand } from '../symbolic/expand';
import { factor } from '../symbolic/factor';
import { integrate } from '../symbolic/integrate';
import { toCoefficients } from '../symbolic/polynomial';
import { simplify } from '../symbolic/simplify';
import { stringify } from '../symbolic/stringify';
import { convertLinear, convertTemperature } from '../units';
import { resolveUnit } from './unitAliases';

export type QueryResult =
  | { kind: 'answer'; title: string; value: string; detail?: string }
  | { kind: 'navigate'; mode: 'graph'; expression: string }
  | { kind: 'error'; message: string; suggestions: string[] };

const ORDER_WORDS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
  '1st': 1,
  '2nd': 2,
  '3rd': 3,
  '4th': 4,
  '5th': 5,
};

const EXAMPLES = [
  '2 + 3 * 4',
  'derivative of x^2',
  'second derivative of x^3',
  'integral of sin(x)',
  'solve x^2 - 4 = 0',
  'factor x^2 - 5x + 6',
  'simplify (x+1) - 1',
  '15% of 240',
  '5 km in miles',
  '98.6 f to c',
  'gcd of 48 and 18',
  'plot sin(x)',
];

function ok(title: string, value: string, detail?: string): QueryResult {
  return { kind: 'answer', title, value, detail };
}

function fail(message: string): QueryResult {
  return { kind: 'error', message, suggestions: EXAMPLES };
}

function formatNum(value: number): string {
  if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
  if (Object.is(value, -0)) return '0';
  return Number(value.toPrecision(10)).toString();
}

function messageOf(e: unknown): string {
  return e instanceof CalcError ? e.message : e instanceof Error ? e.message : 'That expression is invalid';
}

function handleDerivative(expr: string, orderWord: string | undefined): QueryResult {
  try {
    const order = orderWord ? (ORDER_WORDS[orderWord.toLowerCase()] ?? 1) : 1;
    const ast = parse(expr);
    const result = differentiate(ast, 'x', order);
    const label = order === 1 ? "f'(x)" : `f${"'".repeat(Math.min(order, 4))}(x)`;
    return ok('Derivative', `${label} = ${stringify(result)}`);
  } catch (e) {
    return fail(messageOf(e));
  }
}

function handleIntegral(expr: string): QueryResult {
  try {
    const ast = parse(expr);
    const result = integrate(ast, 'x');
    return ok('Integral', `∫ f(x) dx = ${stringify(result)} + C`);
  } catch (e) {
    return fail(messageOf(e));
  }
}

function handleFactor(expr: string): QueryResult {
  try {
    const { node, note } = factor(parse(expr), 'x');
    return ok('Factored form', stringify(node), note);
  } catch (e) {
    return fail(messageOf(e));
  }
}

function handleSimplify(expr: string): QueryResult {
  try {
    return ok('Simplified', stringify(simplify(parse(expr))));
  } catch (e) {
    return fail(messageOf(e));
  }
}

function handleSolve(lhs: string, rhs: string | null, angleMode: AngleMode): QueryResult {
  const diffExpr = rhs !== null ? `(${lhs})-(${rhs})` : lhs;

  try {
    const expanded = expand(parse(diffExpr), 'x');
    const coeffs = toCoefficients(expanded, 'x');
    const degree = coeffs.length - 1;

    if (degree === 1) {
      const x = solveLinear(coeffs[1], coeffs[0]);
      return ok('Solve', `x = ${formatNum(x)}`);
    }
    if (degree === 2) {
      const { root1, root2, discriminant } = solveQuadratic(coeffs[2], coeffs[1], coeffs[0]);
      if (discriminant >= 0) {
        return ok('Solve', `x = ${formatNum(root1.re)} or x = ${formatNum(root2.re)}`);
      }
      return ok('Solve', `x = ${formatComplex(root1)} or x = ${formatComplex(root2)}`);
    }
  } catch {
    // Not a clean polynomial — fall through to a numeric search below.
  }

  try {
    const f = compileFunctionOfX(diffExpr, angleMode);
    const roots = findRoots(f, { min: -100, max: 100, steps: 800 });
    if (roots.length === 0) {
      return fail("I searched x from -100 to 100 and came up empty — try the Equations tab for a custom range.");
    }
    return ok('Solve (numeric)', roots.map((r) => `x = ${formatNum(r)}`).join(', '));
  } catch (e) {
    return fail(messageOf(e));
  }
}

function handlePercent(percentStr: string, ofStr: string): QueryResult {
  const percent = Number(percentStr);
  const of = Number(ofStr);
  return ok('Percentage', formatNum((percent / 100) * of));
}

function handleGcdLcm(fn: string, aStr: string, bStr: string): QueryResult {
  try {
    const result = calculate(`${fn}(${aStr},${bStr})`);
    return ok(fn.toUpperCase(), formatNum(result));
  } catch (e) {
    return fail(messageOf(e));
  }
}

function handleUnitConversion(valueStr: string, fromPhrase: string, toPhrase: string): QueryResult | null {
  const from = resolveUnit(fromPhrase);
  const to = resolveUnit(toPhrase);
  if (!from || !to || from.category !== to.category) return null;

  const value = Number(valueStr);
  const result =
    from.category === 'temperature'
      ? convertTemperature(value, from.unit as never, to.unit as never)
      : convertLinear(value, from.category, from.unit, to.unit);
  return ok('Unit conversion', `${formatNum(value)} ${fromPhrase.trim()} = ${formatNum(result)} ${toPhrase.trim()}`);
}

const UNIT_WORD = '[a-zA-Z/]+(?:\\s+[a-zA-Z/]+)?';

/**
 * Matches `input` against a fixed, documented grammar of query patterns — never an AI model, so the
 * same input always produces the same answer. Falls back to evaluating `input` as a plain expression,
 * then to a helpful "unsupported" message listing example queries.
 */
export function answerQuery(rawInput: string, angleMode: AngleMode = 'deg'): QueryResult {
  const input = rawInput.trim();
  if (input === '') return fail('Type something to ask.');

  let m: RegExpMatchArray | null;

  m = input.match(/^(?:plot|graph)\s+(.+)$/i);
  if (m) return { kind: 'navigate', mode: 'graph', expression: m[1].trim() };

  m = input.match(/^(?:(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)\s+)?derivative\s+of\s+(.+)$/i);
  if (m) return handleDerivative(m[2].trim(), m[1]);

  m = input.match(/^differentiate\s+(.+)$/i);
  if (m) return handleDerivative(m[1].trim(), undefined);

  m = input.match(/^d\/dx\s+(?:of\s+)?(.+)$/i);
  if (m) return handleDerivative(m[1].trim(), undefined);

  m = input.match(/^(?:integral|integrate)\s+of\s+(.+)$/i) ?? input.match(/^integrate\s+(.+)$/i);
  if (m) return handleIntegral(m[1].trim());

  m = input.match(/^factor\s+(.+)$/i);
  if (m) return handleFactor(m[1].trim());

  m = input.match(/^simplify\s+(.+)$/i);
  if (m) return handleSimplify(m[1].trim());

  m = input.match(/^solve\s+(.+?)\s*=\s*(.+)$/i);
  if (m) return handleSolve(m[1].trim(), m[2].trim(), angleMode);

  m = input.match(/^solve\s+(?:for\s+x\s+in\s+)?(.+)$/i);
  if (m) return handleSolve(m[1].trim(), null, angleMode);

  m = input.match(/^(?:what\s+is\s+)?([\d.]+)\s*%\s*of\s+([\d.]+)$/i);
  if (m) return handlePercent(m[1], m[2]);

  m = input.match(/^(gcd|lcm)\s+of\s+([\d.]+)\s+and\s+([\d.]+)$/i);
  if (m) return handleGcdLcm(m[1].toLowerCase(), m[2], m[3]);

  m = input.match(new RegExp(`^([\\d.]+)\\s*(${UNIT_WORD})\\s+(?:in|to)\\s+(${UNIT_WORD})$`, 'i'));
  if (m) {
    const result = handleUnitConversion(m[1], m[2], m[3]);
    if (result) return result;
  }

  try {
    const result = calculate(input, angleMode);
    return ok('Result', formatNum(result));
  } catch {
    // Not a recognized pattern and not a plain expression either.
  }

  return fail(`Hmm, I don't know that one yet!`);
}
