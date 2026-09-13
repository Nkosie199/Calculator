import { add, determinant, inverse, multiply, subtract, transpose, type Matrix } from '../../core/matrix';
import { CalcError } from '../../core/parser';

const MAX_SIZE = 6;

interface Editor {
  grid: HTMLDivElement;
  rowsInput: HTMLInputElement;
  colsInput: HTMLInputElement;
}

let editorA: Editor;
let editorB: Editor;
let resultEl: HTMLDivElement;
let errorEl: HTMLParagraphElement;

function clampSize(input: HTMLInputElement): number {
  const value = Math.max(1, Math.min(MAX_SIZE, Math.round(Number(input.value)) || 1));
  input.value = String(value);
  return value;
}

function renderEditorGrid(editor: Editor): void {
  const rows = clampSize(editor.rowsInput);
  const cols = clampSize(editor.colsInput);
  editor.grid.innerHTML = '';
  editor.grid.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.value = i === j ? '1' : '0';
      input.setAttribute('aria-label', `Row ${i + 1}, column ${j + 1}`);
      editor.grid.appendChild(input);
    }
  }
}

function readMatrix(editor: Editor): Matrix {
  const rows = clampSize(editor.rowsInput);
  const cols = clampSize(editor.colsInput);
  const inputs = editor.grid.querySelectorAll<HTMLInputElement>('input');
  const values = Array.from(inputs).map((input) => Number(input.value));
  const matrix: Matrix = [];
  for (let i = 0; i < rows; i++) {
    matrix.push(values.slice(i * cols, (i + 1) * cols));
  }
  return matrix;
}

function renderResult(value: Matrix | number): void {
  errorEl.textContent = '';
  resultEl.innerHTML = '';

  if (typeof value === 'number') {
    resultEl.style.gridTemplateColumns = 'auto';
    const cell = document.createElement('div');
    cell.textContent = Number(value.toPrecision(10)).toString();
    resultEl.appendChild(cell);
    return;
  }

  const cols = value[0]?.length ?? 0;
  resultEl.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  for (const row of value) {
    for (const cell of row) {
      const div = document.createElement('div');
      div.textContent = Number(cell.toPrecision(8)).toString();
      resultEl.appendChild(div);
    }
  }
}

function handleOp(op: string): void {
  try {
    const a = readMatrix(editorA);
    const b = readMatrix(editorB);
    switch (op) {
      case 'add':
        return renderResult(add(a, b));
      case 'subtract':
        return renderResult(subtract(a, b));
      case 'multiply':
        return renderResult(multiply(a, b));
      case 'transposeA':
        return renderResult(transpose(a));
      case 'transposeB':
        return renderResult(transpose(b));
      case 'detA':
        return renderResult(determinant(a));
      case 'detB':
        return renderResult(determinant(b));
      case 'invA':
        return renderResult(inverse(a));
      case 'invB':
        return renderResult(inverse(b));
    }
  } catch (e) {
    resultEl.innerHTML = '';
    errorEl.textContent = e instanceof CalcError ? e.message : 'Invalid matrix operation';
  }
}

let initialized = false;

export function initMatrixMode(): void {
  if (initialized) return;
  initialized = true;

  editorA = {
    grid: document.getElementById('matrixAGrid') as HTMLDivElement,
    rowsInput: document.getElementById('matrixARows') as HTMLInputElement,
    colsInput: document.getElementById('matrixACols') as HTMLInputElement,
  };
  editorB = {
    grid: document.getElementById('matrixBGrid') as HTMLDivElement,
    rowsInput: document.getElementById('matrixBRows') as HTMLInputElement,
    colsInput: document.getElementById('matrixBCols') as HTMLInputElement,
  };
  resultEl = document.getElementById('matrixResult') as HTMLDivElement;
  errorEl = document.getElementById('matrixError') as HTMLParagraphElement;

  for (const editor of [editorA, editorB]) {
    editor.rowsInput.addEventListener('change', () => renderEditorGrid(editor));
    editor.colsInput.addEventListener('change', () => renderEditorGrid(editor));
  }

  document.querySelectorAll<HTMLButtonElement>('[data-matrix-op]').forEach((button) => {
    button.addEventListener('click', () => handleOp(button.dataset.matrixOp!));
  });

  renderEditorGrid(editorA);
  renderEditorGrid(editorB);
}
