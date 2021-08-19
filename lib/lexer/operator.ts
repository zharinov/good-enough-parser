import type { StateDefinition, StatesMap, StringRule } from './rules';
import { sortStateRules } from './rules';

export interface OperatorOption {
  op: string;
}

export function configOperators(
  states: StatesMap,
  operators: OperatorOption[]
): StatesMap {
  const operatorRules: StateDefinition = {};
  operators.map(({ op }, idx) => {
    const tokenName = `op$${idx}`;
    const tokenRule: StringRule = { t: 'string', match: op };
    operatorRules[tokenName] = tokenRule;
  });

  return {
    ...states,
    $: sortStateRules({
      ...states.$,
      ...operatorRules,
    }),
  };
}
