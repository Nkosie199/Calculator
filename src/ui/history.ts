const STORAGE_KEY = 'calc:history';
const MAX_ENTRIES = 200;

export interface HistoryEntry {
  expression: string;
  result: string;
  timestamp: number;
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

export function addHistoryEntry(entries: HistoryEntry[], expression: string, result: string): HistoryEntry[] {
  const next = [{ expression, result, timestamp: Date.now() }, ...entries].slice(0, MAX_ENTRIES);
  persist(next);
  return next;
}

export function clearHistory(): HistoryEntry[] {
  persist([]);
  return [];
}
