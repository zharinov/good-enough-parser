import type { Checkpoint } from '../types';
import { AbstractMatcher } from './abstract-matcher';

export class AnchorMatcher<Ctx> extends AbstractMatcher<Ctx> {
  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    let { cursor } = checkpoint;
    const { node } = cursor;

    if (node?.type === '_start') {
      cursor = this.moveRight(cursor);
      return { ...checkpoint, cursor };
    }

    if (node?.type === '_end') {
      return checkpoint;
    }

    return null;
  }
}
