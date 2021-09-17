import type { MinorToken } from '../../lexer/types';
import type { Cursor, Node } from '../../parser/types';

const skippableTypes = new Set<string>([
  '_start',
  'newline',
  'whitespace',
  'comment',
]);

export function isSkippableNode(node: Node): boolean {
  return skippableTypes.has(node.type);
}

export function seekToNextSignificantToken(
  cursor: Cursor,
  except?: MinorToken['type']
): Cursor {
  let node = cursor.node;
  while (isSkippableNode(node)) {
    if (node.type === except) {
      break;
    }

    if (!cursor.right) {
      return cursor;
    }

    cursor = cursor.right;
    node = cursor.node;
  }

  return cursor;
}

export function seekRight(cursor: Cursor): Cursor {
  const result = cursor.right;
  if (result) {
    return result;
  }
  throw new Error('Cursor error: move right');
}
