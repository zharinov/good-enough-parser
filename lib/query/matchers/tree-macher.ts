import type {
  Checkpoint,
  Matcher,
  TreeNodeMatcherHandler,
  TreeNodeMatcherOptions,
  TreeNodeMatcherType,
} from '../types';
import { AbstractMatcher } from './abstract-matcher';

export class TreeNodeMatcher<Ctx> extends AbstractMatcher<Ctx> {
  public readonly type: TreeNodeMatcherType;
  public readonly matcher: Matcher<Ctx> | null;
  public readonly preHandler: TreeNodeMatcherHandler<Ctx> | null;
  public readonly postHandler: TreeNodeMatcherHandler<Ctx> | null;

  constructor(config: TreeNodeMatcherOptions<Ctx>) {
    super();
    this.matcher = config.matcher ?? null;
    this.type = config.type ?? null;
    this.preHandler = config.preHandler ?? null;
    this.postHandler = config.postHandler ?? null;
  }

  match(_checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null {
    return null;
  }
}

export class TreeAnyChildMatcher<Ctx> extends TreeNodeMatcher<Ctx> {}
export class TreeAllChildrenMatcher<Ctx> extends TreeNodeMatcher<Ctx> {}

export class TreeOneDescendantMatcher<Ctx> extends TreeNodeMatcher<Ctx> {}
export class TreeAllDescendantsMatcher<Ctx> extends TreeNodeMatcher<Ctx> {}
