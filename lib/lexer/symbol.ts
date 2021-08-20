import { sortStateRules } from './rules';
import type { StatesMap, SymbolOption } from './types';

export function configSymbols(
  states: StatesMap,
  { match }: SymbolOption
): StatesMap {
  return {
    ...states,
    $: sortStateRules({
      ...states.$,
      symbol: { t: 'regex', match },
    }),
  };
}
