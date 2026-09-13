import type { AstNode } from '../parser/ast';

/**
 * Converts an AST back into a re-parseable expression string. Favors always-correct
 * parenthesization over the fewest possible parens (e.g. it will sometimes print
 * "a+(b+c)" where "a+b+c" would also be valid) — but it never omits a paren that
 * changes the meaning.
 */
export function stringify(node: AstNode): string {
  return render(node, 0);
}

function precedenceOf(node: AstNode): number {
  switch (node.type) {
    case 'Number':
    case 'Constant':
    case 'Variable':
    case 'Call':
      return 6;
    case 'Percent':
    case 'Factorial':
      return 5;
    case 'Negate':
      return 3;
    case 'Binary':
      switch (node.op) {
        case '+':
        case '-':
          return 1;
        case '*':
        case '/':
          return 2;
        case '^':
          return 4;
      }
  }
}

function formatNumber(value: number): string {
  if (Object.is(value, -0)) return '0';
  return Number(value.toPrecision(12)).toString();
}

function wrap(text: string, ownPrecedence: number, minPrecedence: number): string {
  return ownPrecedence < minPrecedence ? `(${text})` : text;
}

function render(node: AstNode, minPrecedence: number): string {
  const p = precedenceOf(node);

  switch (node.type) {
    case 'Number': {
      if (node.value < 0) {
        return wrap(`-${formatNumber(-node.value)}`, p, minPrecedence);
      }
      return formatNumber(node.value);
    }
    case 'Constant':
      return node.name === 'pi' ? 'pi' : 'e';
    case 'Variable':
      return node.name;
    case 'Call':
      return `${node.name}(${node.args.map((a) => render(a, 0)).join(', ')})`;
    case 'Negate':
      return wrap(`-${render(node.operand, 2)}`, p, minPrecedence);
    case 'Percent':
      return wrap(`${render(node.operand, 6)}%`, p, minPrecedence);
    case 'Factorial':
      return wrap(`${render(node.operand, 6)}!`, p, minPrecedence);
    case 'Binary': {
      const symbol = { '+': ' + ', '-': ' - ', '*': '*', '/': '/', '^': '^' }[node.op];
      if (node.op === '^') {
        const left = render(node.left, p + 1);
        const right = render(node.right, p);
        return wrap(`${left}${symbol}${right}`, p, minPrecedence);
      }
      const left = render(node.left, p);
      const right = render(node.right, p + 1);
      return wrap(`${left}${symbol}${right}`, p, minPrecedence);
    }
  }
}
