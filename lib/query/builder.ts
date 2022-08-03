import type { TreeType } from '../parser/types';
import {
  AltMatcher,
  ManyMatcher,
  OpMatcher,
  SeqMatcher,
  SymMatcher,
} from './matchers';
import { BeginMatcher, EndMatcher } from './matchers/anchor-matcher';
import { CommentMatcher } from './matchers/comment-matcher';
import { NumMatcher } from './matchers/num-matcher';
import {
  StrContentMatcher,
  StrContentMatcherHandler,
  StrNodeChildMatcher,
  StrNodeMatcher,
  StrTplMatcher,
} from './matchers/str-matcher';
import { TreeMatcher } from './matchers/tree-matcher';
import {
  coerceCommentOptions,
  coerceManyOptions,
  coerceNumOptions,
  coerceOpOptions,
  coerceStrOptions,
  coerceSymOptions,
  coerceTreeOptions,
} from './options';
import { isRegex } from './regex';
import type {
  CommentMatcherHandler,
  CommentMatcherOptions,
  CommentMatcherValue,
  ManyBuilderOpts,
  Matcher,
  NumMatcherHandler,
  NumMatcherOptions,
  NumMatcherValue,
  OpMatcherHandler,
  OpMatcherOptions,
  OpMatcherValue,
  QueryBuilder,
  StrBuilderOptions,
  StrTreeBuilderOptions,
  StrTreeBuilderOptionsBase,
  SymMatcherHandler,
  SymMatcherOptions,
  SymMatcherValue,
  TreeBuilderOptions,
} from './types';

abstract class TerminalBuilder<Ctx> implements QueryBuilder<Ctx> {
  abstract build(): Matcher<Ctx>;
}

abstract class AbstractBuilder<Ctx> extends TerminalBuilder<Ctx> {
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

