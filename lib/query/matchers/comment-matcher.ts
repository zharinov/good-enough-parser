import { CommentToken } from '../../lexer/types';
import type {
  Checkpoint,
  CommentMatcherHandler,
  CommentMatcherOptions,
  CommentMatcherValue,
} from '../types';
import { coerceHandler } from '../util';
import { AbstractMatcher } from './abstract-matcher';

export class CommentMatcher<Ctx> extends AbstractMatcher<Ctx> {
  override readonly minorToken = 'comment';

  readonly comment: CommentMatcherValue;
  readonly handler: CommentMatcherHandler<Ctx>;

  constructor({ value, handler }: CommentMatcherOptions<Ctx>) {
    super();
    this.comment = value;
    this.handler = coerceHandler<Ctx, CommentToken>(handler);
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const node = cursor.node;
    if (node?.type === 'comment') {
      let isMatched = true;
      if (typeof this.comment === 'string') {
        isMatched = this.comment === node.value;
      } else if (this.comment instanceof RegExp) {
        isMatched = this.comment.test(node.value);
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
