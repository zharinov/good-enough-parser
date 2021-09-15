import { MinorToken } from '../../lexer/types';
import { isMinorToken } from '../../parser';
import type { Cursor } from '../../parser/types';

export function skipMinorTokens(
  input: Cursor | undefined,
  except?: MinorToken['type']
): Cursor | undefined {
  if (!input) {
    return input;
  }

  let cursor = input;
  let node = cursor.node;
  while (isMinorToken(node)) {
    if (node.type === except) {
      break;
    }

    const nextCursor = cursor.right;
    if (!nextCursor) {
      return nextCursor;
    }
    node = nextCursor.node;
    cursor = nextCursor;
  }

  return cursor;
}
