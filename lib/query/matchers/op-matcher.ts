import type {
  Checkpoint,
  OpMatcherHandler,
  OpMatcherOptions,
  OpMatcherValue,
} from '../types';
import { coerceHandler } from '../util';
import { AbstractMatcher } from './abstract-matcher';

export class OpMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly op: OpMatcherValue;
  readonly handler: OpMatcherHandler<Ctx>;

  constructor({ value, handler }: OpMatcherOptions<Ctx>) {
    super();
    this.op = value;
    this.handler = coerceHandler(handler);
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const node = cursor.node;
    if (node.type === 'operator') {
      let isMatched = true;
      if (typeof this.op === 'string') {
        isMatched = this.op === node.value;
      } else if (this.op instanceof RegExp) {
        isMatched = this.op.test(node.value);
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
