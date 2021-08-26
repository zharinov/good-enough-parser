import type { Checkpoint } from '../types/checkpoint';
import type { OpMatcherOption } from '../types/matcher';
import { AbstractMatcher } from './abstract-matcher';
import type { OperatorToken } from '/lexer/types';

export class OpMatcher<Ctx> extends AbstractMatcher<Ctx> {
  private matcher: string | RegExp;

  handler?: (ctx: Ctx, token: OperatorToken) => Ctx;

  constructor({ matcher, handler }: OpMatcherOption<Ctx>) {
    super();
    this.matcher = matcher;
    this.handler = handler;
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const node = cursor?.node;
    if (node?.type === 'operator') {
      if (
        typeof this.matcher === 'string'
          ? this.matcher === node.value
          : this.matcher.test(node.value)
      ) {
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
