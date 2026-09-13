import { askQuestion, initAskBar } from './ui/ask';
import { CalculatorState } from './ui/calculator';
import { loadHistory, type HistoryEntry } from './ui/history';
import { getCurrentMode, initModeSwitcher, switchToMode } from './ui/modes';
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
    // A real <button>, not a div+role="button", so Enter/Space activate it for free — no
    // hand-rolled keydown handler needed to match native button keyboard semantics.
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'history-entry';

    const expr = document.createElement('div');
    expr.className = 'history-expr';
    expr.textContent = formatExpressionForDisplay(entry.expression) + ' =';

    const result = document.createElement('div');
    result.className = 'history-result';
    result.textContent = entry.result;

    row.append(expr, result);
    row.addEventListener('click', () => {
      closeHistory();
      if (entry.source === 'ask') {
        askQuestion(entry.expression);
      } else {
        state.recallHistoryEntry(entry);
        switchToMode('standard');
        render();
      }
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

function getFocusableInOverlay(): HTMLElement[] {
  return Array.from(historyOverlay.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')).filter(
    (el) => !el.hasAttribute('disabled'),
  );
}

function trapFocusInOverlay(event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  const focusable = getFocusableInOverlay();
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openHistory(): void {
  // Always re-read from storage rather than the CalculatorState's cached copy — the Ask bar
  // (and potentially other modes) write history entries directly, so the cache can be stale.
  renderHistory(loadHistory());
  historyOverlay.hidden = false;
  historyToggle.setAttribute('aria-expanded', 'true');
  historyOverlay.addEventListener('keydown', trapFocusInOverlay);
  closeHistoryButton.focus();
}

function closeHistory(): void {
  if (historyOverlay.hidden) return;
  historyOverlay.hidden = true;
  historyToggle.setAttribute('aria-expanded', 'false');
  historyOverlay.removeEventListener('keydown', trapFocusInOverlay);
  historyToggle.focus();
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
