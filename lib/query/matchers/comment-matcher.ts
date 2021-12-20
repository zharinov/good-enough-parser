import { CommentToken } from '../../lexer/types';
import { Node } from '../../parser';
import type {
  Checkpoint,
  CommentMatcherHandler,
  CommentMatcherOptions,
  CommentMatcherValue,
} from '../types';
import { coerceHandler } from '../util';
import { AbstractMatcher } from './abstract-matcher';

const skipBeforeComment: Node['type'][] = ['whitespace', '_start', 'newline'];

export class CommentMatcher<Ctx> extends AbstractMatcher<Ctx> {
  readonly comment: CommentMatcherValue;
  readonly handler: CommentMatcherHandler<Ctx>;

  constructor({ value, handler }: CommentMatcherOptions<Ctx>) {
    super();
    this.comment = value;
    this.handler = coerceHandler<Ctx, CommentToken>(handler);
  }

  override canSkip(node: Node): boolean {
    return skipBeforeComment.includes(node.type);
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const context = checkpoint.context;
    const cursor = this.seekNext(checkpoint.cursor);
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
        const nextCursor = cursor.right ?? cursor;
        return { context: nextContext, cursor: nextCursor };
      }
    }

    return null;
  }
}
