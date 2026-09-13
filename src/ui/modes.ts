import { initBaseNMode } from './modes/basen';
import { initCalculusMode } from './modes/calculus';
import { initComplexMode } from './modes/complex';
import { initDateMode } from './modes/date';
import { initEquationsMode } from './modes/equations';
import { initGraphMode } from './modes/graph';
import { initMatrixMode } from './modes/matrix';
import { initStatsMode } from './modes/stats';
import { initUnitsMode } from './modes/units';

const WIDE_MODES = new Set(['graph', 'matrix', 'equations', 'stats', 'calculus']);

const initializers: Record<string, () => void> = {
  graph: initGraphMode,
  equations: initEquationsMode,
  calculus: initCalculusMode,
  matrix: initMatrixMode,
  stats: initStatsMode,
  complex: initComplexMode,
  basen: initBaseNMode,
  units: initUnitsMode,
  date: initDateMode,
};

let currentMode = 'standard';
let activateFn: ((mode: string) => void) | null = null;

/** Which mode tab is active. The global keyboard shortcuts (digits, Enter, Backspace, ...) only apply in 'standard'. */
export function getCurrentMode(): string {
  return currentMode;
}

/** Switches to `mode` programmatically (e.g. the Ask bar routing "plot sin(x)" to the Graph tab). */
export function switchToMode(mode: string): void {
  activateFn?.(mode);
}

export function initModeSwitcher(): void {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.mode-tab');
  const panels = document.querySelectorAll<HTMLElement>('.mode-panel');
  const app = document.getElementById('app') as HTMLDivElement;

  function activate(mode: string): void {
    currentMode = mode;
    tabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.mode === mode)));
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.mode !== mode;
    });
    app.classList.toggle('wide', WIDE_MODES.has(mode));
    initializers[mode]?.();
  }

  activateFn = activate;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab.dataset.mode!));
  });

  activate('standard');
}
