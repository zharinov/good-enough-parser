import type { TreeType } from '../parser/types';
import {
  AltMatcher,
  ManyMatcher,
  OpMatcher,
  SeqMatcher,
  SymMatcher,
} from './matchers';
import { AbstractTreeMatcher } from './matchers/abstract-tree-matcher';
import { NumMatcher } from './matchers/num-matcher';
import {
  TreeAllChildrenMatcher,
  TreeAllDescendantsMatcher,
  TreeFirstChildMatcher,
  TreeFirstDescendantMatcher,
  TreeNodeMatcher,
} from './matchers/tree-macher';
import type {
  Matcher,
  NumMatcherHandler,
  NumMatcherOptions,
  NumMatcherValue,
  OpMatcherHandler,
  OpMatcherOptions,
  OpMatcherValue,
  SymMatcherHandler,
  SymMatcherOptions,
  SymMatcherValue,
  TreeNodeMatcherHandler,
  TreeNodeMatcherType,
} from './types';

abstract class AbstractBuilder<Ctx> {
  abstract build(): Matcher<Ctx>;

  sym(): SeqBuilder<Ctx>;
  sym(value: SymMatcherValue): SeqBuilder<Ctx>;
  sym(handler: SymMatcherHandler<Ctx>): SeqBuilder<Ctx>;
  sym(value: SymMatcherValue, handler: SymMatcherHandler<Ctx>): SeqBuilder<Ctx>;
  sym(opts: SymMatcherOptions<Ctx>): SeqBuilder<Ctx>;
  sym(
    arg1?: SymMatcherValue | SymMatcherOptions<Ctx> | SymMatcherHandler<Ctx>,
    arg2?: SymMatcherHandler<Ctx>
  ): SeqBuilder<Ctx> {
    const opts = coerceSymOptions<Ctx>(arg1, arg2);
    const builder = new SymBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  op(): SeqBuilder<Ctx>;
  op(value: OpMatcherValue): SeqBuilder<Ctx>;
  op(handler: OpMatcherHandler<Ctx>): SeqBuilder<Ctx>;
  op(value: OpMatcherValue, handler: OpMatcherHandler<Ctx>): SeqBuilder<Ctx>;
  op(opts: OpMatcherOptions<Ctx>): SeqBuilder<Ctx>;
  op(
    arg1?: OpMatcherValue | OpMatcherOptions<Ctx> | OpMatcherHandler<Ctx>,
    arg2?: OpMatcherHandler<Ctx>
  ): SeqBuilder<Ctx> {
    const opts = coerceOpOptions(arg1, arg2);
    const builder = new OpBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  num(): SeqBuilder<Ctx>;
  num(value: NumMatcherValue): SeqBuilder<Ctx>;
  num(handler: NumMatcherHandler<Ctx>): SeqBuilder<Ctx>;
  num(value: NumMatcherValue, handler: NumMatcherHandler<Ctx>): SeqBuilder<Ctx>;
  num(opts: NumMatcherOptions<Ctx>): SeqBuilder<Ctx>;
  num(
    arg1?: NumMatcherValue | NumMatcherOptions<Ctx> | NumMatcherHandler<Ctx>,
    arg2?: NumMatcherHandler<Ctx>
  ): SeqBuilder<Ctx> {
    const opts = coerceNumOptions<Ctx>(arg1, arg2);
    const builder = new NumBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  many(builder: AbstractBuilder<Ctx>): SeqBuilder<Ctx>;
  many(
    builder: AbstractBuilder<Ctx>,
    min: number,
    max: number
  ): SeqBuilder<Ctx>;
  many(
    arg1: AbstractBuilder<Ctx>,
    arg2?: number,
    arg3?: number
  ): SeqBuilder<Ctx> {
    const opts = coerceManyOptions<Ctx>(arg1, arg2, arg3);
    const builder = new ManyBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  opt(innerBuilder: AbstractBuilder<Ctx>): SeqBuilder<Ctx> {
    const opts = coerceManyOptions<Ctx>(innerBuilder, 0, 1);
    const builder = new ManyBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  alt(...alts: AbstractBuilder<Ctx>[]): SeqBuilder<Ctx> {
    const builder = new AltBuilder<Ctx>(alts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  tree(): SeqBuilder<Ctx>;
  tree(type: TreeType): SeqBuilder<Ctx>;
  tree(arg1?: TreeBuilderOptions<Ctx> | TreeType): SeqBuilder<Ctx> {
    const opts = coerceTreeOptions(arg1);
    const builder = new TreeBuilder(opts);
    return new SeqBuilder<Ctx>(this, builder);
  }
}

// Sequence

export class SeqBuilder<Ctx> extends AbstractBuilder<Ctx> {
  private readonly builders: AbstractBuilder<Ctx>[];

  constructor(prev: AbstractBuilder<Ctx>, next: AbstractBuilder<Ctx>) {
    super();
    const prevSeq = prev instanceof SeqBuilder ? prev.builders : [prev];
    this.builders = [...prevSeq, next];
  }

  build(): SeqMatcher<Ctx> {
    const matchers = this.builders.map((builder) => builder.build());
    return new SeqMatcher<Ctx>({ matchers });
  }
}

// Symbols

export class SymBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: SymMatcherOptions<Ctx>) {
    super();
  }

  build(): SymMatcher<Ctx> {
    return new SymMatcher<Ctx>(this.opts);
  }
}

function coerceSymOptions<Ctx>(
  arg1?: SymMatcherValue | SymMatcherOptions<Ctx> | SymMatcherHandler<Ctx>,
  arg2?: SymMatcherHandler<Ctx>
): SymMatcherOptions<Ctx> {
  if (typeof arg1 === 'string' || arg1 instanceof RegExp) {
    return {
      value: arg1,
      handler: arg2 ?? null,
    };
  }

  if (typeof arg1 === 'function') {
    return {
      value: null,
      handler: arg1,
    };
  }

  if (arg1 !== null && typeof arg1 === 'object') {
    return arg1;
  }

  return { value: null, handler: null };
}

export function sym<Ctx>(): SymBuilder<Ctx>;
export function sym<Ctx>(value: SymMatcherValue): SymBuilder<Ctx>;
export function sym<Ctx>(handler: SymMatcherHandler<Ctx>): SymBuilder<Ctx>;
export function sym<Ctx>(
  value: SymMatcherValue,
  handler: SymMatcherHandler<Ctx>
): SymBuilder<Ctx>;
export function sym<Ctx>(opts: SymMatcherOptions<Ctx>): SymBuilder<Ctx>;
export function sym<Ctx>(
  arg1?: SymMatcherValue | SymMatcherOptions<Ctx> | SymMatcherHandler<Ctx>,
  arg2?: SymMatcherHandler<Ctx>
): SymBuilder<Ctx> {
  const opts = coerceSymOptions<Ctx>(arg1, arg2);
  return new SymBuilder<Ctx>(opts);
}

// Operators

export class OpBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: OpMatcherOptions<Ctx>) {
    super();
  }

  build(): OpMatcher<Ctx> {
    return new OpMatcher<Ctx>(this.opts);
  }
}

function coerceOpOptions<Ctx>(
  arg1?: OpMatcherValue | OpMatcherOptions<Ctx> | OpMatcherHandler<Ctx>,
  arg2?: OpMatcherHandler<Ctx>
): OpMatcherOptions<Ctx> {
  if (typeof arg1 === 'string' || arg1 instanceof RegExp) {
    return {
      value: arg1,
      handler: arg2 ?? null,
    };
  }

  if (typeof arg1 === 'function') {
    return {
      value: null,
      handler: arg1,
    };
  }

  if (arg1 !== null && typeof arg1 === 'object') {
    return arg1;
  }

  return { value: null, handler: null };
}

export function op<Ctx>(): OpBuilder<Ctx>;
export function op<Ctx>(value: OpMatcherValue): OpBuilder<Ctx>;
export function op<Ctx>(handler: OpMatcherHandler<Ctx>): OpBuilder<Ctx>;
export function op<Ctx>(
  value: OpMatcherValue,
  handler: OpMatcherHandler<Ctx>
): OpBuilder<Ctx>;
export function op<Ctx>(opts: OpMatcherOptions<Ctx>): OpBuilder<Ctx>;
export function op<Ctx>(
  arg1?: OpMatcherValue | OpMatcherOptions<Ctx> | OpMatcherHandler<Ctx>,
  arg2?: OpMatcherHandler<Ctx>
): OpBuilder<Ctx> {
  const opts = coerceOpOptions<Ctx>(arg1, arg2);
  return new OpBuilder<Ctx>(opts);
}

// Numbers

export class NumBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: NumMatcherOptions<Ctx>) {
    super();
  }

  build(): NumMatcher<Ctx> {
    return new NumMatcher<Ctx>(this.opts);
  }
}

function coerceNumOptions<Ctx>(
  arg1?: NumMatcherValue | NumMatcherOptions<Ctx> | NumMatcherHandler<Ctx>,
  arg2?: NumMatcherHandler<Ctx>
): NumMatcherOptions<Ctx> {
  if (typeof arg1 === 'string' || arg1 instanceof RegExp) {
    return {
      value: arg1,
      handler: arg2 ?? null,
    };
  }

  if (typeof arg1 === 'function') {
    return {
      value: null,
      handler: arg1,
    };
  }

  if (arg1 !== null && typeof arg1 === 'object') {
    return arg1;
  }

  return { value: null, handler: null };
}

export function num<Ctx>(): NumBuilder<Ctx>;
export function num<Ctx>(value: NumMatcherValue): NumBuilder<Ctx>;
export function num<Ctx>(handler: NumMatcherHandler<Ctx>): NumBuilder<Ctx>;
export function num<Ctx>(
  value: NumMatcherValue,
  handler: NumMatcherHandler<Ctx>
): NumBuilder<Ctx>;
export function num<Ctx>(opts: NumMatcherOptions<Ctx>): NumBuilder<Ctx>;
export function num<Ctx>(
  arg1?: NumMatcherValue | NumMatcherOptions<Ctx> | NumMatcherHandler<Ctx>,
  arg2?: NumMatcherHandler<Ctx>
): NumBuilder<Ctx> {
  const opts = coerceNumOptions<Ctx>(arg1, arg2);
  return new NumBuilder<Ctx>(opts);
}

// Repetitive patterns

export interface ManyBuilderOpts<Ctx> {
  builder: AbstractBuilder<Ctx>;
  min: number;
  max: number | null;
}

export class ManyBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: ManyBuilderOpts<Ctx>) {
    super();
  }

  build(): ManyMatcher<Ctx> {
    const matcher = this.opts.builder.build();
    return new ManyMatcher<Ctx>({ ...this.opts, matcher });
  }
}

