import { initAskBar } from './ui/ask';
import { CalculatorState } from './ui/calculator';
import type { HistoryEntry } from './ui/history';
import { getCurrentMode, initModeSwitcher } from './ui/modes';
import { initTheme, toggleTheme, type Theme } from './ui/theme';
import { initWelcomeBanner } from './ui/welcome';

initModeSwitcher();
initAskBar();
initWelcomeBanner();

const state = new CalculatorState();
let theme: Theme = initTheme();

const display = document.getElementById('display') as HTMLInputElement;
const errorMessage = document.getElementById('errorMessage') as HTMLParagraphElement;
const angleModeToggle = document.getElementById('angleModeToggle') as HTMLButtonElement;
const themeToggle = document.getElementById('themeToggle') as HTMLButtonElement;
const historyToggle = document.getElementById('historyToggle') as HTMLButtonElement;
const historyOverlay = document.getElementById('historyOverlay') as HTMLDivElement;
const historyContent = document.getElementById('historyContent') as HTMLDivElement;
const closeHistoryButton = document.getElementById('closeHistoryButton') as HTMLButtonElement;
const clearHistoryButton = document.getElementById('clearHistoryButton') as HTMLButtonElement;
const keypad = document.querySelector('.keypad') as HTMLDivElement;

function formatExpressionForDisplay(expr: string): string {
  return expr.replace(/\*/g, '×').replace(/\//g, '÷');
}

function renderHistory(entries: HistoryEntry[]): void {
  if (entries.length === 0) {
    historyContent.innerHTML = '<p class="history-empty">Nothing here yet — go give something a try!</p>';
    return;
  }
  historyContent.innerHTML = '';
  for (const entry of entries) {
    const row = document.createElement('div');
    row.className = 'history-entry';
    row.tabIndex = 0;
    row.setAttribute('role', 'button');

    const expr = document.createElement('div');
    expr.className = 'history-expr';
    expr.textContent = formatExpressionForDisplay(entry.expression) + ' =';

    const result = document.createElement('div');
    result.className = 'history-result';
    result.textContent = entry.result;

    row.append(expr, result);
    row.addEventListener('click', () => {
      state.recallHistoryEntry(entry);
      closeHistory();
      render();
    });
    historyContent.appendChild(row);
  }
}

function render(): void {
  const snapshot = state.getSnapshot();
  const displayValue = snapshot.expression === '' ? '0' : snapshot.expression;
  display.value = formatExpressionForDisplay(displayValue);
  errorMessage.textContent = snapshot.errorMessage ?? '';
  angleModeToggle.textContent = snapshot.angleMode.toUpperCase();
  angleModeToggle.setAttribute(
    'aria-label',
    `Angle unit: ${snapshot.angleMode === 'deg' ? 'degrees' : 'radians'}. Activate to switch.`,
  );
}

function openHistory(): void {
  renderHistory(state.getSnapshot().history);
  historyOverlay.hidden = false;
  historyToggle.setAttribute('aria-expanded', 'true');
}

function closeHistory(): void {
  historyOverlay.hidden = true;
  historyToggle.setAttribute('aria-expanded', 'false');
}

keypad.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button) return;

  const { action, fn, token } = button.dataset;

  if (action === 'equals') {
    state.evaluate();
  } else if (action === 'clear') {
    state.clear();
  } else if (action === 'backspace') {
    state.backspace();
  } else if (action === 'mc') {
    state.memoryClear();
  } else if (action === 'mr') {
    state.memoryRecall();
  } else if (action === 'm-plus') {
    state.memoryAdd();
  } else if (action === 'm-minus') {
    state.memorySubtract();
  } else if (fn) {
    state.inputFunction(fn);
  } else if (token !== undefined) {
    state.input(token);
  }

  render();
});

angleModeToggle.addEventListener('click', () => {
  state.toggleAngleMode();
  render();
});

themeToggle.addEventListener('click', () => {
  theme = toggleTheme(theme);
});

historyToggle.addEventListener('click', () => {
  if (historyOverlay.hidden) openHistory();
  else closeHistory();
});

closeHistoryButton.addEventListener('click', closeHistory);

clearHistoryButton.addEventListener('click', () => {
  state.clearHistory();
  renderHistory([]);
});

function isEditableElement(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

document.addEventListener('keydown', (event) => {
  if (!historyOverlay.hidden && event.key === 'Escape') {
    closeHistory();
    return;
  }

  // Other modes have their own editable inputs (graph ranges, matrix cells, dates, ...) —
  // don't hijack their keystrokes with the Standard calculator's shortcuts.
  if (getCurrentMode() !== 'standard' || isEditableElement(document.activeElement)) {
    return;
  }

  const key = event.key;
  const directTokens = '0123456789.+-/*^%!()';

  if (directTokens.includes(key)) {
    event.preventDefault();
    state.input(key);
  } else if (key === 'Enter' || key === '=') {
    event.preventDefault();
    state.evaluate();
  } else if (key === 'Backspace') {
    event.preventDefault();
    state.backspace();
  } else if (key === 'Escape') {
    event.preventDefault();
    state.clear();
  } else if (key === 'x' || key === 'X') {
    event.preventDefault();
    state.input('*');
  } else {
    return;
  }

  render();
});

render();
