import type { Token } from '../../lexer/types';
import type { Cursor, Tree } from '../../parser';
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

export class VoidMatcher<
  Ctx,
  T extends Tree | Token
> extends AbstractMatcher<Ctx> {
  private handler: (context: Ctx, t: T) => Ctx;

  constructor(handler: (context: Ctx, t: T) => Ctx) {
    super();
    this.handler = (context: Ctx, t: T) => handler(clone(context), t);
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const prevCursor = cursor.left ?? cursor;
    const node = prevCursor.node as T;
    const newContext = this.handler(context, node);
    return { cursor, context: newContext };
  }

  override moveRight(cursor: Cursor): Cursor {
    return cursor;
  }

  override seekNext(cursor: Cursor): Cursor {
    return cursor;
  }
}
