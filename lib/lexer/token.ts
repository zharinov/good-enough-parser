import type { Token as MooToken } from 'moo';
import type { Token, TokenBase } from './types';

export function coerceToken(
  { type, value, offset, line, col, lineBreaks }: MooToken,
  parent?: MooToken
): Token {
  const base: TokenBase = parent
    ? {
        value,
        offset: offset + parent.offset,
        line: line + parent.line - 1,
        col: col + parent.col - 1,
        lineBreaks: lineBreaks + parent.lineBreaks,
      }
    : { value, offset, line, col, lineBreaks };

  if (typeof type === 'string') {
    const [p1, , p2, , p3] = type.split('$');

    if (p1 === 'newline') {
      return { type: 'newline', ...base };
    } else if (p1 === 'whitespace') {
      return { type: 'whitespace', ...base };
    } else if (p1 === 'bracket') {
      if (p2 === 'left') {
        return { type: 'bracket-left', ...base };
      } else if (p2 === 'right') {
        return { type: 'bracket-right', ...base };
      }
    } else if (p1 === 'comment') {
      return { type: 'comment', ...base };
    } else if (p1 === 'op') {
      return { type: 'operator', ...base };
    } else if (p1 === 'str') {
      if (p2 === 'start') {
        return { type: 'string-start', ...base };
      } else if (p2 === 'value') {
        return { type: 'string-value', ...base };
      } else if (p2 === 'end') {
        return { type: 'string-end', ...base };
      } else if (p2 === 'tpl') {
        if (p3 === 'start') {
          return { type: 'template-start', ...base };
        } else if (p3 === 'end') {
          return { type: 'template-end', ...base };
        }
      }
    } else if (p1 === 'symbol') {
      return { type: 'symbol', ...base };
    } else if (p1 === 'number') {
      return { type: 'number', ...base };
    }
  }

  return { type: '_', ...base };
}
