import { CalcError, compileFunctionOfX } from '../../core/parser';
import { findRoots } from '../../core/equations';
import { getAngleMode } from '../angleMode';

const COLORS = ['#6236ff', '#ff6b6b', '#2fbf71', '#ffa62b', '#00b8d9', '#d946ef'];

interface FunctionRow {
  id: number;
  expr: string;
  color: string;
}

let nextId = 1;
let rows: FunctionRow[] = [{ id: nextId++, expr: 'sin(x)', color: COLORS[0] }];

let functionsContainer: HTMLDivElement;
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let readout: HTMLParagraphElement;
let errorEl: HTMLParagraphElement;
let rootsEl: HTMLParagraphElement;
let xMinInput: HTMLInputElement;
let xMaxInput: HTMLInputElement;
let yMinInput: HTMLInputElement;
let yMaxInput: HTMLInputElement;

function getRange() {
  const xMin = Number(xMinInput.value);
  const xMax = Number(xMaxInput.value);
  const yMin = Number(yMinInput.value);
  const yMax = Number(yMaxInput.value);
  return { xMin, xMax, yMin, yMax };
}

function dataToPixel(x: number, y: number, range: ReturnType<typeof getRange>, width: number, height: number) {
  const px = ((x - range.xMin) / (range.xMax - range.xMin)) * width;
  const py = height - ((y - range.yMin) / (range.yMax - range.yMin)) * height;
  return [px, py] as const;
}

function pixelToData(px: number, range: ReturnType<typeof getRange>, width: number): number {
  return range.xMin + (px / width) * (range.xMax - range.xMin);
}

function renderFunctionRows(): void {
  functionsContainer.innerHTML = '';
  rows.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'graph-function-row';

    const swatch = document.createElement('span');
    swatch.className = 'graph-color-swatch';
    swatch.style.background = row.color;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = row.expr;
    input.setAttribute('aria-label', 'Function of x');
    input.addEventListener('input', () => {
      row.expr = input.value;
      plot();
    });

    rowEl.append(swatch, input);

    if (rows.length > 1) {
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.textContent = '×';
      removeBtn.setAttribute('aria-label', 'Remove this function');
      removeBtn.addEventListener('click', () => {
        rows = rows.filter((r) => r.id !== row.id);
        renderFunctionRows();
        plot();
      });
      rowEl.appendChild(removeBtn);
    }

    functionsContainer.appendChild(rowEl);
  });
}

function addFunctionRow(): void {
  if (rows.length >= COLORS.length) return;
  rows.push({ id: nextId++, expr: '', color: COLORS[rows.length % COLORS.length] });
  renderFunctionRows();
}

function drawAxes(range: ReturnType<typeof getRange>, width: number, height: number): void {
  ctx.strokeStyle = 'rgba(128,128,128,0.4)';
  ctx.lineWidth = 1;

  if (range.yMin < 0 && range.yMax > 0) {
    const [, py] = dataToPixel(0, 0, range, width, height);
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(width, py);
    ctx.stroke();
  }
  if (range.xMin < 0 && range.xMax > 0) {
    const [px] = dataToPixel(0, 0, range, width, height);
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, height);
    ctx.stroke();
  }
}

function plot(): void {
  const width = canvas.width;
  const height = canvas.height;
  const range = getRange();
  errorEl.textContent = '';

  ctx.clearRect(0, 0, width, height);
  if (!(range.xMax > range.xMin) || !(range.yMax > range.yMin)) {
    errorEl.textContent = 'Min must be less than max for both axes';
    return;
  }
  drawAxes(range, width, height);

  const angleMode = getAngleMode();
  const messages: string[] = [];

  for (const row of rows) {
    if (row.expr.trim() === '') continue;
    try {
      const f = compileFunctionOfX(row.expr, angleMode);
      ctx.strokeStyle = row.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let penDown = false;
      for (let px = 0; px <= width; px++) {
        const x = pixelToData(px, range, width);
        let y: number;
        try {
          y = f(x);
        } catch {
          penDown = false;
          continue;
        }
        if (!Number.isFinite(y)) {
          penDown = false;
          continue;
        }
        const [, py] = dataToPixel(x, y, range, width, height);
        if (!penDown) {
          ctx.moveTo(px, py);
          penDown = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    } catch (e) {
      messages.push(e instanceof CalcError ? `"${row.expr}": ${e.message}` : `"${row.expr}": invalid expression`);
    }
  }

  errorEl.textContent = messages.join(' • ');
}

function handleFindRoots(): void {
  const range = getRange();
  const angleMode = getAngleMode();
  const lines: string[] = [];

  for (const row of rows) {
    if (row.expr.trim() === '') continue;
    try {
      const f = compileFunctionOfX(row.expr, angleMode);
      const roots = findRoots(f, { min: range.xMin, max: range.xMax });
      const formatted = roots.map((r) => Number(r.toPrecision(8))).join(', ');
      lines.push(`${row.expr}: ${roots.length === 0 ? 'no roots found in view' : `x = ${formatted}`}`);
    } catch (e) {
      lines.push(`${row.expr}: ${e instanceof CalcError ? e.message : 'invalid expression'}`);
    }
  }

  rootsEl.textContent = lines.join('\n');
}

function handlePointerMove(event: MouseEvent): void {
  const range = getRange();
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const px = (event.clientX - rect.left) * scaleX;
  const x = pixelToData(px, range, canvas.width);
  const angleMode = getAngleMode();

  const parts = rows
    .filter((row) => row.expr.trim() !== '')
    .map((row) => {
      try {
        const f = compileFunctionOfX(row.expr, angleMode);
        const y = f(x);
        return `${row.expr}: y = ${Number.isFinite(y) ? Number(y.toPrecision(6)) : 'undefined'}`;
      } catch {
        return `${row.expr}: undefined`;
      }
    });

  readout.textContent = `x = ${Number(x.toPrecision(6))} — ${parts.join(', ')}`;
}

let initialized = false;

export function initGraphMode(): void {
  if (initialized) return;
  initialized = true;

  functionsContainer = document.getElementById('graphFunctions') as HTMLDivElement;
  canvas = document.getElementById('graphCanvas') as HTMLCanvasElement;
  ctx = canvas.getContext('2d')!;
  readout = document.getElementById('graphReadout') as HTMLParagraphElement;
  errorEl = document.getElementById('graphError') as HTMLParagraphElement;
  rootsEl = document.getElementById('graphRoots') as HTMLParagraphElement;
  xMinInput = document.getElementById('graphXMin') as HTMLInputElement;
  xMaxInput = document.getElementById('graphXMax') as HTMLInputElement;
  yMinInput = document.getElementById('graphYMin') as HTMLInputElement;
  yMaxInput = document.getElementById('graphYMax') as HTMLInputElement;

  document.getElementById('graphAddFunction')!.addEventListener('click', () => {
    addFunctionRow();
    plot();
  });
  document.getElementById('graphFindRoots')!.addEventListener('click', handleFindRoots);

  for (const input of [xMinInput, xMaxInput, yMinInput, yMaxInput]) {
    input.addEventListener('input', plot);
  }
  canvas.addEventListener('mousemove', handlePointerMove);

  renderFunctionRows();
  plot();
}

/** Sets the first function row's expression (e.g. from the Ask bar's "plot ..." queries) and replots. */
export function setPrimaryFunction(expr: string): void {
  initGraphMode();
  rows[0].expr = expr;
  renderFunctionRows();
  plot();
}

export function refreshGraphMode(): void {
  if (initialized) plot();
}
