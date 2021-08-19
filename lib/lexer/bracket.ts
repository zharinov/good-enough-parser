import type { StateDefinition, StatesMap, StringRule } from './rules';
import { sortStateRules } from './rules';
import type { OptionBase } from './types';

export interface BracketOption extends OptionBase {
  endsWith: string;
}

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
      match: option.startsWith,
    };

    const rightTokenKey = `${tokenKey}$right`;
    const rightTokenRule: StringRule = {
      t: 'string',
      match: option.endsWith,
    };

    bracketDefs[leftTokenKey] = leftTokenRule;
    bracketDefs[rightTokenKey] = rightTokenRule;
  });

  return {
    ...states,
    $: sortStateRules({
      ...states.$,
      ...bracketDefs,
    }),
  };
}