function coerceManyOptions<Ctx>(
  builder: AbstractBuilder<Ctx>,
  arg2?: number,
  arg3?: number
): ManyBuilderOpts<Ctx> {
  if (typeof arg2 === 'number' && typeof arg3 === 'number') {
    return { builder, min: arg2, max: arg3 };
  }
  return { builder, min: 1, max: null };
}

export function many<Ctx>(builder: AbstractBuilder<Ctx>): ManyBuilder<Ctx>;
export function many<Ctx>(
  builder: AbstractBuilder<Ctx>,
  min: number,
  max: number
): ManyBuilder<Ctx>;
export function many<Ctx>(
  arg1: AbstractBuilder<Ctx>,
  arg2?: number,
  arg3?: number
): ManyBuilder<Ctx> {
  const opts = coerceManyOptions<Ctx>(arg1, arg2, arg3);
  return new ManyBuilder<Ctx>(opts);
}

export function opt<Ctx>(builder: AbstractBuilder<Ctx>): ManyBuilder<Ctx> {
  const opts = coerceManyOptions<Ctx>(builder, 0, 1);
  return new ManyBuilder<Ctx>(opts);
}

// Alternatives

export class AltBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private builders: AbstractBuilder<Ctx>[]) {
    super();
  }

  build(): AltMatcher<Ctx> {
    const matchers = this.builders.map((alt) => alt.build());
    return new AltMatcher<Ctx>({ matchers });
  }
}

