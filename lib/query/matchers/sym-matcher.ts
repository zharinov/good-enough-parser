import { SymbolToken } from '../../lexer/types';
import type {
  Checkpoint,
  SymMatcherHandler,
  SymMatcherOptions,
  SymMatcherValue,
} from '../types';
import { coerceHandler } from '../util';
import { AbstractMatcher } from './abstract-matcher';

export class SymMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly sym: SymMatcherValue;
  readonly handler: SymMatcherHandler<Ctx>;

  constructor({ value, handler }: SymMatcherOptions<Ctx>) {
    super();
    this.sym = value;
    this.handler = coerceHandler<Ctx, SymbolToken>(handler);
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const node = cursor.node;
    if (node?.type === 'symbol') {
      let isMatched = true;
      if (typeof this.sym === 'string') {
        isMatched = this.sym === node.value;
      } else if (this.sym instanceof RegExp) {
        isMatched = this.sym.test(node.value);
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
