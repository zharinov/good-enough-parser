import { sortStateRules } from './rules';
import type {
  OperatorOption,
  StateDefinition,
  StatesMap,
  StringRule,
} from './types';

export function configOperators(
  states: StatesMap,
  operators: OperatorOption[]
): StatesMap {
  const operatorRules: StateDefinition = {};
  operators.map((op, idx) => {
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
