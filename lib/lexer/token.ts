import type { Token as MooToken } from 'moo';

export interface TokenBase {
  value: string;
  offset: number;
}

export interface NewlineToken extends TokenBase {
  type: 'newline';
}

export interface WhitespaceToken extends TokenBase {
  type: 'whitespace';
}

export interface BracketLeftToken extends TokenBase {
  type: 'bracket-left';
}

export interface BracketRightToken extends TokenBase {
  type: 'bracket-right';
}

export interface CommentToken extends TokenBase {
  type: 'comment';
}

export interface OperatorToken extends TokenBase {
  type: 'operator';
}

export interface StringStartToken extends TokenBase {
  type: 'string-start';
}

export interface StringValueToken extends TokenBase {
  type: 'string-value';
}

export interface StringEndToken extends TokenBase {
  type: 'string-end';
}

export interface TemplateStartToken extends TokenBase {
  type: 'template-start';
}

export interface TemplateEndToken extends TokenBase {
  type: 'template-end';
}

export interface SymbolToken extends TokenBase {
  type: 'symbol';
}

export interface UnknownToken extends TokenBase {
  type: '_';
}

export type Token =
  | NewlineToken
  | WhitespaceToken
  | BracketLeftToken
  | BracketRightToken
  | CommentToken
  | OperatorToken
  | StringStartToken
  | StringValueToken
  | StringEndToken
  | TemplateStartToken
  | TemplateEndToken
  | SymbolToken
  | UnknownToken;

export function coerceToken({ type, value, offset }: MooToken): Token {
  const base: TokenBase = { value, offset };

  if (typeof type === 'string') {
    const [p1, , p3, , p5] = type.split('$');

    if (p1 === 'newline') {
      return { type: 'newline', ...base };
    } else if (p1 === 'whitespace') {
      return { type: 'whitespace', ...base };
    } else if (p1 === 'bracket') {
      if (p3 === 'left') {
        return { type: 'bracket-left', ...base };
      } else if (p3 === 'right') {
        return { type: 'bracket-right', ...base };
      }
    } else if (p1 === 'comment') {
      return { type: 'comment', ...base };
    } else if (p1 === 'op') {
      return { type: 'operator', ...base };
    } else if (p1 === 'str') {
      if (p3 === 'start') {
        return { type: 'string-start', ...base };
      } else if (p3 === 'value') {
        return { type: 'string-value', ...base };
      } else if (p3 === 'end') {
        return { type: 'string-end', ...base };
      } else if (p3 === 'tpl') {
        if (p5 === 'start') {
          return { type: 'template-start', ...base };
        } else if (p5 === 'end') {
          return { type: 'template-end', ...base };
        }
      }
    } else if (p1 === 'symbol') {
      return { type: 'symbol', ...base };
    }
  }

  return { type: '_', ...base };
}

export function nextOffset(token: Token): number {
  return token.offset + token.value.length;
}
