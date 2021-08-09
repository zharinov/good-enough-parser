import {
  fallback as mooFallback,
  FallbackRule as FallbackRule,
  Rule as MooTokenRule,
} from 'moo';

export const fallbackRule: FallbackRule = mooFallback;

export interface TokenRule extends MooTokenRule {
  match: string;
}

type LexerRule = TokenRule | FallbackRule;

export function isTokenRule(input: LexerRule): input is TokenRule {
  return input !== fallbackRule;
}

export type TokenName = string;
export type StateDefinition = Record<TokenName, LexerRule>;

export type StateName = string;
export type StatesMap = Record<StateName, StateDefinition>;

function compareLexerRules(x: LexerRule, y: LexerRule): -1 | 0 | 1 {
  if (isTokenRule(x) && isTokenRule(y)) {
    const xMatch = x.match;
    const yMatch = y.match;
    if (yMatch.startsWith(xMatch)) {
      return 1;
    } else if (xMatch.startsWith(yMatch)) {
      return -1;
    } else if (yMatch < xMatch) {
      return -1;
    } else if (xMatch < yMatch) {
      return 1;
    }
  } else if (x === fallbackRule && y !== fallbackRule) {
    return 1;
  } else if (x !== fallbackRule && y === fallbackRule) {
    return -1;
  }
  return 0;
}

export function sortStateRules(state: StateDefinition): StateDefinition {
  const entries = Object.entries(state);
  if (entries.length < 2) {
    return state;
  }
  const sortedEntries = entries.sort(([, x], [, y]) => compareLexerRules(x, y));
  return Object.fromEntries(sortedEntries);
}
