import { linearRegression, mean, median, mode, quartiles, stdev, variance } from '../../core/stats';
import { CalcError } from '../../core/parser';

function parseNumberList(raw: string): number[] {
  const values = raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter((s) => s !== '')
    .map(Number);
  if (values.some((v) => Number.isNaN(v))) {
    throw new CalcError('invalid-input', 'Only numbers, separated by commas, spaces, or new lines, please');
  }
  return values;
}

function round(value: number): number {
  return Number(value.toPrecision(10));
}

function computeStats(): void {
  const dataEl = document.getElementById('statsData') as HTMLTextAreaElement;
  const errorEl = document.getElementById('statsError') as HTMLParagraphElement;
  const resultEl = document.getElementById('statsResult') as HTMLDListElement;

  errorEl.textContent = '';
  resultEl.innerHTML = '';

  try {
    const data = parseNumberList(dataEl.value);
    const q = quartiles(data);
    const modes = mode(data);

    const entries: Array<[string, string]> = [
      ['Count', String(data.length)],
      ['Mean', String(round(mean(data)))],
      ['Median', String(round(median(data)))],
      ['Mode', modes.length === 0 ? 'none' : modes.map(round).join(', ')],
      ['Population variance', String(round(variance(data, 'population')))],
      ['Population std. dev.', String(round(stdev(data, 'population')))],
      ['Sample variance', data.length > 1 ? String(round(variance(data, 'sample'))) : 'n/a (need 2+ values)'],
      ['Sample std. dev.', data.length > 1 ? String(round(stdev(data, 'sample'))) : 'n/a (need 2+ values)'],
      ['Q1 / Q2 / Q3', `${round(q.q1)} / ${round(q.q2)} / ${round(q.q3)}`],
      ['Min / Max', `${round(Math.min(...data))} / ${round(Math.max(...data))}`],
    ];

    for (const [label, value] of entries) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      resultEl.append(dt, dd);
    }
  } catch (e) {
    errorEl.textContent = e instanceof CalcError ? e.message : 'Invalid data';
  }
}

function computeRegression(): void {
  const dataEl = document.getElementById('regressionData') as HTMLTextAreaElement;
  const errorEl = document.getElementById('regressionError') as HTMLParagraphElement;
  const resultEl = document.getElementById('regressionResult') as HTMLParagraphElement;

  errorEl.textContent = '';
  resultEl.textContent = '';

  try {
    const points: Array<[number, number]> = dataEl.value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
      .map((line) => {
        const parts = line.split(',').map((s) => Number(s.trim()));
        if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) {
          throw new CalcError('invalid-input', 'Each line must be "x,y"');
        }
        return [parts[0], parts[1]] as [number, number];
      });

    const { slope, intercept, r } = linearRegression(points);
    const sign = intercept < 0 ? '-' : '+';
    resultEl.textContent = `y = ${round(slope)}x ${sign} ${round(Math.abs(intercept))}   (r = ${round(r)})`;
  } catch (e) {
    errorEl.textContent = e instanceof CalcError ? e.message : 'Invalid data';
  }
}

let initialized = false;

export function initStatsMode(): void {
  if (initialized) return;
  initialized = true;

  document.getElementById('statsCompute')!.addEventListener('click', computeStats);
  document.getElementById('regressionCompute')!.addEventListener('click', computeRegression);

  computeStats();
  computeRegression();
}
