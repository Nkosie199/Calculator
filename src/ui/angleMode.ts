import type { AngleMode } from '../core/parser';

const ANGLE_MODE_KEY = 'calc:angleMode';

/** Shared across every mode (Standard, Graph, Equations, ...) so degree/radian stays consistent app-wide. */
export function getAngleMode(): AngleMode {
  return localStorage.getItem(ANGLE_MODE_KEY) === 'rad' ? 'rad' : 'deg';
}

export function setAngleMode(mode: AngleMode): void {
  try {
    localStorage.setItem(ANGLE_MODE_KEY, mode);
  } catch {
    // ignore — angle mode just won't persist
  }
}
