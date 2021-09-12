import { isMinorToken } from '../../parser';
import type { Cursor } from '../../parser/types';

export function skipMinorTokens(input: Cursor | undefined): Cursor | undefined {
  if (!input) {
    return input;
  }

  let cursor = input;
  let node = cursor.node;
  while (isMinorToken(node)) {
    const nextCursor = cursor.right;
    if (!nextCursor) {
      return nextCursor;
    }
    node = nextCursor.node;
    cursor = nextCursor;
  }
  return cursor;
}
