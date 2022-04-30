import type { NumberToken } from '../../lexer/types';
import { safeHandler } from '../handler';
import { isRegex } from '../regex';
import type {
  Checkpoint,
  NumMatcherHandler,
  NumMatcherOptions,
  NumMatcherValue,
} from '../types';
import { AbstractMatcher } from './abstract-matcher';

export class NumMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly num: NumMatcherValue;
  readonly handler: NumMatcherHandler<Ctx>;

  constructor({ value, handler }: NumMatcherOptions<Ctx>) {
    super();
    this.num = value;
    this.handler = safeHandler<Ctx, NumberToken>(handler);
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    let context = checkpoint.context;
    let cursor = this.seekNext(checkpoint.cursor);
    const node = cursor.node;
    if (node?.type === 'number') {
      let isMatched = true;
      if (typeof this.num === 'string') {
        isMatched = this.num === node.value;
      } else if (isRegex(this.num)) {
        isMatched = this.num.test(node.value);
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
