import { describe, expect, it } from 'vitest';
import { tokenize } from '../tokenizer';
import { CalcError } from '../errors';

describe('tokenize', () => {
  it('splits numbers, operators and identifiers', () => {
    const types = tokenize('12.5 + sin(30)').map((t) => t.type);
    expect(types).toEqual(['number', 'plus', 'identifier', 'lparen', 'number', 'rparen', 'eof']);
  });

  it('accepts a single decimal point per number', () => {
    const tokens = tokenize('3.14');
    expect(tokens[0]).toMatchObject({ type: 'number', value: '3.14' });
  });

  it('rejects unknown characters', () => {
    expect(() => tokenize('1 + @')).toThrow(CalcError);
  });

  it('ignores whitespace', () => {
    const types = tokenize('  1   +   2  ').map((t) => t.type);
    expect(types).toEqual(['number', 'plus', 'number', 'eof']);
  });
});
