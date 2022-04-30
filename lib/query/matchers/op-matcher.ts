import type { OperatorToken } from '../../lexer/types';
import { safeHandler } from '../handler';
import { isRegex } from '../regex';
import type {
  Checkpoint,
  OpMatcherHandler,
  OpMatcherOptions,
  OpMatcherValue,
} from '../types';
import { AbstractMatcher } from './abstract-matcher';

export class OpMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly op: OpMatcherValue;
  readonly handler: OpMatcherHandler<Ctx>;

  constructor({ value, handler }: OpMatcherOptions<Ctx>) {
    super();
    this.op = value;
    this.handler = safeHandler<Ctx, OperatorToken>(handler);
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    let context = checkpoint.context;
    let cursor = this.seekNext(checkpoint.cursor);
    const node = cursor.node;
    if (node?.type === 'operator') {
      let isMatched = true;
      if (typeof this.op === 'string') {
        isMatched = this.op === node.value;
      } else if (isRegex(this.op)) {
        isMatched = this.op.test(node.value);
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
