import type { Checkpoint } from './checkpoint';
import { OperatorToken, SymbolToken } from '/lexer/types';

export interface Matcher<Ctx> {
  match(checkpoint: Checkpoint<Ctx>): Checkpoint<Ctx> | null;
  nextMatch(): Checkpoint<Ctx> | null;
}

export interface SeqMatcherOptions<Ctx> {
  matchers: Matcher<Ctx>[];
}

export interface ManyMatcherOptions<Ctx> {
  matcher: Matcher<Ctx>;
  min: number;
  max: number | null;
}

export interface AltMatcherOption<Ctx> {
  matchers: Matcher<Ctx>[];
}

export interface SymMatcherOption<Ctx> {
  matcher: string | RegExp;
  handler?(ctx: Ctx, token: SymbolToken): Ctx;
}

export interface OpMatcherOption<Ctx> {
  matcher: string | RegExp;
  handler?(ctx: Ctx, token: OperatorToken): Ctx;
}