export function alt<Ctx>(...builders: AbstractBuilder<Ctx>[]): AltBuilder<Ctx> {
  return new AltBuilder<Ctx>(builders);
}

// Trees

export interface TreeNodeBuilderOptions<Ctx> {
  type: TreeNodeMatcherType;
  preHandler?: TreeNodeMatcherHandler<Ctx>;
  postHandler?: TreeNodeMatcherHandler<Ctx>;
}

export interface TreeFirstChildBuilderOptions<Ctx>
  extends TreeNodeBuilderOptions<Ctx> {
  firstChild: AbstractBuilder<Ctx>;
}

export interface TreeAllChildrenBuilderOptions<Ctx>
  extends TreeNodeBuilderOptions<Ctx> {
  allChildren: AbstractBuilder<Ctx>;
}

export interface TreeFirstDescendantBuilderOptions<Ctx>
  extends TreeNodeBuilderOptions<Ctx> {
  firstDescendant: AbstractBuilder<Ctx>;
}

export interface TreeAllDescendantsBuilderOptions<Ctx>
  extends TreeNodeBuilderOptions<Ctx> {
  allDescendants: AbstractBuilder<Ctx>;
}

export type TreeBuilderOptions<Ctx> =
  | TreeNodeBuilderOptions<Ctx>
  | TreeFirstChildBuilderOptions<Ctx>
  | TreeAllChildrenBuilderOptions<Ctx>
  | TreeFirstDescendantBuilderOptions<Ctx>
  | TreeAllDescendantsBuilderOptions<Ctx>;

