import { formatComplex } from '../../core/complex';
import { findRoots, solveLinear, solveQuadratic } from '../../core/equations';
import { solveLinearSystem } from '../../core/matrix';
import { CalcError, compileFunctionOfX } from '../../core/parser';
import { getAngleMode } from '../angleMode';

function num(id: string): number {
  return Number((document.getElementById(id) as HTMLInputElement).value);
}

function text(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value;
}

function setText(id: string, value: string): void {
  (document.getElementById(id) as HTMLElement).textContent = value;
}

function handleLinear(): void {
  try {
    const x = solveLinear(num('eqLinearA'), num('eqLinearB'));
    setText('eqLinearResult', `x = ${Number(x.toPrecision(10))}`);
  } catch (e) {
    setText('eqLinearResult', e instanceof CalcError ? e.message : 'Invalid input');
  }
}

function handleQuadratic(): void {
  try {
    const { root1, root2, discriminant } = solveQuadratic(num('eqQuadA'), num('eqQuadB'), num('eqQuadC'));
    const kind = discriminant > 0 ? 'two real roots' : discriminant === 0 ? 'one repeated real root' : 'two complex roots';
    setText('eqQuadResult', `${kind}: x₁ = ${formatComplex(root1)}, x₂ = ${formatComplex(root2)}`);
  } catch (e) {
    setText('eqQuadResult', e instanceof CalcError ? e.message : 'Invalid input');
  }
}

function handleRootFinder(): void {
  try {
    const f = compileFunctionOfX(text('eqRootFn'), getAngleMode());
    const roots = findRoots(f, { min: num('eqRootMin'), max: num('eqRootMax') });
    setText(
      'eqRootResult',
      roots.length === 0 ? 'No roots found in that range' : `x = ${roots.map((r) => Number(r.toPrecision(10))).join(', ')}`,
    );
  } catch (e) {
    setText('eqRootResult', e instanceof CalcError ? e.message : 'Invalid expression');
  }
}

let systemGrid: HTMLDivElement;
let systemSizeSelect: HTMLSelectElement;

function renderSystemGrid(): void {
  const n = Number(systemSizeSelect.value);
  systemGrid.innerHTML = '';
  systemGrid.style.gridTemplateColumns = `repeat(${n + 1}, auto)`;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const input = document.createElement('input');
      input.type = 'number';
      input.step = 'any';
      input.value = i === j ? '1' : '0';
      input.dataset.role = 'coef';
      input.dataset.row = String(i);
      input.dataset.col = String(j);
      systemGrid.appendChild(input);
    }
    const bInput = document.createElement('input');
    bInput.type = 'number';
    bInput.step = 'any';
    bInput.value = '0';
    bInput.dataset.role = 'const';
    bInput.dataset.row = String(i);
    bInput.style.borderLeft = '2px solid var(--accent)';
    systemGrid.appendChild(bInput);
  }
}

function handleSystemSolve(): void {
  const n = Number(systemSizeSelect.value);
  const coefInputs = systemGrid.querySelectorAll<HTMLInputElement>('[data-role="coef"]');
  const constInputs = systemGrid.querySelectorAll<HTMLInputElement>('[data-role="const"]');

  const a: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  coefInputs.forEach((input) => {
    const row = Number(input.dataset.row);
    const col = Number(input.dataset.col);
    a[row][col] = Number(input.value);
  });
  const b = Array.from(constInputs).map((input) => Number(input.value));

  try {
    const solution = solveLinearSystem(a, b);
    const varNames = ['x', 'y', 'z'];
    setText(
      'eqSystemResult',
      solution.map((v, i) => `${varNames[i]} = ${Number(v.toPrecision(10))}`).join(', '),
    );
  } catch (e) {
    setText('eqSystemResult', e instanceof CalcError ? e.message : 'No unique solution');
  }
}

let initialized = false;

export function initEquationsMode(): void {
  if (initialized) return;
  initialized = true;

  document.getElementById('eqLinearSolve')!.addEventListener('click', handleLinear);
  document.getElementById('eqQuadSolve')!.addEventListener('click', handleQuadratic);
  document.getElementById('eqRootSolve')!.addEventListener('click', handleRootFinder);

  systemGrid = document.getElementById('eqSystemGrid') as HTMLDivElement;
  systemSizeSelect = document.getElementById('eqSystemSize') as HTMLSelectElement;
  systemSizeSelect.addEventListener('change', renderSystemGrid);
  document.getElementById('eqSystemSolve')!.addEventListener('click', handleSystemSolve);

  renderSystemGrid();
  handleLinear();
  handleQuadratic();
}
