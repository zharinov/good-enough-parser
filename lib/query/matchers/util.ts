import { isMinorToken } from '../../parser';
import type { Checkpoint } from '../types';

export function skipMinorTokens<Ctx>(
  checkpoint: Checkpoint<Ctx>
): Checkpoint<Ctx> | null {
  let cursor = checkpoint.cursor;
  let node = cursor.node;
  while (isMinorToken(node)) {
    const nextCursor = cursor.right;
    if (!nextCursor) {
      return null;
    }
    node = nextCursor.node;
    cursor = nextCursor;
  }
  return { ...checkpoint, cursor };
}
