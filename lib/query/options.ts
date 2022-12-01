import type { Node, StringTree, TreeType } from '../parser/types';
import type { StrContentMatcherHandler } from './matchers/str-matcher';
import { isRegex } from './regex';
import type {
  CommentMatcherHandler,
  CommentMatcherOptions,
  CommentMatcherValue,
  ManyBuilderOpts,
  NumMatcherHandler,
  NumMatcherOptions,
  NumMatcherValue,
  OpMatcherHandler,
  OpMatcherOptions,
  OpMatcherValue,
  QueryBuilder,
  StrBuilderOptions,
  StrBuilderOptionsBase,
  StrContentBuilderOptions,
  StrTreeBuilderOptions,
  SymMatcherHandler,
  SymMatcherOptions,
  SymMatcherValue,
  TreeBuilderOptions,
} from './types';

export function coerceSymOptions<Ctx>(
  arg1?: SymMatcherValue | SymMatcherOptions<Ctx> | SymMatcherHandler<Ctx>,
  arg2?: SymMatcherHandler<Ctx>
): SymMatcherOptions<Ctx> {
  if (typeof arg1 === 'string' || isRegex(arg1)) {
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

export function coerceOpOptions<Ctx>(
  arg1?: OpMatcherValue | OpMatcherOptions<Ctx> | OpMatcherHandler<Ctx>,
  arg2?: OpMatcherHandler<Ctx>
): OpMatcherOptions<Ctx> {
  if (typeof arg1 === 'string' || isRegex(arg1)) {
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

export function coerceCommentOptions<Ctx>(
  arg1?:
    | CommentMatcherValue
    | CommentMatcherOptions<Ctx>
    | CommentMatcherHandler<Ctx>,
  arg2?: CommentMatcherHandler<Ctx>
): CommentMatcherOptions<Ctx> {
  if (typeof arg1 === 'string' || isRegex(arg1)) {
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

export function coerceNumOptions<Ctx>(
  arg1?: NumMatcherValue | NumMatcherOptions<Ctx> | NumMatcherHandler<Ctx>,
  arg2?: NumMatcherHandler<Ctx>
): NumMatcherOptions<Ctx> {
  if (typeof arg1 === 'string' || isRegex(arg1)) {
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

export function coerceManyOptions<Ctx>(
  builder: QueryBuilder<Ctx, Node>,
  arg2?: number,
  arg3?: number
): ManyBuilderOpts<Ctx> {
  if (typeof arg2 === 'number' && typeof arg3 === 'number') {
    return { builder, min: arg2, max: arg3 };
  }
  return { builder, min: 1, max: null };
}

export function coerceTreeOptions<Ctx>(
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

export function coerceStrOptions<Ctx>(
  arg1:
    | string
    | RegExp
    | StrContentMatcherHandler<Ctx>
    | StrBuilderOptionsBase<Ctx>
    | undefined,
  arg2: StrContentMatcherHandler<Ctx> | undefined
): StrBuilderOptions<Ctx> {
  if (typeof arg1 === 'string' || isRegex(arg1)) {
    if (arg1 === '') {
      return {
        type: 'str-tree',
        match: [],
        postHandler: arg2
          ? (ctx: Ctx, tree: StringTree) =>
              arg2(ctx, {
                ...tree.startsWith,
                type: 'string-value',
                value: arg1,
              })
          : null,
      };
    }

    return {
      type: 'str-content',
      match: arg1,
      handler: arg2 ?? null,
    };
  } else if (typeof arg1 === 'function') {
    return {
      type: 'str-content',
      match: null,
      handler: arg1,
    };
  } else if (arg1) {
    if (
      (arg1 as never)['handler'] ||
      typeof arg1.match === 'string' ||
      isRegex(arg1.match)
    ) {
      return {
        type: 'str-content',
        ...arg1,
      } as StrContentBuilderOptions<Ctx>;
    }

    return {
      type: 'str-tree',
      ...arg1,
    } as StrTreeBuilderOptions<Ctx>;
  }

  return {
    type: 'str-tree',
    match: null,
    preHandler: null,
    postHandler: null,
  };
}
