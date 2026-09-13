import {
  bitwiseAnd,
  bitwiseNot,
  bitwiseOr,
  bitwiseXor,
  formatInBase,
  parseInBase,
  shiftLeft,
  shiftRightArithmetic,
  shiftRightLogical,
  type BaseN,
} from '../../core/basen';
import { CalcError } from '../../core/parser';

const BASES: Array<{ base: BaseN; label: string }> = [
  { base: 2, label: 'Binary' },
  { base: 8, label: 'Octal' },
  { base: 10, label: 'Decimal' },
  { base: 16, label: 'Hexadecimal' },
];

function renderResultList(el: HTMLDListElement, value: number): void {
  el.innerHTML = '';
  for (const { base, label } of BASES) {
    const dt = document.createElement('dt');
    dt.textContent = label;
    const dd = document.createElement('dd');
    dd.textContent = formatInBase(value, base);
    el.append(dt, dd);
  }
}

function handleConvert(): void {
  const base = Number((document.getElementById('basenInputBase') as HTMLSelectElement).value) as BaseN;
  const value = (document.getElementById('basenInput') as HTMLInputElement).value;
  const errorEl = document.getElementById('basenError') as HTMLParagraphElement;
  const resultEl = document.getElementById('basenResult') as HTMLDListElement;

  errorEl.textContent = '';
  try {
    renderResultList(resultEl, parseInBase(value, base));
  } catch (e) {
    resultEl.innerHTML = '';
    errorEl.textContent = e instanceof CalcError ? e.message : 'Invalid number';
  }
}

function handleBitwise(): void {
  const base = Number((document.getElementById('basenInputBase') as HTMLSelectElement).value) as BaseN;
  const aRaw = (document.getElementById('basenBitwiseA') as HTMLInputElement).value;
  const bRaw = (document.getElementById('basenBitwiseB') as HTMLInputElement).value;
  const op = (document.getElementById('basenBitwiseOp') as HTMLSelectElement).value;
  const errorEl = document.getElementById('basenBitwiseError') as HTMLParagraphElement;
  const resultEl = document.getElementById('basenBitwiseResult') as HTMLDListElement;

  errorEl.textContent = '';
  try {
    const a = parseInBase(aRaw, base);
    const b = op === 'not' ? 0 : parseInBase(bRaw, base);
    let result: number;
    switch (op) {
      case 'and':
        result = bitwiseAnd(a, b);
        break;
      case 'or':
        result = bitwiseOr(a, b);
        break;
      case 'xor':
        result = bitwiseXor(a, b);
        break;
      case 'not':
        result = bitwiseNot(a);
        break;
      case 'shl':
        result = shiftLeft(a, b);
        break;
      case 'shr':
        result = shiftRightArithmetic(a, b);
        break;
      case 'shru':
        result = shiftRightLogical(a, b);
        break;
      default:
        return;
    }
    renderResultList(resultEl, result);
  } catch (e) {
    resultEl.innerHTML = '';
    errorEl.textContent = e instanceof CalcError ? e.message : 'Invalid number';
  }
}

let initialized = false;

export function initBaseNMode(): void {
  if (initialized) return;
  initialized = true;

  document.getElementById('basenInputBase')!.addEventListener('change', handleConvert);
  document.getElementById('basenInput')!.addEventListener('input', handleConvert);
  document.getElementById('basenBitwiseCompute')!.addEventListener('click', handleBitwise);

  handleConvert();
}
