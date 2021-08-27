import type { Checkpoint } from '../types/checkpoint';
import { OperatorToken, SymbolToken } from '/lexer/types';

export type SymMatcherValue = string | RegExp | null;
export type SymMatcherHandler<Ctx> = (ctx: Ctx, token: SymbolToken) => Ctx;
export interface SymMatcherOptions<Ctx> {
  value: SymMatcherValue;
  handler: SymMatcherHandler<Ctx> | null;
}

export type OpMatcherValue = string | RegExp | null;
export type OpMatcherHandler<Ctx> = (ctx: Ctx, token: OperatorToken) => Ctx;
export interface OpMatcherOptions<Ctx> {
  value: OpMatcherValue;
  handler: OpMatcherHandler<Ctx> | null;
}

export interface SeqMatcherOptions<Ctx> {
  matchers: Matcher<Ctx>[];
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
