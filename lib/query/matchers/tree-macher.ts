import { isTree } from '../../parser';
import type {
  Checkpoint,
  Matcher,
  TreeNodeMatcherHandler,
  TreeNodeMatcherOptions,
  TreeNodeMatcherType,
  TreeNodeWalkingMatcherOptions,
} from '../types';
import { AbstractMatcher } from './abstract-matcher';
import { skipMinorTokens } from './util';

export class TreeNodeMatcher<Ctx> extends AbstractMatcher<Ctx> {
  public readonly type: TreeNodeMatcherType;
  public readonly preHandler: TreeNodeMatcherHandler<Ctx> | null;

  constructor(config: TreeNodeMatcherOptions<Ctx>) {
    super();
    this.type = config.type ?? null;
    this.preHandler = config.preHandler ?? null;
  }

  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const { cursor, context } = checkpoint;
    const node = cursor.node;
    if (isTree(node)) {
      const isMatched = this.type ? node.type === this.type : true;
      if (isMatched) {
        const nextContext = this.preHandler
          ? this.preHandler(context, node)
          : context;
        const nextCursor = cursor.right;
        return nextCursor
          ? { context: nextContext, cursor: nextCursor }
          : { context: nextContext, cursor, endOfLevel: true };
      }
    }
    return null;
  }
}

class TreeNodeWalkingMatcher<Ctx> extends TreeNodeMatcher<Ctx> {
  public readonly matcher: Matcher<Ctx>;
  public readonly postHandler: TreeNodeMatcherHandler<Ctx> | null;

  constructor(config: TreeNodeWalkingMatcherOptions<Ctx>) {
    super(config);
    this.matcher = config.matcher;
    this.postHandler = config.postHandler ?? null;
  }

  seekNextChild(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    let nextCheckpoint = skipMinorTokens(checkpoint);
    while (nextCheckpoint) {
      const checkpoint = this.matcher.match(nextCheckpoint);
      if (checkpoint) {
        return checkpoint;
      }

      const nextCursor = nextCheckpoint?.cursor?.right;
      nextCheckpoint = nextCursor
        ? skipMinorTokens({
            cursor: nextCursor,
            context: nextCheckpoint.context,
          })
        : null;
    }

    return null;
  }
}

export class TreeAnyChildMatcher<Ctx> extends TreeNodeWalkingMatcher<Ctx> {
  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const treeMatch = super.match(checkpoint);
    if (treeMatch) {
      const { context } = treeMatch;
      const cursor = checkpoint.cursor.down;
      if (cursor && cursor.node) {
        const childMatch = this.seekNextChild({ context, cursor });
        if (childMatch) {
          return { ...treeMatch, context: childMatch.context };
        }
      }
    }
    return null;
  }
}

export class TreeManyChildrenMatcher<Ctx> extends TreeNodeWalkingMatcher<Ctx> {
  override match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    const treeMatch = super.match(checkpoint);
    if (treeMatch) {
      let { context } = treeMatch;
      let cursor = checkpoint.cursor.down;
      while (cursor) {
        const childMatch = this.seekNextChild({ context, cursor });
        if (childMatch) {
          context = childMatch.context;
          if (!childMatch.endOfLevel) {
            cursor = childMatch.cursor;
          } else {
            break;
          }
        } else {
          break;
        }
      }

      if (context !== treeMatch.context) {
        return { ...treeMatch, context };
      }
    }
    return null;
  }
}
