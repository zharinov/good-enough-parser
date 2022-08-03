import type { Checkpoint } from '../types';
import { AbstractMatcher } from './abstract-matcher';

export class BeginMatcher<Ctx> extends AbstractMatcher<Ctx> {
  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    let { cursor } = checkpoint;

    if (cursor.node?.type === '_start') {
      cursor = this.moveRight(cursor);
      return { ...checkpoint, cursor };
    }

    return null;
  }
}

export class EndMatcher<Ctx> extends AbstractMatcher<Ctx> {
  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    let { cursor } = checkpoint;

    cursor = this.seekNext(cursor);
    if (cursor.node?.type === '_end') {
      return checkpoint;
    }

    return null;
  }
}
