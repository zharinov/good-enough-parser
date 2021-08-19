import type { StatesMap } from './rules';
import { sortStateRules } from './rules';

export interface SymbolOption {
  match: RegExp;
}

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