function isFirstChildTree<Ctx>(
  opts: TreeBuilderOptions<Ctx>
): opts is TreeFirstChildBuilderOptions<Ctx> {
  return !!(opts as TreeFirstChildBuilderOptions<Ctx>)?.firstChild;
}

function isAllChildrenTree<Ctx>(
  opts: TreeBuilderOptions<Ctx>
): opts is TreeAllChildrenBuilderOptions<Ctx> {
  return !!(opts as TreeAllChildrenBuilderOptions<Ctx>)?.allChildren;
}

function isFirstDescendantTree<Ctx>(
  opts: TreeBuilderOptions<Ctx>
): opts is TreeFirstDescendantBuilderOptions<Ctx> {
  return !!(opts as TreeFirstDescendantBuilderOptions<Ctx>)?.firstDescendant;
}

function isAllDescendantsTree<Ctx>(
  opts: TreeBuilderOptions<Ctx>
): opts is TreeAllDescendantsBuilderOptions<Ctx> {
  return !!(opts as TreeAllDescendantsBuilderOptions<Ctx>)?.allDescendants;
}

export class TreeBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: TreeBuilderOptions<Ctx>) {
    super();
  }

  build(): AbstractTreeMatcher<Ctx> {
    if (isFirstChildTree<Ctx>(this.opts)) {
      const matcher = this.opts.firstChild.build();
      return new TreeFirstChildMatcher<Ctx>({ matcher, ...this.opts });
    } else if (isAllChildrenTree<Ctx>(this.opts)) {
      const matcher = this.opts.allChildren.build();
      return new TreeAllChildrenMatcher<Ctx>({ matcher, ...this.opts });
    } else if (isFirstDescendantTree<Ctx>(this.opts)) {
      const matcher = this.opts.firstDescendant.build();
      return new TreeFirstDescendantMatcher<Ctx>({ matcher, ...this.opts });
    } else if (isAllDescendantsTree<Ctx>(this.opts)) {
      const matcher = this.opts.allDescendants.build();
      return new TreeAllDescendantsMatcher<Ctx>({ matcher, ...this.opts });
    } else {
      return new TreeNodeMatcher(this.opts);
    }
  }
}

function coerceTreeOptions<Ctx>(
  arg1: TreeBuilderOptions<Ctx> | TreeType | undefined
): TreeBuilderOptions<Ctx> {
  if (typeof arg1 === 'string') {
    return { type: arg1 };
  } else if (!arg1) {
    return { type: null };
  } else {
    return arg1;
  }
}

export function tree<Ctx>(): TreeBuilder<Ctx>;
export function tree<Ctx>(type: TreeType): TreeBuilder<Ctx>;
export function tree<Ctx>(
  arg1?: TreeBuilderOptions<Ctx> | TreeType
): TreeBuilder<Ctx> {
  const opts = coerceTreeOptions(arg1);
  return new TreeBuilder(opts);
}
