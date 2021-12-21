import { SymbolToken } from '../../lexer/types';
import { safeHandler } from '../handler';
import { isRegex } from '../regex';
import type {
  Checkpoint,
  SymMatcherHandler,
  SymMatcherOptions,
  SymMatcherValue,
} from '../types';
import { AbstractMatcher } from './abstract-matcher';

export class SymMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly sym: SymMatcherValue;
  readonly handler: SymMatcherHandler<Ctx>;

  constructor({ value, handler }: SymMatcherOptions<Ctx>) {
    super();
    this.sym = value;
    this.handler = safeHandler<Ctx, SymbolToken>(handler);
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    let context = checkpoint.context;
    let cursor = this.seekNext(checkpoint.cursor);
    const node = cursor.node;
    if (node?.type === 'symbol') {
      let isMatched = true;
      if (typeof this.sym === 'string') {
        isMatched = this.sym === node.value;
      } else if (isRegex(this.sym)) {
        isMatched = this.sym.test(node.value);
      }
      if (isMatched) {
        context = this.handler(context, node);
        cursor = this.moveRight(cursor);
        return { cursor, context };
      }
    }

    return null;
  }
}
