import { fallback as mooFallback } from 'moo';

export interface StringRule {
  t: 'string';
  match: string;
  push?: string;
  pop?: number;
  next?: string;
}

export interface RegexRule {
  t: 'regex';
  match: RegExp;
  push?: string;
  pop?: number;
  next?: string;
  lineBreaks?: true;
}

export interface FallbackRule {
  t: 'fallback';
  fallback: true;
}

export type LexerRule = StringRule | RegexRule | FallbackRule;

export const fallbackRule: FallbackRule = { t: 'fallback', ...mooFallback };

export type TokenName = string;
export type StateDefinition = Record<TokenName, LexerRule>;

export interface StatesMap {
  $: StateDefinition;
  [k: string]: StateDefinition;
}

function compareLexerRules(x: LexerRule, y: LexerRule): -1 | 0 | 1 {
  if (x.t === 'string' && y.t === 'string') {
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
  }
  return 0;
}

export function sortStateRules(state: StateDefinition): StateDefinition {
  const entries = Object.entries(state);
  if (entries.length < 2) {
    return state;
  }

  const stringEntries = entries
    .filter(([, { t }]) => t === 'string')
    .sort(([, x], [, y]) => compareLexerRules(x, y));

  const regexEntries = entries.filter(([, { t }]) => t === 'regex');

  const fallbackEntries = entries.filter(([, { t }]) => t === 'fallback');

  return Object.fromEntries([
    ...stringEntries,
    ...regexEntries,
    ...fallbackEntries,
  ]);
}

export function sortStatesMap(statesMap: StatesMap): StatesMap {
  const result: StatesMap = { ...statesMap };
  Object.entries(result).forEach(([key, val]) => {
    result[key] = sortStateRules(val);
  });
  return result;
}

export function copyStateDefinition(state: StateDefinition): StateDefinition {
  const result = { ...state };
  Object.entries(result).forEach(([key, val]) => {
    result[key] = { ...val };
  });
  return result;
}
