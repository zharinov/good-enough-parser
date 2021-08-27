import {
  AltMatcher,
  ManyMatcher,
  OpMatcher,
  SeqMatcher,
  SymMatcher,
} from './matchers';
import type {
  Matcher,
  OpMatcherHandler,
  OpMatcherOptions,
  OpMatcherValue,
  SymMatcherHandler,
  SymMatcherOptions,
  SymMatcherValue,
} from './matchers/types';

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