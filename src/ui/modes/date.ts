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

/**
 * "September 13, 2026" instead of the raw "2026-09-13" the <input type="date"> gives us.
 * timeZone: 'UTC' matters here — our dates are stored as UTC midnight (see core/dates.ts), and
 * without pinning the timezone, toLocaleDateString would render in the visitor's local time and
 * could show the wrong day (e.g. one day earlier for anyone west of UTC).
 */
function formatFriendly(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function computeBetween(): void {
  const a = parseDateInput('dateBetweenA');
  const b = parseDateInput('dateBetweenB');
  if (!a || !b) {
    setText('dateBetweenResult', 'Pick both dates above to see the gap between them.');
    return;
  }
  const days = daysBetween(a, b);
  if (days === 0) {
    setText('dateBetweenResult', "That's the same day! 0 days apart.");
    return;
  }
  const [earlier, later] = days > 0 ? [a, b] : [b, a];
  setText(
    'dateBetweenResult',
    `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} — from ${formatFriendly(earlier)} to ${formatFriendly(later)}.`,
  );
}

function computeAdd(): void {
  const base = parseDateInput('dateAddBase');
  if (!base) {
    setText('dateAddResult', 'Pick a start date above first.');
    return;
  }
  const years = Number((document.getElementById('dateAddYears') as HTMLInputElement).value) || 0;
  const months = Number((document.getElementById('dateAddMonths') as HTMLInputElement).value) || 0;
  const weeks = Number((document.getElementById('dateAddWeeks') as HTMLInputElement).value) || 0;
  const days = Number((document.getElementById('dateAddDays') as HTMLInputElement).value) || 0;

  const result = addDuration(base, { years, months, weeks, days });
  setText('dateAddResult', `${dayOfWeek(result)}, ${formatFriendly(result)}`);
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
