export type BinaryOp = '+' | '-' | '*' | '/' | '^';

export type AstNode =
  | { type: 'Number'; value: number }
  | { type: 'Constant'; name: 'pi' | 'e' }
  | { type: 'Variable'; name: string }
  | { type: 'Binary'; op: BinaryOp; left: AstNode; right: AstNode }
  | { type: 'Negate'; operand: AstNode }
  | { type: 'Percent'; operand: AstNode }
  | { type: 'Factorial'; operand: AstNode }
  | { type: 'Call'; name: string; args: AstNode[] };
