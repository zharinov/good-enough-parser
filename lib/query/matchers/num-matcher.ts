import type {
  Checkpoint,
  NumMatcherHandler,
  NumMatcherOptions,
  NumMatcherValue,
} from '../types';
import { coerceHandler } from '../util';
import { AbstractMatcher } from './abstract-matcher';

export class NumMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly num: NumMatcherValue;
  readonly handler: NumMatcherHandler<Ctx>;

  constructor({ value, handler }: NumMatcherOptions<Ctx>) {
    super();
    this.num = value;
    this.handler = coerceHandler(handler);
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const node = cursor.node;
    if (node.type === 'number') {
      let isMatched = true;
      if (typeof this.num === 'string') {
        isMatched = this.num === node.value;
      } else if (this.num instanceof RegExp) {
        isMatched = this.num.test(node.value);
      }
      if (isMatched) {
        const nextContext = this.handler(context, node);
        const nextCursor = cursor.right;
        return nextCursor
          ? { context: nextContext, cursor: nextCursor }
          : { context: nextContext, cursor, endOfLevel: true };
      }
    }

    return null;
  }
}
