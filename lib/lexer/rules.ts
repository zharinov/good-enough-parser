import { fallback as mooFallback } from 'moo';
import type {
  FallbackRule,
  LexerRule,
  OrderedStatesMap,
  StatesMap,
} from './types';

export const fallbackRule: Omit<FallbackRule, 'type'> = {
  ...mooFallback,
  t: 'fallback',
  chunk: null,
};

function compareChunksByValue(x: LexerRule, y: LexerRule): -1 | 0 | 1 {
  if (typeof x.chunk === 'string' && typeof y.chunk === 'string') {
    const xChunk = x.chunk;
    const yChunk = y.chunk;
    if (yChunk < xChunk) {
      return 1;
    } else if (xChunk < yChunk) {
      return -1;
    }
  }
  return 0;
}

function compareChunksByInclusion(x: LexerRule, y: LexerRule): -1 | 0 | 1 {
  if (typeof x.chunk === 'string' && typeof y.chunk === 'string') {
    const xChunk = x.chunk;
    const yChunk = y.chunk;
    if (yChunk.startsWith(xChunk)) {
      return 1;
    } else if (xChunk.startsWith(yChunk)) {
      return -1;
    }
  }
  return 0;
}

export function sortLexerRules(state: LexerRule[]): LexerRule[] {
  const values = Object.values(state);
  if (values.length < 2) {
    return state;
  }

  const fallbackRules: FallbackRule[] = [];
  const numberRules: LexerRule[] = [];
  const chunkRules: LexerRule[] = [];
  const otherRules: LexerRule[] = [];
  for (const rule of values) {
    if (rule.t === 'fallback') {
      fallbackRules.push(rule);
    } else if (rule.type === 'number') {
      numberRules.push(rule);
    } else if (typeof rule.chunk === 'string') {
      chunkRules.push(rule);
    } else {
      otherRules.push(rule);
    }
  }

  chunkRules.sort((x, y) => compareChunksByValue(x, y));
  chunkRules.sort((x, y) => compareChunksByInclusion(x, y));

  const res = [...numberRules, ...chunkRules, ...otherRules, ...fallbackRules];
  return res;
}

export function createOrderedStateMap(statesMap: StatesMap): OrderedStatesMap {
  const result: OrderedStatesMap = { $: [] };
  for (const [stateName, state] of Object.entries(statesMap)) {
    const stateValues = Object.values(state);
    const orderedStateValues = sortLexerRules(stateValues);
    result[stateName] = orderedStateValues;
  }
  return result;
}
