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
    const tokenRule: StringRule = {
      t: 'string',
      type: tokenName,
      match: op,
      chunk: op,
    };
    operatorRules[tokenName] = tokenRule;
  });

  return {
    ...states,
    $: {
      ...states.$,
      ...operatorRules,
    },
  };
}
