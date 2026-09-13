import { describe, expect, it } from 'vitest';
import {
  bitwiseAnd,
  bitwiseNot,
  bitwiseOr,
  bitwiseXor,
  formatInBase,
  parseInBase,
  shiftLeft,
  shiftRightArithmetic,
  shiftRightLogical,
} from '../basen';

describe('parseInBase / formatInBase', () => {
  it('round-trips decimal', () => {
    expect(parseInBase('42', 10)).toBe(42);
    expect(formatInBase(42, 10)).toBe('42');
  });
  it('parses and formats hex', () => {
    expect(parseInBase('FF', 16)).toBe(255);
    expect(formatInBase(255, 16)).toBe('FF');
  });
  it('parses and formats binary', () => {
    expect(parseInBase('1010', 2)).toBe(10);
    expect(formatInBase(10, 2)).toBe('1010');
  });
  it('parses and formats octal', () => {
    expect(parseInBase('17', 8)).toBe(15);
    expect(formatInBase(15, 8)).toBe('17');
  });
  it('handles negative numbers', () => {
    expect(parseInBase('-FF', 16)).toBe(-255);
  });
  it('rejects invalid digits for the base', () => {
    expect(() => parseInBase('2', 2)).toThrow();
    expect(() => parseInBase('G', 16)).toThrow();
  });
});

describe('bitwise ops (32-bit signed)', () => {
  it('AND / OR / XOR / NOT', () => {
    expect(bitwiseAnd(0b1100, 0b1010)).toBe(0b1000);
    expect(bitwiseOr(0b1100, 0b1010)).toBe(0b1110);
    expect(bitwiseXor(0b1100, 0b1010)).toBe(0b0110);
    expect(bitwiseNot(0)).toBe(-1);
  });

  it('shifts', () => {
    expect(shiftLeft(1, 4)).toBe(16);
    expect(shiftRightArithmetic(-8, 1)).toBe(-4);
    expect(shiftRightLogical(-1, 28)).toBe(15);
  });

  it('rejects non-integers', () => {
    expect(() => bitwiseAnd(1.5, 2)).toThrow();
  });
});
