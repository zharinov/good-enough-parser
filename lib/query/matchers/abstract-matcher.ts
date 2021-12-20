import type { Cursor, Node } from '../../parser';
import type { Checkpoint, Matcher } from '../types';

const skipByDefault: Node['type'][] = [
  'whitespace',
  '_start',
  'newline',
  'comment',
];

export abstract class AbstractMatcher<Ctx> implements Matcher<Ctx> {
  canSkip(node: Node): boolean {
    return skipByDefault.includes(node.type);
  }

  seekNext(cursor: Cursor): Cursor {
    let node = cursor.node;
    while (this.canSkip(node)) {
      if (!cursor.right) {
        return cursor;
      }

      cursor = cursor.right;
      node = cursor.node;
    }

    return cursor;
  }

  moveRight(cursor: Cursor): Cursor {
    const result = cursor.right;
    if (result) {
      return result;
    }
    throw new Error('Cursor error: move right');
  }

  abstract match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null;

  nextMatch(): Checkpoint<Ctx> | null {
    return null;
  }
}
