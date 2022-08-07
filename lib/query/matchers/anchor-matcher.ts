import type { Cursor } from '../../parser';
import { clone } from '../../util/clone';
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

export class VoidMatcher<Ctx> extends AbstractMatcher<Ctx> {
  private handler: (context: Ctx) => Ctx;

  constructor(handler: (context: Ctx) => Ctx) {
    super();
    this.handler = (context: Ctx) => handler(clone(context));
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const newContext = this.handler(context);
    return { cursor, context: newContext };
  }

  override moveRight(cursor: Cursor): Cursor {
    return cursor;
  }

  override seekNext(cursor: Cursor): Cursor {
    return cursor;
  }
}
