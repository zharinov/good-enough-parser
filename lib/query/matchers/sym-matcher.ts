import type { Checkpoint } from '../types/checkpoint';
import { AbstractMatcher } from './abstract-matcher';
import type {
  SymMatcherHandler,
  SymMatcherOptions,
  SymMatcherValue,
} from './types';

export class SymMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly sym: SymMatcherValue;
  readonly handler: SymMatcherHandler<Ctx> | null;

  constructor({ value, handler }: SymMatcherOptions<Ctx>) {
    super();
    this.sym = value;
    this.handler = handler ?? null;
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const node = cursor?.node;
    if (node?.type === 'symbol') {
      let isMatched = true;
      if (typeof this.sym === 'string') {
        isMatched = this.sym === node.value;
      } else if (this.sym instanceof RegExp) {
        isMatched = this.sym.test(node.value);
      }
      if (isMatched) {
        const nextContext = this.handler
          ? this.handler(context, node)
          : context;
        const nextCursor = cursor.right;
        return nextCursor
          ? { context: nextContext, cursor: nextCursor }
          : { context: nextContext, cursor, endOfLevel: true };
      }
    }

    return null;
  }
}
