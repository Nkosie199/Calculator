const STORAGE_KEY = 'calc:history';
const MAX_ENTRIES = 200;

export type HistorySource = 'standard' | 'ask';

export interface HistoryEntry {
  expression: string;
  result: string;
  timestamp: number;
  /** Where this entry came from — determines how clicking it in the overlay recalls it. Missing/older entries default to 'standard'. */
  source?: HistorySource;
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is HistoryEntry =>
        typeof e === 'object' &&
        e !== null &&
        typeof (e as HistoryEntry).expression === 'string' &&
        typeof (e as HistoryEntry).result === 'string',
    );
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage unavailable — history just won't persist across reloads.
  }
}

/**
 * Appends an entry and persists it. Always re-reads from storage first (rather than trusting a
 * caller-held copy) so that two parts of the app writing history in close succession — e.g. the
 * Ask bar and the Standard keypad — can never clobber each other's entries.
 */
export function addHistoryEntry(expression: string, result: string, source: HistorySource = 'standard'): HistoryEntry[] {
  const current = loadHistory();
  const next = [{ expression, result, timestamp: Date.now(), source }, ...current].slice(0, MAX_ENTRIES);
  persist(next);
  return next;
}

export function clearHistory(): HistoryEntry[] {
  persist([]);
  return [];
}