  comment(): SeqBuilder<Ctx>;
  comment(value: CommentMatcherValue): SeqBuilder<Ctx>;
  comment(handler: CommentMatcherHandler<Ctx>): SeqBuilder<Ctx>;
  comment(
    value: CommentMatcherValue,
    handler: CommentMatcherHandler<Ctx>
  ): SeqBuilder<Ctx>;
  comment(opts: CommentMatcherOptions<Ctx>): SeqBuilder<Ctx>;
  comment(
    arg1?:
      | CommentMatcherValue
      | CommentMatcherOptions<Ctx>
      | CommentMatcherHandler<Ctx>,
    arg2?: CommentMatcherHandler<Ctx>
  ): SeqBuilder<Ctx> {
    const opts = coerceCommentOptions<Ctx>(arg1, arg2);
    const builder = new CommentBuilder<Ctx>(opts);
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

  many(builder: QueryBuilder<Ctx>): SeqBuilder<Ctx>;
  many(builder: QueryBuilder<Ctx>, min: number, max: number): SeqBuilder<Ctx>;
  many(arg1: QueryBuilder<Ctx>, arg2?: number, arg3?: number): SeqBuilder<Ctx> {
    const opts = coerceManyOptions<Ctx>(arg1, arg2, arg3);
    const builder = new ManyBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  opt(innerBuilder: QueryBuilder<Ctx>): SeqBuilder<Ctx> {
    const opts = coerceManyOptions<Ctx>(innerBuilder, 0, 1);
    const builder = new ManyBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  alt(...alts: QueryBuilder<Ctx>[]): SeqBuilder<Ctx> {
    const builder = new AltBuilder<Ctx>(alts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  tree(): SeqBuilder<Ctx>;
  tree(type: TreeType): SeqBuilder<Ctx>;
  tree(opts: TreeBuilderOptions<Ctx>): SeqBuilder<Ctx>;
  tree(arg1?: TreeBuilderOptions<Ctx> | TreeType): SeqBuilder<Ctx> {
    const opts = coerceTreeOptions(arg1);
    const builder = new TreeBuilder(opts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  str(): SeqBuilder<Ctx>;
  str(handler: StrContentMatcherHandler<Ctx>): SeqBuilder<Ctx>;
  str(exact: string, handler?: StrContentMatcherHandler<Ctx>): SeqBuilder<Ctx>;
  str(
    pattern: RegExp,
    handler?: StrContentMatcherHandler<Ctx>
  ): SeqBuilder<Ctx>;
  str(opts: StrTreeBuilderOptions<Ctx>): SeqBuilder<Ctx>;
  str(
    arg1?:
      | string
      | RegExp
      | StrTreeBuilderOptions<Ctx>
      | StrContentMatcherHandler<Ctx>,
    arg2?: StrContentMatcherHandler<Ctx>
  ): SeqBuilder<Ctx> {
    const opts = coerceStrOptions<Ctx>(arg1, arg2);
    const builder = new StrBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx>(this, builder);
  }

  end(): EndBuilder<Ctx> {
    return new EndBuilder(this);
  }
}

// Anchors

class BeginBuilder<Ctx> extends AbstractBuilder<Ctx> {
  build(): BeginMatcher<Ctx> {
    return new BeginMatcher<Ctx>();
  }
}

class EndBuilder<Ctx> extends TerminalBuilder<Ctx> {
  constructor(private readonly builder: QueryBuilder<Ctx>) {
    super();
  }

  build(): SeqMatcher<Ctx> {
    const matcher = this.builder.build();
    const matchers = matcher instanceof SeqMatcher ? matcher.seq : [matcher];
    matchers.push(new EndMatcher());
    return new SeqMatcher<Ctx>({ matchers });
  }
}

export function begin<Ctx>(): BeginBuilder<Ctx> {
  return new BeginBuilder<Ctx>();
}

// Sequence

class SeqBuilder<Ctx> extends AbstractBuilder<Ctx> {
  private readonly builders: QueryBuilder<Ctx>[];

  constructor(prev: QueryBuilder<Ctx>, next: QueryBuilder<Ctx>) {
    super();
    const prevSeq =
      prev instanceof SeqBuilder
        ? (prev.builders as QueryBuilder<Ctx>[])
        : [prev];
    this.builders = [...prevSeq, next];
  }

  build(): SeqMatcher<Ctx> {
    const matchers = this.builders.map((builder) => builder.build());
    return new SeqMatcher<Ctx>({ matchers });
  }
}

// Symbols

class SymBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: SymMatcherOptions<Ctx>) {
    super();
  }

  build(): SymMatcher<Ctx> {
    return new SymMatcher<Ctx>(this.opts);
  }
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

class OpBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: OpMatcherOptions<Ctx>) {
    super();
  }

  build(): OpMatcher<Ctx> {
    return new OpMatcher<Ctx>(this.opts);
  }
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

// Comments

class CommentBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: CommentMatcherOptions<Ctx>) {
    super();
  }

  build(): CommentMatcher<Ctx> {
    return new CommentMatcher<Ctx>(this.opts);
  }
}

export function comment<Ctx>(): CommentBuilder<Ctx>;
export function comment<Ctx>(value: CommentMatcherValue): CommentBuilder<Ctx>;
export function comment<Ctx>(
  handler: CommentMatcherHandler<Ctx>
): CommentBuilder<Ctx>;
export function comment<Ctx>(
  value: CommentMatcherValue,
  handler: CommentMatcherHandler<Ctx>
): CommentBuilder<Ctx>;
export function comment<Ctx>(
  opts: CommentMatcherOptions<Ctx>
): CommentBuilder<Ctx>;
export function comment<Ctx>(
  arg1?:
    | CommentMatcherValue
    | CommentMatcherOptions<Ctx>
    | CommentMatcherHandler<Ctx>,
  arg2?: CommentMatcherHandler<Ctx>
): CommentBuilder<Ctx> {
  const opts = coerceCommentOptions<Ctx>(arg1, arg2);
  return new CommentBuilder<Ctx>(opts);
}

// Numbers

class NumBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: NumMatcherOptions<Ctx>) {
    super();
  }

  build(): NumMatcher<Ctx> {
    return new NumMatcher<Ctx>(this.opts);
  }
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

class ManyBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: ManyBuilderOpts<Ctx>) {
    super();
  }

  build(): ManyMatcher<Ctx> {
    const matcher = this.opts.builder.build();
    return new ManyMatcher<Ctx>({ ...this.opts, matcher });
  }
}

export function many<Ctx>(builder: QueryBuilder<Ctx>): ManyBuilder<Ctx>;
export function many<Ctx>(
  builder: QueryBuilder<Ctx>,
  min: number,
  max: number
): ManyBuilder<Ctx>;
export function many<Ctx>(
  arg1: QueryBuilder<Ctx>,
  arg2?: number,
  arg3?: number
): ManyBuilder<Ctx> {
  const opts = coerceManyOptions<Ctx>(arg1, arg2, arg3);
  return new ManyBuilder<Ctx>(opts);
}

export function opt<Ctx>(builder: QueryBuilder<Ctx>): ManyBuilder<Ctx> {
  const opts = coerceManyOptions<Ctx>(builder, 0, 1);
  return new ManyBuilder<Ctx>(opts);
}

