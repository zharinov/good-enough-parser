import type {
  CommentToken,
  MinorToken,
  NumberToken,
  OperatorToken,
  SymbolToken,
} from '../lexer/types';
import type {
  Cursor,
  Node,
  StringTree,
  TemplateTree,
  Tree,
  TreeType,
} from '../parser/types';
import type { StrContentMatcherHandler } from './matchers/str-matcher';

export interface Checkpoint<Ctx> {
  cursor: Cursor;
  context: Ctx;
}

export type NodeHandler<Ctx, T extends Node> = (ctx: Ctx, tree: T) => Ctx;

export type SymMatcherValue = string | RegExp | null;
export type SymMatcherHandler<Ctx> = NodeHandler<Ctx, SymbolToken>;
export interface SymMatcherOptions<Ctx> {
  value: SymMatcherValue;
  handler: SymMatcherHandler<Ctx> | null;
}

export type OpMatcherValue = string | RegExp | null;
export type OpMatcherHandler<Ctx> = NodeHandler<Ctx, OperatorToken>;
export interface OpMatcherOptions<Ctx> {
  value: OpMatcherValue;
  handler: OpMatcherHandler<Ctx> | null;
}

export type CommentMatcherValue = string | RegExp | null;
export type CommentMatcherHandler<Ctx> = NodeHandler<Ctx, CommentToken>;
export interface CommentMatcherOptions<Ctx> {
  value: CommentMatcherValue;
  handler: CommentMatcherHandler<Ctx> | null;
}

export type NumMatcherValue = string | RegExp | null;
export type NumMatcherHandler<Ctx> = NodeHandler<Ctx, NumberToken>;
export interface NumMatcherOptions<Ctx> {
  value: NumMatcherValue;
  handler: NumMatcherHandler<Ctx> | null;
}

export interface SeqMatcherOptions<Ctx> {
  matchers: Matcher<Ctx>[];
}

export type TreeMatcherType = TreeType | null;
export type TreeMatcherHandler<Ctx> = NodeHandler<Ctx, Tree>;
export interface TreeOptionsBase<Ctx> {
  type?: TreeMatcherType;
  startsWith?: string | null;
  endsWith?: string | null;
  maxDepth?: number | null;
  maxMatches?: number | null;
  preHandler?: TreeMatcherHandler<Ctx>;
  postHandler?: TreeMatcherHandler<Ctx>;
}

export interface Matcher<Ctx> {
  seekNext(cursor: Cursor): Cursor;
  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null;
  nextMatch(): Checkpoint<Ctx> | null;
  readonly preventSkipping?: MinorToken['type'];
}

export interface ManyBuilderOpts<Ctx> {
  builder: QueryBuilder<Ctx, Node>;
  min: number;
  max: number | null;
}

export interface ManyMatcherOptions<Ctx> {
  matcher: Matcher<Ctx>;
  min: number;
  max: number | null;
}

export interface TreeBuilderOptions<Ctx> extends TreeOptionsBase<Ctx> {
  search?: QueryBuilder<Ctx, Node> | null;
}

export interface AltMatcherOptions<Ctx> {
  matchers: Matcher<Ctx>[];
}

export type StrTreeHandler<Ctx> = NodeHandler<Ctx, StringTree>;
export interface StrTreeOptionsBase<Ctx> {
  preHandler?: StrTreeHandler<Ctx> | null;
  postHandler?: StrTreeHandler<Ctx> | null;
}

type StrTplHandler<Ctx> = NodeHandler<Ctx, TemplateTree>;
export interface StrTplOptionsBase<Ctx> {
  preHandler?: StrTplHandler<Ctx> | null;
  postHandler?: StrTplHandler<Ctx> | null;
}

export interface StrContentBuilderOptionsBase<Ctx> {
  match?: string | RegExp | null;
  handler?: StrContentMatcherHandler<Ctx> | null;
}

export interface StrTreeBuilderOptionsBase<Ctx> {
  match?: (string | RegExp | QueryBuilder<Ctx, Node>)[] | null;
  preHandler?: NodeHandler<Ctx, StringTree> | null;
  postHandler?: NodeHandler<Ctx, StringTree> | null;
}

export type StrBuilderOptionsBase<Ctx> =
  | StrContentBuilderOptionsBase<Ctx>
  | StrTreeBuilderOptionsBase<Ctx>;

export interface StrContentBuilderOptions<Ctx>
  extends StrContentBuilderOptionsBase<Ctx> {
  type: 'str-content';
}

export interface StrTreeBuilderOptions<Ctx>
  extends StrTreeBuilderOptionsBase<Ctx> {
  type: 'str-tree';
}

export type StrBuilderOptions<Ctx> =
  | StrContentBuilderOptions<Ctx>
  | StrTreeBuilderOptions<Ctx>;

export interface QueryBuilder<Ctx, T extends Node> {
  handler(fn: (ctx: Ctx, t: T) => Ctx): QueryBuilder<Ctx, T>;
  build(): Matcher<Ctx>;
}
