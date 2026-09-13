import type { AstNode, BinaryOp } from './ast';
import { CalcError } from './errors';
import { tokenize, type Token, type TokenType } from './tokenizer';

const CONSTANTS = new Set(['pi', 'π', 'e']);
const VARIABLES = new Set(['x']);

const FUNCTION_ARITY: Record<string, number> = {
  sin: 1,
  cos: 1,
  tan: 1,
  asin: 1,
  acos: 1,
  atan: 1,
  sinh: 1,
  cosh: 1,
  tanh: 1,
  asinh: 1,
  acosh: 1,
  atanh: 1,
  log: 1,
  logb: 2,
  ln: 1,
  exp: 1,
  sqrt: 1,
  cbrt: 1,
  abs: 1,
  floor: 1,
  ceil: 1,
  round: 1,
  gcd: 2,
  lcm: 2,
  npr: 2,
  ncr: 2,
};

/** Recursive-descent parser: expression -> term -> unary -> power -> postfix -> implicit-mul -> primary. */
class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private at(type: TokenType): boolean {
    return this.peek().type === type;
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: TokenType, what: string): Token {
    if (!this.at(type)) {
      throw new CalcError('syntax', `Expected ${what} at position ${this.peek().start}`);
    }
    return this.advance();
  }

  parseProgram(): AstNode {
    const node = this.parseExpression();
    if (!this.at('eof')) {
      throw new CalcError('syntax', `Unexpected token "${this.peek().value}" at position ${this.peek().start}`);
    }
    return node;
  }

  private parseExpression(): AstNode {
    let left = this.parseTerm();
    for (;;) {
      if (this.at('plus') || this.at('minus')) {
        const op: BinaryOp = this.advance().type === 'plus' ? '+' : '-';
        const right = this.parseTerm();
        left = { type: 'Binary', op, left, right };
      } else {
        return left;
      }
    }
  }

  private parseTerm(): AstNode {
    // Implicit multiplication (e.g. "2pi", "3(4+5)") is handled inside parseImplicitProduct,
    // which parseUnary reaches directly, so it's already folded into `left`.
    let left = this.parseUnary();
    for (;;) {
      if (this.at('star') || this.at('slash')) {
        const op: BinaryOp = this.advance().type === 'star' ? '*' : '/';
        const right = this.parseUnary();
        left = { type: 'Binary', op, left, right };
      } else {
        return left;
      }
    }
  }

  private parseUnary(): AstNode {
    if (this.at('minus')) {
      this.advance();
      return { type: 'Negate', operand: this.parseUnary() };
    }
    if (this.at('plus')) {
      this.advance();
      return this.parseUnary();
    }
    return this.parseImplicitProduct();
  }

  /**
   * A chain of one or more "power units" placed side by side with no explicit operator,
   * e.g. "2pi", "3(4+5)", "2sin(30)pi". Each unit binds its own exponent/postfix first, so
   * "2pi^2" parses as 2*(pi^2), matching standard math notation rather than (2*pi)^2.
   */
  private parseImplicitProduct(): AstNode {
    let node = this.parsePowerUnit();
    while (this.startsImplicitFactor()) {
      const next = this.parsePowerUnit();
      node = { type: 'Binary', op: '*', left: node, right: next };
    }
    return node;
  }

  private parsePowerUnit(): AstNode {
    const base = this.parsePostfix();
    if (this.at('caret')) {
      this.advance();
      const exponent = this.parseUnary(); // right-associative, allows 2^-1 and 2^2^3
      return { type: 'Binary', op: '^', left: base, right: exponent };
    }
    return base;
  }

  private parsePostfix(): AstNode {
    let node = this.parsePrimary();
    for (;;) {
      if (this.at('bang')) {
        this.advance();
        node = { type: 'Factorial', operand: node };
      } else if (this.at('percent')) {
        this.advance();
        node = { type: 'Percent', operand: node };
      } else {
        return node;
      }
    }
  }

  /** True if the current token can start a new primary directly after another primary (implicit `*`). */
  private startsImplicitFactor(): boolean {
    const t = this.peek();
    return t.type === 'number' || t.type === 'identifier' || t.type === 'lparen';
  }

  private parsePrimary(): AstNode {
    const t = this.peek();

    if (t.type === 'number') {
      this.advance();
      return { type: 'Number', value: Number(t.value) };
    }

    if (t.type === 'lparen') {
      this.advance();
      const inner = this.parseExpression();
      this.expect('rparen', 'closing parenthesis')
      return inner;
    }

    if (t.type === 'identifier') {
      const name = t.value.toLowerCase();
      this.advance();

      if (this.at('lparen')) {
        this.advance();
        const args: AstNode[] = [];
        if (!this.at('rparen')) {
          args.push(this.parseExpression());
          while (this.at('comma')) {
            this.advance();
            args.push(this.parseExpression());
          }
        }
        this.expect('rparen', 'closing parenthesis');

        const arity = FUNCTION_ARITY[name];
        if (arity === undefined) {
          throw new CalcError('unknown-identifier', `Unknown function "${name}"`);
        }
        if (args.length !== arity) {
          throw new CalcError('arity', `${name}() expects ${arity} argument${arity === 1 ? '' : 's'}, got ${args.length}`);
        }
        return { type: 'Call', name, args };
      }

      if (CONSTANTS.has(name) || CONSTANTS.has(t.value)) {
        return { type: 'Constant', name: name === 'pi' || t.value === 'π' ? 'pi' : 'e' };
      }

      if (VARIABLES.has(name)) {
        return { type: 'Variable', name };
      }

      throw new CalcError('unknown-identifier', `Unknown identifier "${t.value}"`);
    }

    throw new CalcError('syntax', `Unexpected token "${t.value || 'end of input'}" at position ${t.start}`);
  }
}

/** Parses a raw expression string into an AST. Throws CalcError on any invalid input. */
export function parse(input: string): AstNode {
  const tokens = tokenize(input);
  return new Parser(tokens).parseProgram();
}
