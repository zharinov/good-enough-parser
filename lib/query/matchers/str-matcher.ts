import { StringValueToken } from '../../lexer/types';
import { StringTree, TemplateTree } from '../../parser/types';
import { safeHandler } from '../handler';
import { isRegex } from '../regex';
import type {
  Checkpoint,
  Matcher,
  NodeHandler,
  StrTplOptionsBase,
  StrTreeHandler,
  StrTreeOptionsBase,
} from '../types';
import { AbstractMatcher } from './abstract-matcher';

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
    this.handler = safeHandler<Ctx, StringValueToken>(handler);
  }

  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    let { cursor, context } = checkpoint;
    const node = cursor.node;
    if (node?.type === 'string-value') {
      let isMatched = true;
      if (typeof this.content === 'string') {
        isMatched = this.content === node.value;
      } else if (isRegex(this.content)) {
        isMatched = this.content.test(node.value);
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
    this.preHandler = safeHandler<Ctx, TemplateTree>(config.preHandler);
    this.postHandler = safeHandler<Ctx, TemplateTree>(config.postHandler);
  }

  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor: tplCursor, context: tplContext } = checkpoint;
    const rootNode = tplCursor.node;
    if (rootNode?.type === 'template-tree') {
      let cursor = checkpoint.cursor.down;
      if (cursor && cursor.node) {
        let context = this.preHandler(tplContext, rootNode);
        cursor = this.matcher.seekNext(cursor);
        const match = this.matcher.match({ context, cursor });
        if (match) {
          ({ cursor, context } = match);
          cursor = this.seekNext(cursor);
          if (cursor.node?.type === '_end') {
            context = this.postHandler(context, rootNode);
            cursor = this.moveRight(tplCursor);
            return { context, cursor };
          }
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
    this.preHandler = safeHandler<Ctx, StringTree>(opts.preHandler);
    this.postHandler = safeHandler<Ctx, StringTree>(opts.postHandler);
  }

  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const rootCursor = this.seekNext(checkpoint.cursor);
    const rootNode = rootCursor.node;
    if (rootNode?.type === 'string-tree') {
      let context = this.preHandler(checkpoint.context, rootNode);
      let cursor = rootCursor;

      if (this.matchers) {
        const tokensCount = cursor.children.length - 2;
        if (tokensCount !== this.matchers.length) {
          return null;
        }

        if (tokensCount > 0) {
          cursor = this.moveRight(cursor.down as never);
          for (const matcher of this.matchers) {
            const match = matcher.match({ context, cursor });
            if (!match) {
              return null;
            }
            ({ cursor, context } = match);
          }
        }
      }

      context = this.postHandler(context, rootNode);
      cursor = this.moveRight(rootCursor);
      return { context, cursor };
    }

    return null;
  }
}
