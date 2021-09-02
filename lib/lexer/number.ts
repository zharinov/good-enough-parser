import type { NumberOption, StatesMap } from './types';

export function configNumbers(
  states: StatesMap,
  { match }: NumberOption
): StatesMap {
  return {
    ...states,
    $: {
      number: { t: 'regex', match },
      ...states.$,
    },
  };
}
