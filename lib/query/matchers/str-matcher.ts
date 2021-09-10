import { StringValueToken } from '../../lexer/types';
import { StringTree, TemplateTree } from '../../parser/types';
import type { Checkpoint, TreeNodeMatcherHandler } from '../types';
import { coerceHandler } from '../util';
import { AbstractMatcher } from './abstract-matcher';
import { TreeNodeWalkingMatcher } from './tree-macher';
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

export type StrNodeChildMatcher<Ctx> =
  | StrContentMatcher<Ctx>
  | StrTplMatcher<Ctx>;

export interface StrMatcherOptions<Ctx> {
  matchers: StrNodeChildMatcher<Ctx>[] | null;
  preHandler: TreeNodeMatcherHandler<Ctx> | null;
  postHandler: TreeNodeMatcherHandler<Ctx> | null;
}

export class StrContentMatcher<Ctx> extends AbstractMatcher<Ctx> {
  public readonly content: StrContentMatcherValue;
  public readonly handler: StrContentMatcherHandler<Ctx>;

  constructor({ value, handler }: StrContentMatcherOptions<Ctx>) {
    super();
    this.content = value ?? null;
    this.handler = coerceHandler(handler);
  }

  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const node = cursor.node;
    if (node.type === 'string-value') {
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

export class StrTplMatcher<Ctx> extends TreeNodeWalkingMatcher<
  Ctx,
  TemplateTree
> {
  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor: rootCursor, context: rootContext } = checkpoint;
    const rootNode = rootCursor.node;
    if (rootNode.type === 'template-tree') {
      const cursor = checkpoint.cursor.down;
      if (cursor && cursor.node) {
        const childMatch = this.seekNextChild({
          context: this.preHandler(rootContext, rootNode),
          cursor,
        });

        if (childMatch && !skipMinorTokens(childMatch)) {
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

export class StrNodeMatcher<Ctx> extends AbstractMatcher<Ctx> {
  public matchers: StrNodeChildMatcher<Ctx>[] | null;
  public readonly preHandler: TreeNodeMatcherHandler<Ctx, StringTree>;
  public readonly postHandler: TreeNodeMatcherHandler<Ctx, StringTree>;

  constructor(opts: StrMatcherOptions<Ctx>) {
    super();
    this.matchers = opts.matchers ?? null;
    this.preHandler = coerceHandler(opts.preHandler);
    this.postHandler = coerceHandler(opts.postHandler);
  }

  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const node = checkpoint.cursor.node;
    if (node.type === 'string-tree') {
      let context = this.preHandler(checkpoint.context, node);

      if (this.matchers) {
        let cursor = checkpoint.cursor.down;
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

      context = this.postHandler(context, node);

      const nextCursor = checkpoint.cursor.right;
      return nextCursor
        ? { context, cursor: nextCursor }
        : { context, cursor: checkpoint.cursor, endOfLevel: true };
    }
    return null;
  }
}
