import type {
  StrMatcherOptions,
  StrMatcherValue,
  TreeNodeMatcherHandler,
} from '../types';
import { TreeNodeMatcher } from './tree-macher';

export class StrMatcher<Ctx> extends TreeNodeMatcher<Ctx> {
  public matchers: StrMatcherValue<Ctx>[] | null;
  public readonly postHandler: TreeNodeMatcherHandler<Ctx> | null;

  constructor(opts: StrMatcherOptions<Ctx>) {
    super({ ...opts, type: 'string-tree' });
    this.matchers = opts.matchers ?? null;
    this.postHandler = opts.postHandler ?? null;
  }
}
