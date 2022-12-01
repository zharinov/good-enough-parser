import type {
  CommentToken,
  EndToken,
  NumberToken,
  OperatorToken,
  StartToken,
  SymbolToken,
} from '../lexer';
import type { Node, StringTree, Tree, TreeType } from '../parser/types';
import {
  AltMatcher,
  ManyMatcher,
  OpMatcher,
  SeqMatcher,
  SymMatcher,
} from './matchers';
import {
  BeginMatcher,
  EndMatcher,
  VoidMatcher,
} from './matchers/anchor-matcher';
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

abstract class TerminalBuilder<Ctx, T extends Node>
  implements QueryBuilder<Ctx, T>
{
  abstract build(): Matcher<Ctx>;

  handler(fn: (context: Ctx, t: T) => Ctx): SeqBuilder<Ctx, T> {
    const voidMatcher = new VoidBuilder<Ctx, T>(fn);
    const builder = new SeqBuilder<Ctx, T>(this, voidMatcher);
    return builder;
  }
}

abstract class AbstractBuilder<Ctx, T extends Node> extends TerminalBuilder<
  Ctx,
  T
> {
  sym(): SeqBuilder<Ctx, SymbolToken>;
  sym(value: SymMatcherValue): SeqBuilder<Ctx, SymbolToken>;
  sym(handler: SymMatcherHandler<Ctx>): SeqBuilder<Ctx, SymbolToken>;
  sym(
    value: SymMatcherValue,
    handler: SymMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, SymbolToken>;
  sym(opts: SymMatcherOptions<Ctx>): SeqBuilder<Ctx, SymbolToken>;
  sym(
    arg1?: SymMatcherValue | SymMatcherOptions<Ctx> | SymMatcherHandler<Ctx>,
    arg2?: SymMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, SymbolToken> {
    const opts = coerceSymOptions<Ctx>(arg1, arg2);
    const builder = new SymBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx, SymbolToken>(this, builder);
  }

  op(): SeqBuilder<Ctx, OperatorToken>;
  op(value: OpMatcherValue): SeqBuilder<Ctx, OperatorToken>;
  op(handler: OpMatcherHandler<Ctx>): SeqBuilder<Ctx, OperatorToken>;
  op(
    value: OpMatcherValue,
    handler: OpMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, OperatorToken>;
  op(opts: OpMatcherOptions<Ctx>): SeqBuilder<Ctx, OperatorToken>;
  op(
    arg1?: OpMatcherValue | OpMatcherOptions<Ctx> | OpMatcherHandler<Ctx>,
    arg2?: OpMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, OperatorToken> {
    const opts = coerceOpOptions(arg1, arg2);
    const builder = new OpBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx, OperatorToken>(this, builder);
  }

  comment(): SeqBuilder<Ctx, CommentToken>;
  comment(value: CommentMatcherValue): SeqBuilder<Ctx, CommentToken>;
  comment(handler: CommentMatcherHandler<Ctx>): SeqBuilder<Ctx, CommentToken>;
  comment(
    value: CommentMatcherValue,
    handler: CommentMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, CommentToken>;
  comment(opts: CommentMatcherOptions<Ctx>): SeqBuilder<Ctx, CommentToken>;
  comment(
    arg1?:
      | CommentMatcherValue
      | CommentMatcherOptions<Ctx>
      | CommentMatcherHandler<Ctx>,
    arg2?: CommentMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, CommentToken> {
    const opts = coerceCommentOptions<Ctx>(arg1, arg2);
    const builder = new CommentBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx, CommentToken>(this, builder);
  }

  num(): SeqBuilder<Ctx, NumberToken>;
  num(value: NumMatcherValue): SeqBuilder<Ctx, NumberToken>;
  num(handler: NumMatcherHandler<Ctx>): SeqBuilder<Ctx, NumberToken>;
  num(
    value: NumMatcherValue,
    handler: NumMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, NumberToken>;
  num(opts: NumMatcherOptions<Ctx>): SeqBuilder<Ctx, NumberToken>;
  num(
    arg1?: NumMatcherValue | NumMatcherOptions<Ctx> | NumMatcherHandler<Ctx>,
    arg2?: NumMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, NumberToken> {
    const opts = coerceNumOptions<Ctx>(arg1, arg2);
    const builder = new NumBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx, NumberToken>(this, builder);
  }

  many(builder: QueryBuilder<Ctx, Node>): SeqBuilder<Ctx, Node>;
  many(
    builder: QueryBuilder<Ctx, Node>,
    min: number,
    max: number
  ): SeqBuilder<Ctx, Node>;
  many(
    arg1: QueryBuilder<Ctx, Node>,
    arg2?: number,
    arg3?: number
  ): SeqBuilder<Ctx, Node> {
    const opts = coerceManyOptions<Ctx>(arg1, arg2, arg3);
    const builder = new ManyBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx, Node>(this, builder);
  }

  opt(innerBuilder: QueryBuilder<Ctx, Node>): SeqBuilder<Ctx, Node> {
    const opts = coerceManyOptions<Ctx>(innerBuilder, 0, 1);
    const builder = new ManyBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx, Node>(this, builder);
  }

  alt(...alts: QueryBuilder<Ctx, Node>[]): SeqBuilder<Ctx, Node> {
    const builder = new AltBuilder<Ctx>(alts);
    return new SeqBuilder<Ctx, Node>(this, builder);
  }

  tree(): SeqBuilder<Ctx, Tree>;
  tree(type: TreeType): SeqBuilder<Ctx, Tree>;
  tree(opts: TreeBuilderOptions<Ctx>): SeqBuilder<Ctx, Tree>;
  tree(arg1?: TreeBuilderOptions<Ctx> | TreeType): SeqBuilder<Ctx, Tree> {
    const opts = coerceTreeOptions(arg1);
    const builder = new TreeBuilder(opts);
    return new SeqBuilder<Ctx, Tree>(this, builder);
  }

  str(): SeqBuilder<Ctx, StringTree>;
  str(handler: StrContentMatcherHandler<Ctx>): SeqBuilder<Ctx, StringTree>;
  str(
    exact: string,
    handler?: StrContentMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, StringTree>;
  str(
    pattern: RegExp,
    handler?: StrContentMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, StringTree>;
  str(opts: StrTreeBuilderOptions<Ctx>): SeqBuilder<Ctx, StringTree>;
  str(
    arg1?:
      | string
      | RegExp
      | StrTreeBuilderOptions<Ctx>
      | StrContentMatcherHandler<Ctx>,
    arg2?: StrContentMatcherHandler<Ctx>
  ): SeqBuilder<Ctx, StringTree> {
    const opts = coerceStrOptions<Ctx>(arg1, arg2);
    const builder = new StrBuilder<Ctx>(opts);
    return new SeqBuilder<Ctx, StringTree>(this, builder);
  }

  end(): EndBuilder<Ctx, T> {
    return new EndBuilder<Ctx, T>(this);
  }

  join<U extends Node>(other: QueryBuilder<Ctx, U>): SeqBuilder<Ctx, U> {
    const builder = new SeqBuilder<Ctx, U>(this, other);
    return builder;
  }
}

// Anchors

export class BeginBuilder<Ctx, T extends Node> extends AbstractBuilder<Ctx, T> {
  build(): BeginMatcher<Ctx> {
    return new BeginMatcher<Ctx>();
  }
}

export class EndBuilder<Ctx, T extends Node> extends TerminalBuilder<
  Ctx,
  EndToken
> {
  constructor(private readonly builder: QueryBuilder<Ctx, T>) {
    super();
  }

  build(): SeqMatcher<Ctx> {
    const matcher = this.builder.build();
    const matchers = matcher instanceof SeqMatcher ? matcher.seq : [matcher];
    matchers.push(new EndMatcher());
    return new SeqMatcher<Ctx>({ matchers });
  }
}

export function begin<Ctx>(): BeginBuilder<Ctx, StartToken> {
  return new BeginBuilder<Ctx, StartToken>();
}

export class VoidBuilder<Ctx, T extends Node> extends AbstractBuilder<Ctx, T> {
  constructor(private readonly fn: (context: Ctx, t: T) => Ctx) {
    super();
  }

  build(): VoidMatcher<Ctx, T> {
    return new VoidMatcher<Ctx, T>(this.fn);
  }
}

export function handler<Ctx>(
  fn: (context: Ctx, t: Node) => Ctx
): VoidBuilder<Ctx, Node> {
  return new VoidBuilder(fn);
}

// Sequence

export class SeqBuilder<Ctx, T extends Node> extends AbstractBuilder<Ctx, T> {
  private readonly builders: QueryBuilder<Ctx, Node>[];

  constructor(prev: QueryBuilder<Ctx, Node>, next: QueryBuilder<Ctx, T>) {
    super();
    const prevSeq =
      prev instanceof SeqBuilder
        ? (prev.builders as QueryBuilder<Ctx, Node>[])
        : [prev];
    const nextSeq =
      next instanceof SeqBuilder
        ? (next.builders as QueryBuilder<Ctx, Node>[])
        : [next];
    this.builders = [...prevSeq, ...nextSeq];
  }

  build(): SeqMatcher<Ctx> {
    const matchers = this.builders.map((builder) => builder.build());
    return new SeqMatcher<Ctx>({ matchers });
  }
}

export function join<Ctx>(
  first: QueryBuilder<Ctx, Node>,
  second: QueryBuilder<Ctx, Node>,
  ...others: QueryBuilder<Ctx, Node>[]
): SeqBuilder<Ctx, Node> {
  const seq = new SeqBuilder<Ctx, Node>(first, second);

  if (!others.length) {
    return seq;
  }

  return others.reduce((res, query) => {
    return res.join(query);
  }, seq);
}

// Symbols

export class SymBuilder<Ctx> extends AbstractBuilder<Ctx, SymbolToken> {
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

export class OpBuilder<Ctx> extends AbstractBuilder<Ctx, OperatorToken> {
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

export class CommentBuilder<Ctx> extends AbstractBuilder<Ctx, CommentToken> {
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

export class NumBuilder<Ctx> extends AbstractBuilder<Ctx, NumberToken> {
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

export class ManyBuilder<Ctx> extends AbstractBuilder<Ctx, Node> {
  constructor(private opts: ManyBuilderOpts<Ctx>) {
    super();
  }

  build(): ManyMatcher<Ctx> {
    const matcher = this.opts.builder.build();
    return new ManyMatcher<Ctx>({ ...this.opts, matcher });
  }
}

export function many<Ctx>(builder: QueryBuilder<Ctx, Node>): ManyBuilder<Ctx>;
export function many<Ctx>(
  builder: QueryBuilder<Ctx, Node>,
  min: number,
  max: number
): ManyBuilder<Ctx>;
export function many<Ctx>(
  arg1: QueryBuilder<Ctx, Node>,
  arg2?: number,
  arg3?: number
): ManyBuilder<Ctx> {
  const opts = coerceManyOptions<Ctx>(arg1, arg2, arg3);
  return new ManyBuilder<Ctx>(opts);
}

export function opt<Ctx>(builder: QueryBuilder<Ctx, Node>): ManyBuilder<Ctx> {
  const opts = coerceManyOptions<Ctx>(builder, 0, 1);
  return new ManyBuilder<Ctx>(opts);
}

// Alternatives

export class AltBuilder<Ctx> extends AbstractBuilder<Ctx, Node> {
  constructor(private builders: QueryBuilder<Ctx, Node>[]) {
    super();
  }

  build(): AltMatcher<Ctx> {
    const matchers = this.builders.map((alt) => alt.build());
    return new AltMatcher<Ctx>({ matchers });
  }
}

export function alt<Ctx>(
  ...builders: QueryBuilder<Ctx, Node>[]
): AltBuilder<Ctx> {
  return new AltBuilder<Ctx>(builders);
}

// Trees

export class TreeBuilder<Ctx> extends AbstractBuilder<Ctx, Tree> {
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

export class StrBuilder<Ctx> extends AbstractBuilder<Ctx, StringTree> {
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

export function buildRoot<Ctx>(builder: QueryBuilder<Ctx, Node>): Matcher<Ctx> {
  const matcher = builder.build();
  return matcher instanceof TreeMatcher && matcher.type === 'root-tree'
    ? matcher
    : new TreeMatcher({ matcher, type: 'root-tree' });
}
