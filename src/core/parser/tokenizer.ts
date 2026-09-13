import { CalcError } from './errors';

export type TokenType =
  | 'number'
  | 'identifier'
  | 'plus'
  | 'minus'
  | 'star'
  | 'slash'
  | 'caret'
  | 'percent'
  | 'bang'
  | 'lparen'
  | 'rparen'
  | 'comma'
  | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  start: number;
}

const SINGLE_CHAR_TOKENS: Record<string, TokenType> = {
  '+': 'plus',
  '-': 'minus',
  '*': 'star',
  '×': 'star',
  '/': 'slash',
  '÷': 'slash',
  '^': 'caret',
  '%': 'percent',
  '!': 'bang',
  '(': 'lparen',
  ')': 'rparen',
  ',': 'comma',
};

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isIdentifierStart(ch: string): boolean {
  return /[a-zA-Zπ]/.test(ch);
}

function isIdentifierPart(ch: string): boolean {
  return /[a-zA-Z0-9_π]/.test(ch);
}

/** Turns a raw expression string into a flat token stream. Throws CalcError('syntax') on invalid characters. */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i++;
      continue;
    }

    if (isDigit(ch) || (ch === '.' && isDigit(input[i + 1] ?? ''))) {
      const start = i;
      let sawDot = false;
      while (i < input.length && (isDigit(input[i]) || (input[i] === '.' && !sawDot))) {
        if (input[i] === '.') sawDot = true;
        i++;
      }
      tokens.push({ type: 'number', value: input.slice(start, i), start });
      continue;
    }

    if (isIdentifierStart(ch)) {
      const start = i;
      while (i < input.length && isIdentifierPart(input[i])) i++;
      tokens.push({ type: 'identifier', value: input.slice(start, i), start });
      continue;
    }

    const single = SINGLE_CHAR_TOKENS[ch];
    if (single) {
      tokens.push({ type: single, value: ch, start: i });
      i++;
      continue;
    }

    throw new CalcError('syntax', `Unexpected character "${ch}" at position ${i}`);
  }

  tokens.push({ type: 'eof', value: '', start: input.length });
  return tokens;
}
