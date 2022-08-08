import type {
  BracketOption,
  StateDefinition,
  StatesMap,
  StringRule,
} from './types';

export function isBracketKey(key: string): boolean {
  return key.startsWith('bracket$');
}

export function isLeftKey(key: string): boolean {
  return key.endsWith('$left');
}

export function isRightKey(key: string): boolean {
  return key.endsWith('$right');
}

export function getCounterpartBracketKey(rightKey: string): string | undefined {
  const [tokenName, idx, side] = rightKey.split('$');
  const sides = new Set<string>(['left', 'right']);
  let result;
  if (tokenName === 'bracket' && typeof side === 'string' && sides.has(side)) {
    sides.delete(side);
    const [counterpart] = [...sides];
    result = [tokenName, idx, counterpart].join('$');
  }
  return result;
}

export function configBrackets(
  states: StatesMap,
  opts: BracketOption[]
): StatesMap {
  const bracketDefs: StateDefinition = {};
  opts.forEach((option, idx) => {
    const tokenKey = `bracket$${idx}`;

    const leftTokenKey = `${tokenKey}$left`;
    const leftTokenRule: StringRule = {
      t: 'string',
      type: leftTokenKey,
      match: option.startsWith,
      chunk: option.startsWith,
    };

    const rightTokenKey = `${tokenKey}$right`;
    const rightTokenRule: StringRule = {
      t: 'string',
      type: rightTokenKey,
      match: option.endsWith,
      chunk: option.endsWith,
    };

    bracketDefs[leftTokenKey] = leftTokenRule;
    bracketDefs[rightTokenKey] = rightTokenRule;
  });

  return {
    ...states,
    $: {
      ...states.$,
      ...bracketDefs,
    },
  };
}
