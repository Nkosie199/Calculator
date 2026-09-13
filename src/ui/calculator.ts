import { CalcError, calculate, type AngleMode } from '../core/parser';
import { getAngleMode, setAngleMode } from './angleMode';
import { addHistoryEntry, clearHistory, loadHistory, type HistoryEntry } from './history';

const MEMORY_KEY = 'calc:memory';

const CONTINUATION_TOKENS = new Set(['+', '-', '*', '/', '^', '%', '!']);
const MAX_EXPRESSION_LENGTH = 200;

function loadMemory(): number {
  const raw = localStorage.getItem(MEMORY_KEY);
  const value = raw === null ? 0 : Number(raw);
  return Number.isFinite(value) ? value : 0;
}

/** Formats a finite number the way a calculator display should: no exponent noise for everyday values. */
export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return value > 0 ? 'Infinity' : '-Infinity';
  if (Object.is(value, -0)) return '0';
  // Avoid floating-point crumbs like 0.1 + 0.2 = 0.30000000000000004.
  const rounded = Number(value.toPrecision(12));
  return rounded.toString();
}

export interface CalculatorSnapshot {
  expression: string;
  errorMessage: string | null;
  angleMode: AngleMode;
  memory: number;
  history: HistoryEntry[];
}

/** Owns all calculator state: the in-progress expression, memory register, angle mode, and history. */
export class CalculatorState {
  private expression = '';
  private errorMessage: string | null = null;
  private justEvaluated = false;
  private angleMode: AngleMode = getAngleMode();
  private memory = loadMemory();
  private history: HistoryEntry[] = loadHistory();

  getSnapshot(): CalculatorSnapshot {
    return {
      expression: this.expression,
      errorMessage: this.errorMessage,
      angleMode: this.angleMode,
      memory: this.memory,
      history: this.history,
    };
  }

  private startFreshIfNeeded(token: string): void {
    if (!this.justEvaluated) return;
    this.justEvaluated = false;
    if (!CONTINUATION_TOKENS.has(token)) {
      this.expression = '';
    }
  }

  input(token: string): void {
    this.errorMessage = null;
    this.startFreshIfNeeded(token);
    if (this.expression.length >= MAX_EXPRESSION_LENGTH) return;
    this.expression += token;
  }

  inputFunction(name: string): void {
    this.errorMessage = null;
    this.startFreshIfNeeded(name);
    if (this.expression.length >= MAX_EXPRESSION_LENGTH) return;
    this.expression += `${name}(`;
  }

  backspace(): void {
    this.errorMessage = null;
    this.justEvaluated = false;
    this.expression = this.expression.slice(0, -1);
  }

  clear(): void {
    this.expression = '';
    this.errorMessage = null;
    this.justEvaluated = false;
  }

  toggleAngleMode(): void {
    this.angleMode = this.angleMode === 'deg' ? 'rad' : 'deg';
    setAngleMode(this.angleMode);
  }

  memoryAdd(): void {
    const value = this.tryEvaluateCurrent();
    if (value === null) return;
    this.memory += value;
    this.persistMemory();
  }

  memorySubtract(): void {
    const value = this.tryEvaluateCurrent();
    if (value === null) return;
    this.memory -= value;
    this.persistMemory();
  }

  memoryRecall(): void {
    this.input(formatResult(this.memory));
  }

  memoryClear(): void {
    this.memory = 0;
    this.persistMemory();
  }

  private persistMemory(): void {
    try {
      localStorage.setItem(MEMORY_KEY, String(this.memory));
    } catch {
      // ignore — memory just won't persist
    }
  }

  private tryEvaluateCurrent(): number | null {
    if (this.expression.trim() === '') return null;
    try {
      return calculate(this.expression, this.angleMode);
    } catch {
      return null;
    }
  }

  clearHistory(): void {
    this.history = clearHistory();
  }

  recallHistoryEntry(entry: HistoryEntry): void {
    this.errorMessage = null;
    this.justEvaluated = false;
    this.expression = entry.result;
  }

  /** Evaluates the current expression. Returns true on success. On failure, sets a typed error message. */
  evaluate(): boolean {
    if (this.expression.trim() === '') return false;
    try {
      const result = calculate(this.expression, this.angleMode);
      const formatted = formatResult(result);
      this.history = addHistoryEntry(this.expression, formatted);
      this.expression = formatted;
      this.errorMessage = null;
      this.justEvaluated = true;
      return true;
    } catch (e) {
      this.errorMessage = e instanceof CalcError ? e.message : 'Something went wrong';
      return false;
    }
  }
}
