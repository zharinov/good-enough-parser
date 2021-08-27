import type { Checkpoint } from '../types/checkpoint';
import { AbstractMatcher } from './abstract-matcher';
import type {
  OpMatcherHandler,
  OpMatcherOptions,
  OpMatcherValue,
} from './types';

export class OpMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly op: OpMatcherValue;
  readonly handler: OpMatcherHandler<Ctx> | null;

  constructor({ value, handler }: OpMatcherOptions<Ctx>) {
    super();
    this.op = value;
    this.handler = handler ?? null;
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const node = cursor?.node;
    if (node?.type === 'operator') {
      let isMatched = true;
      if (typeof this.op === 'string') {
        isMatched = this.op === node.value;
      } else if (this.op instanceof RegExp) {
        isMatched = this.op.test(node.value);
      }
      if (isMatched) {
        const nextCursor = cursor?.right;
        const nextContext = this.handler
          ? this.handler(context, node)
          : context;

        return {
          cursor: nextCursor,
          context: nextContext,
        };
      }
    }

    return null;
  }
}