// Alternatives

class AltBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private builders: QueryBuilder<Ctx>[]) {
    super();
  }

  build(): AltMatcher<Ctx> {
    const matchers = this.builders.map((alt) => alt.build());
    return new AltMatcher<Ctx>({ matchers });
  }
}

export function alt<Ctx>(...builders: QueryBuilder<Ctx>[]): AltBuilder<Ctx> {
  return new AltBuilder<Ctx>(builders);
}

// Trees

class TreeBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: TreeBuilderOptions<Ctx>) {
    super();
  }

  build(): TreeMatcher<Ctx> {
    const builderOpts = this.opts;
    const matcher = builderOpts.search ? builderOpts.search.build() : null;
    const matcherOpts = { ...builderOpts, matcher } as never;
    return new TreeMatcher<Ctx>(matcherOpts);
  }
}

export function tree<Ctx>(): TreeBuilder<Ctx>;
export function tree<Ctx>(type: TreeType): TreeBuilder<Ctx>;
export function tree<Ctx>(opts: TreeBuilderOptions<Ctx>): TreeBuilder<Ctx>;
export function tree<Ctx>(
  arg1?: TreeBuilderOptions<Ctx> | TreeType
): TreeBuilder<Ctx> {
  const opts = coerceTreeOptions(arg1);
  return new TreeBuilder(opts);
}

// Strings

class StrBuilder<Ctx> extends AbstractBuilder<Ctx> {
  constructor(private opts: StrBuilderOptions<Ctx>) {
    super();
  }

  build(): StrNodeMatcher<Ctx> {
    if (this.opts.type === 'str-content') {
      return new StrNodeMatcher<Ctx>({
        matchers: [
          new StrContentMatcher<Ctx>({
            value: this.opts.match ?? null,
            handler: this.opts.handler ?? null,
          }),
        ],
        preHandler: null,
        postHandler: null,
      });
    }

    if (this.opts.match) {
      const matchers: StrNodeChildMatcher<Ctx>[] = [];
      this.opts.match.forEach((m) => {
        if (typeof m === 'string' || isRegex(m)) {
          const contentMatcher = new StrContentMatcher<Ctx>({
            value: m,
            handler: null,
          });
          matchers.push(contentMatcher);
        } else if (m instanceof StrBuilder) {
          const childStrMatcher = m.build() as StrNodeMatcher<Ctx>;
          if (childStrMatcher.matchers) {
            matchers.push(...childStrMatcher.matchers);
          }
        } else if (m instanceof StrTplMatcher) {
          matchers.push(m);
        } else {
          const tplMatcher = new StrTplMatcher<Ctx>({
            matcher: m.build(),
            preHandler: null,
            postHandler: null,
          });
          matchers.push(tplMatcher);
        }
      });

      return new StrNodeMatcher<Ctx>({
        matchers: matchers,
        preHandler: this.opts.preHandler ?? null,
        postHandler: this.opts.postHandler ?? null,
      });
    }

    return new StrNodeMatcher<Ctx>({
      matchers: null,
      preHandler: this.opts.preHandler ?? null,
      postHandler: this.opts.postHandler ?? null,
    });
  }
}

export function str<Ctx>(): StrBuilder<Ctx>;
export function str<Ctx>(
  handler: StrContentMatcherHandler<Ctx>
): StrBuilder<Ctx>;
export function str<Ctx>(
  exact: string,
  handler?: StrContentMatcherHandler<Ctx>
): StrBuilder<Ctx>;
export function str<Ctx>(
  pattern: RegExp,
  handler?: StrContentMatcherHandler<Ctx>
): StrBuilder<Ctx>;
export function str<Ctx>(opts: StrTreeBuilderOptionsBase<Ctx>): StrBuilder<Ctx>;
export function str<Ctx>(
  arg1?:
    | string
    | RegExp
    | StrTreeBuilderOptionsBase<Ctx>
    | StrContentMatcherHandler<Ctx>,
  arg2?: StrContentMatcherHandler<Ctx>
): StrBuilder<Ctx> {
  const opts = coerceStrOptions<Ctx>(arg1, arg2);
  return new StrBuilder<Ctx>(opts);
}

export function buildRoot<Ctx>(builder: QueryBuilder<Ctx>): Matcher<Ctx> {
  const matcher = builder.build();
  return matcher instanceof TreeMatcher && matcher.type === 'root-tree'
    ? matcher
    : new TreeMatcher({ matcher, type: 'root-tree' });
}
