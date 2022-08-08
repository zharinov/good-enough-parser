import type { NumberOption, StatesMap } from './types';

export function configNumbers(
  states: StatesMap,
  { match }: NumberOption
): StatesMap {
  return {
    ...states,
    $: {
      ...states.$,
      number: {
        t: 'regex',
        type: 'number',
        match,
        chunk: null,
      },
    },
  };
}
