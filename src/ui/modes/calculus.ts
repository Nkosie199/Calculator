import { CalcError, parse } from '../../core/parser';
import { differentiate } from '../../core/symbolic/differentiate';
import { factor } from '../../core/symbolic/factor';
import { integrate } from '../../core/symbolic/integrate';
import { seriesToExpression, taylorSeries } from '../../core/symbolic/series';
import { stringify } from '../../core/symbolic/stringify';
import { getAngleMode } from '../angleMode';

function text(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value;
}

function num(id: string): number {
  return Number((document.getElementById(id) as HTMLInputElement).value);
}

function setResult(id: string, value: string): void {
  (document.getElementById(id) as HTMLElement).textContent = value;
}

function setError(id: string, value: string): void {
  (document.getElementById(id) as HTMLElement).textContent = value;
}

function handleDifferentiate(): void {
  setError('calcDiffError', '');
  try {
    const ast = parse(text('calcDiffFn'));
    const order = num('calcDiffOrder');
    const result = differentiate(ast, 'x', order);
    const label = order === 1 ? "f'(x)" : `f${'′'.repeat(Math.min(order, 3))}(x)${order > 3 ? ` [order ${order}]` : ''}`;
    setResult('calcDiffResult', `${label} = ${stringify(result)}`);
  } catch (e) {
    setResult('calcDiffResult', '');
    setError('calcDiffError', e instanceof CalcError ? e.message : 'Invalid expression');
  }
}

function handleIntegrate(): void {
  setError('calcIntError', '');
  try {
    const ast = parse(text('calcIntFn'));
    const result = integrate(ast, 'x');
    setResult('calcIntResult', `∫ f(x) dx = ${stringify(result)} + C`);
  } catch (e) {
    setResult('calcIntResult', '');
    setError('calcIntError', e instanceof CalcError ? e.message : 'Invalid expression');
  }
}

function handleSeries(): void {
  setError('calcSeriesError', '');
  try {
    const ast = parse(text('calcSeriesFn'));
    const center = num('calcSeriesCenter');
    const terms = Math.round(num('calcSeriesTerms'));
    const series = taylorSeries(ast, 'x', center, terms, getAngleMode());
    const expression = seriesToExpression(series, 'x', center);
    setResult('calcSeriesResult', `f(x) ≈ ${stringify(expression)}`);
  } catch (e) {
    setResult('calcSeriesResult', '');
    setError('calcSeriesError', e instanceof CalcError ? e.message : 'Invalid expression');
  }
}

function handleFactor(): void {
  setError('calcFactorError', '');
  try {
    const ast = parse(text('calcFactorFn'));
    const { node, note } = factor(ast, 'x');
    setResult('calcFactorResult', `${stringify(node)}${note ? `\n${note}` : ''}`);
  } catch (e) {
    setResult('calcFactorResult', '');
    setError('calcFactorError', e instanceof CalcError ? e.message : 'Invalid expression');
  }
}

let initialized = false;

export function initCalculusMode(): void {
  if (initialized) return;
  initialized = true;

  document.getElementById('calcDiffCompute')!.addEventListener('click', handleDifferentiate);
  document.getElementById('calcIntCompute')!.addEventListener('click', handleIntegrate);
  document.getElementById('calcSeriesCompute')!.addEventListener('click', handleSeries);
  document.getElementById('calcFactorCompute')!.addEventListener('click', handleFactor);

  handleDifferentiate();
  handleIntegrate();
  handleSeries();
  handleFactor();
}
