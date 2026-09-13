import { add, argument, complex, divide, formatComplex, modulus, multiply, subtract } from '../../core/complex';

function num(id: string): number {
  return Number((document.getElementById(id) as HTMLInputElement).value);
}

function setText(id: string, value: string): void {
  (document.getElementById(id) as HTMLElement).textContent = value;
}

function compute(): void {
  const a = complex(num('complexARe'), num('complexAIm'));
  const b = complex(num('complexBRe'), num('complexBIm'));
  const op = (document.getElementById('complexOp') as HTMLSelectElement).value;
  const errorEl = document.getElementById('complexError') as HTMLParagraphElement;
  errorEl.textContent = '';

  try {
    let result;
    switch (op) {
      case 'add':
        result = add(a, b);
        break;
      case 'subtract':
        result = subtract(a, b);
        break;
      case 'multiply':
        result = multiply(a, b);
        break;
      case 'divide':
        result = divide(a, b);
        break;
      default:
        return;
    }
    setText('complexResult', formatComplex(result));
  } catch (e) {
    setText('complexResult', '');
    errorEl.textContent = e instanceof Error ? e.message : 'Invalid operation';
  }

  const r = modulus(a);
  const theta = argument(a);
  setText(
    'complexPolar',
    `r = ${Number(r.toPrecision(8))}, θ = ${Number(theta.toPrecision(8))} rad (${Number(((theta * 180) / Math.PI).toPrecision(6))}°)`,
  );
}

let initialized = false;

export function initComplexMode(): void {
  if (initialized) return;
  initialized = true;

  document.getElementById('complexCompute')!.addEventListener('click', compute);
  compute();
}
