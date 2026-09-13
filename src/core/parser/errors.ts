export type CalcErrorKind =
  | 'syntax'
  | 'domain'
  | 'division-by-zero'
  | 'unknown-identifier'
  | 'arity'
  | 'invalid-input'
  | 'unsupported';

/** A typed calculation error, as opposed to a generic thrown Error string. */
export class CalcError extends Error {
  readonly kind: CalcErrorKind;

  constructor(kind: CalcErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'CalcError';
  }
}
