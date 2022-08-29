import { WrappedTree, isTree } from '../../parser';
import type { Cursor, Tree } from '../../parser/types';
import { safeHandler } from '../handler';
import type {
  Checkpoint,
  Matcher,
  TreeMatcherHandler,
  TreeMatcherType,
  TreeOptionsBase,
} from '../types';
import { AbstractMatcher } from './abstract-matcher';

interface TreeMatcherOptions<Ctx> extends TreeOptionsBase<Ctx> {
  matcher: Matcher<Ctx> | null;
}

export class TreeMatcher<Ctx> extends AbstractMatcher<Ctx> {
  public readonly type: TreeMatcherType | null;
  public readonly startsWithValue: string | null;
  public readonly endsWithValue: string | null;
  public readonly matcher: Matcher<Ctx> | null;
  public readonly maxDepth: number;
  public readonly maxMatches: number;
  public readonly preHandler: TreeMatcherHandler<Ctx>;
  public readonly postHandler: TreeMatcherHandler<Ctx>;

  private walkDepth = 0;
  private matchCount = 0;

  constructor(config: TreeMatcherOptions<Ctx>) {
    super();
    this.type = config.type ?? null;
    this.startsWithValue = config.startsWith ?? null;
    this.endsWithValue = config.endsWith ?? null;
    this.matcher = config.matcher;
    this.maxDepth =
      typeof config.maxDepth === 'number' && config.maxDepth > 0
        ? config.maxDepth
        : 1024;
    this.maxMatches =
      typeof config.maxMatches === 'number' && config.maxMatches > 0
        ? config.maxMatches
        : 1024 * 1024;
    this.preHandler = safeHandler<Ctx, Tree>(config.preHandler);
    this.postHandler = safeHandler<Ctx, Tree>(config.postHandler);
  }

  walkToNextSignificantNode(cursor: Cursor): Cursor | undefined {
    const downCursor = cursor.down;
    if (downCursor && this.walkDepth < this.maxDepth) {
      this.walkDepth += 1;
      return downCursor;
    }

    let rightCursor = cursor.right;
    if (rightCursor) {
      rightCursor = this.matcher
        ? this.matcher.seekNext(rightCursor)
        : this.seekNext(rightCursor);
      if (rightCursor) {
        return rightCursor;
      }
    }

    const canMoveUp = this.walkDepth > 1;
    let upperCursor: Cursor | undefined = canMoveUp ? cursor.up : undefined;
    while (upperCursor && canMoveUp) {
      rightCursor = upperCursor.right;
      if (rightCursor) {
        rightCursor = this.matcher
          ? this.matcher.seekNext(rightCursor)
          : this.seekNext(rightCursor);
        if (rightCursor) {
          upperCursor = rightCursor;
          break;
        }
      }
      upperCursor = upperCursor.up;
    }
    if (upperCursor) {
      this.walkDepth -= 1;
      return upperCursor;
    }

    return undefined;
  }

  walkToNextMatch(
    context: Ctx,
    cursor: Cursor | undefined
  ): Checkpoint<Ctx> | undefined {
    if (!cursor || !this.matcher) {
      return undefined;
    }

    let nextCursor = this.walkToNextSignificantNode(cursor);
    while (nextCursor) {
      const match = this.matcher.match({ cursor: nextCursor, context });
      if (match) {
        this.matchCount += 1;
        return match;
      }

      nextCursor = this.walkToNextSignificantNode(nextCursor);
    }

    return undefined;
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    this.walkDepth = 0;
    this.matchCount = 0;

    const rootCursor = this.seekNext(checkpoint.cursor);
    const rootNode = rootCursor.node;
    if (isTree(rootNode)) {
      if (this.type && this.type !== rootNode.type) {
        return null;
      }

      if (this.type === 'wrapped-tree') {
        const currentTree = rootNode as WrappedTree;
        if (
          this.startsWithValue &&
          currentTree.startsWith.value !== this.startsWithValue
        ) {
          return null;
        }

        if (
          this.endsWithValue &&
          currentTree.endsWith.value !== this.endsWithValue
        ) {
          return null;
        }
      }

      let context = checkpoint.context;

      context = this.preHandler(context, rootNode);
      if (this.matcher) {
        let nextMatch = this.walkToNextMatch(context, rootCursor);
        while (nextMatch) {
          context = nextMatch.context;
          if (this.matchCount === this.maxMatches) {
            break;
          }
          nextMatch = this.walkToNextMatch(context, nextMatch.cursor);
        }

        if (this.matchCount === 0) {
          return null;
        }
      }
      context = this.postHandler(context, rootNode);

      const cursor =
        rootNode.type === 'root-tree' ? rootCursor : this.moveRight(rootCursor);
      return { context, cursor };
    }

    return null;
  }
}
