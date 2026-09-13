import { addDuration, dayOfWeek, daysBetween } from '../../core/dates';

function parseDateInput(id: string): Date | null {
  const value = (document.getElementById(id) as HTMLInputElement).value;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function setText(id: string, value: string): void {
  (document.getElementById(id) as HTMLElement).textContent = value;
}

function computeBetween(): void {
  const a = parseDateInput('dateBetweenA');
  const b = parseDateInput('dateBetweenB');
  if (!a || !b) {
    setText('dateBetweenResult', 'Pick both dates');
    return;
  }
  const days = daysBetween(a, b);
  setText('dateBetweenResult', `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ${days >= 0 ? 'after' : 'before'} the first date`);
}

function computeAdd(): void {
  const base = parseDateInput('dateAddBase');
  if (!base) {
    setText('dateAddResult', 'Pick a start date');
    return;
  }
  const years = Number((document.getElementById('dateAddYears') as HTMLInputElement).value) || 0;
  const months = Number((document.getElementById('dateAddMonths') as HTMLInputElement).value) || 0;
  const weeks = Number((document.getElementById('dateAddWeeks') as HTMLInputElement).value) || 0;
  const days = Number((document.getElementById('dateAddDays') as HTMLInputElement).value) || 0;

  const result = addDuration(base, { years, months, weeks, days });
  const iso = result.toISOString().slice(0, 10);
  setText('dateAddResult', `${iso} (${dayOfWeek(result)})`);
}

let initialized = false;

export function initDateMode(): void {
  if (initialized) return;
  initialized = true;

  const todayIso = new Date().toISOString().slice(0, 10);
  (document.getElementById('dateBetweenA') as HTMLInputElement).value = todayIso;
  (document.getElementById('dateBetweenB') as HTMLInputElement).value = todayIso;
  (document.getElementById('dateAddBase') as HTMLInputElement).value = todayIso;

  document.getElementById('dateBetweenA')!.addEventListener('input', computeBetween);
  document.getElementById('dateBetweenB')!.addEventListener('input', computeBetween);
  document.getElementById('dateAddCompute')!.addEventListener('click', computeAdd);

  computeBetween();
  computeAdd();
}
