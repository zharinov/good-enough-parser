import { StringValueToken } from '../../lexer/types';
import { StringTree, TemplateTree } from '../../parser/types';
import type {
  Checkpoint,
  Matcher,
  NodeHandler,
  StrTplOptionsBase,
  StrTreeHandler,
  StrTreeOptionsBase,
} from '../types';
import { coerceHandler } from '../util';
import { AbstractMatcher } from './abstract-matcher';
import { skipMinorTokens } from './util';

export type StrContentMatcherValue = string | RegExp | null;
export type StrContentMatcherHandler<Ctx> = (
  ctx: Ctx,
  token: StringValueToken
) => Ctx;
export interface StrContentMatcherOptions<Ctx> {
  value: StrContentMatcherValue;
  handler: StrContentMatcherHandler<Ctx> | null;
}

export class StrContentMatcher<Ctx> extends AbstractMatcher<Ctx> {
  public readonly content: StrContentMatcherValue;
  public readonly handler: StrContentMatcherHandler<Ctx>;

  constructor({ value, handler }: StrContentMatcherOptions<Ctx>) {
    super();
    this.content = value ?? null;
    this.handler = coerceHandler<Ctx, StringValueToken>(handler);
  }

  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const node = cursor.node;
    if (node?.type === 'string-value') {
      let isMatched = true;
      if (typeof this.content === 'string') {
        isMatched = this.content === node.value;
      } else if (this.content instanceof RegExp) {
        isMatched = this.content.test(node.value);
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

interface StrTplMatcherOptions<Ctx> extends StrTplOptionsBase<Ctx> {
  matcher: Matcher<Ctx>;
}

export class StrTplMatcher<Ctx> extends AbstractMatcher<Ctx> {
  public readonly matcher: Matcher<Ctx>;
  public readonly preHandler: NodeHandler<Ctx, TemplateTree>;
  public readonly postHandler: NodeHandler<Ctx, TemplateTree>;

  constructor(config: StrTplMatcherOptions<Ctx>) {
    super();
    this.matcher = config.matcher;
    this.preHandler = coerceHandler<Ctx, TemplateTree>(config.preHandler);
    this.postHandler = coerceHandler<Ctx, TemplateTree>(config.postHandler);
  }

  seekNextChild(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const cursor = skipMinorTokens(checkpoint.cursor);
    let nextCheckpoint = cursor ? { ...checkpoint, cursor } : null;
    while (nextCheckpoint) {
      const checkpoint = this.matcher.match(nextCheckpoint);
      if (checkpoint) {
        return checkpoint;
      }

      const nextCursor = skipMinorTokens(nextCheckpoint?.cursor?.right);
      nextCheckpoint = nextCursor
        ? {
            cursor: nextCursor,
            context: nextCheckpoint.context,
          }
        : null;
    }

    return null;
  }

  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor: rootCursor, context: rootContext } = checkpoint;
    const rootNode = rootCursor.node;
    if (rootNode?.type === 'template-tree') {
      const cursor = checkpoint.cursor.down;
      if (cursor && cursor.node) {
        const childMatch = this.seekNextChild({
          context: this.preHandler(rootContext, rootNode),
          cursor,
        });

        if (childMatch && !skipMinorTokens(childMatch.cursor)) {
          const cursor = rootCursor.right;
          const context = this.postHandler(childMatch.context, rootNode);
          return cursor
            ? { context, cursor }
            : { context, cursor: rootCursor, endOfLevel: true };
        }
      }
    }

    return null;
  }
}

export type StrNodeChildMatcher<Ctx> =
  | StrContentMatcher<Ctx>
  | StrTplMatcher<Ctx>;
export interface StrMatcherOptions<Ctx> extends StrTreeOptionsBase<Ctx> {
  matchers: StrNodeChildMatcher<Ctx>[] | null;
}

export class StrNodeMatcher<Ctx> extends AbstractMatcher<Ctx> {
  public matchers: StrNodeChildMatcher<Ctx>[] | null;
  public readonly preHandler: StrTreeHandler<Ctx>;
  public readonly postHandler: StrTreeHandler<Ctx>;

  constructor(opts: StrMatcherOptions<Ctx>) {
    super();
    this.matchers = opts.matchers ?? null;
    this.preHandler = coerceHandler<Ctx, StringTree>(opts.preHandler);
    this.postHandler = coerceHandler<Ctx, StringTree>(opts.postHandler);
  }

  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const node = checkpoint.cursor.node;
    if (node?.type === 'string-tree') {
      let context = this.preHandler(checkpoint.context, node);

      if (this.matchers) {
        let cursor = checkpoint.cursor.down;
        if (cursor?.node || this.matchers.length !== 0) {
          for (const matcher of this.matchers) {
            if (!cursor) {
              return null;
            }

            const match = matcher.match({ context, cursor });
            if (!match) {
              return null;
            }

            context = match.context;
            cursor = match.endOfLevel ? undefined : match.cursor;
          }

          if (cursor) {
            return null;
          }
        }
      }

      context = this.postHandler(context, node);

      const nextCursor = checkpoint.cursor.right;
      return nextCursor
        ? { context, cursor: nextCursor }
        : { context, cursor: checkpoint.cursor, endOfLevel: true };
    }
    return null;
  }
}
