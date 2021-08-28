import { sortStateRules } from './rules';
import type { NumberOption, StatesMap } from './types';

export function configNumbers(
  states: StatesMap,
  { match }: NumberOption
): StatesMap {
  return {
    ...states,
    $: sortStateRules({
      ...states.$,
      number: { t: 'regex', match },
    }),
  };
}
