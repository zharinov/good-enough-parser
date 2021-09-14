import type { NumberToken, OperatorToken, SymbolToken } from '../lexer/types';
import type {
  Cursor,
  Node,
  StringTree,
  TemplateTree,
  Tree,
  TreeType,
} from '../parser/types';

export interface Checkpoint<Ctx> {
  cursor: Cursor;
  context: Ctx;
  endOfLevel?: true;
}

export type NodeHandler<Ctx, T = Node> = (ctx: Ctx, tree: T) => Ctx;

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
  maxDepth?: number | null;
  maxMatches?: number | null;
  preHandler?: TreeMatcherHandler<Ctx>;
  postHandler?: TreeMatcherHandler<Ctx>;
}

export interface Matcher<Ctx> {
  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null;
  nextMatch(): Checkpoint<Ctx> | null;
}

export interface ManyMatcherOptions<Ctx> {
  matcher: Matcher<Ctx>;
  min: number;
  max: number | null;
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

export interface QueryBuilder<Ctx> {
  build(): Matcher<Ctx>;
}
