import { CalcError } from './parser/errors';

export type BaseN = 2 | 8 | 10 | 16;

const DIGITS_FOR_BASE: Record<BaseN, string> = {
  2: '01',
  8: '01234567',
  10: '0123456789',
  16: '0123456789abcdefABCDEF',
};

/** Parses an integer string in the given base. Strict: rejects any character not valid in that base. */
export function parseInBase(input: string, base: BaseN): number {
  const trimmed = input.trim();
  const body = trimmed.startsWith('-') ? trimmed.slice(1) : trimmed;
  if (body === '' || [...body].some((ch) => !DIGITS_FOR_BASE[base].includes(ch))) {
    throw new CalcError('invalid-input', `"${input}" is not a valid base-${base} number`);
  }
  const value = parseInt(trimmed, base);
  if (!Number.isSafeInteger(value)) {
    throw new CalcError('invalid-input', 'That number is too large to represent exactly');
  }
  return value;
}

/** Formats an integer in the given base (uses a leading "-" for negatives, not two's-complement bits). */
export function formatInBase(value: number, base: BaseN): string {
  assertInteger(value);
  return value.toString(base).toUpperCase();
}

function assertInteger(value: number): void {
  if (!Number.isInteger(value)) {
    throw new CalcError('invalid-input', 'Bitwise operations require whole numbers');
  }
}

/** These operate on the standard JS 32-bit signed integer representation (via ToInt32). */
export function bitwiseAnd(a: number, b: number): number {
  assertInteger(a);
  assertInteger(b);
  return (a | 0) & (b | 0);
}

export function bitwiseOr(a: number, b: number): number {
  assertInteger(a);
  assertInteger(b);
  return (a | 0) | (b | 0);
}

export function bitwiseXor(a: number, b: number): number {
  assertInteger(a);
  assertInteger(b);
  return (a | 0) ^ (b | 0);
}

export function bitwiseNot(a: number): number {
  assertInteger(a);
  return ~(a | 0);
}

export function shiftLeft(a: number, bits: number): number {
  assertInteger(a);
  assertInteger(bits);
  return (a | 0) << (bits | 0);
}

export function shiftRightArithmetic(a: number, bits: number): number {
  assertInteger(a);
  assertInteger(bits);
  return (a | 0) >> (bits | 0);
}

export function shiftRightLogical(a: number, bits: number): number {
  assertInteger(a);
  assertInteger(bits);
  return (a | 0) >>> (bits | 0);
}
