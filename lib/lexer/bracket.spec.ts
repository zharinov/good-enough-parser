import { tokenize } from '../../test/test-utils';
import { configBrackets } from './bracket';
import { fallbackRule } from './rules';
import type { BracketOption, StatesMap } from './types';

describe('lexer/bracket', () => {
  it('works', () => {
    const states: StatesMap = {
      $: { unknown: { ...fallbackRule, type: 'unknown' } },
    };
    const bracketOptions: BracketOption[] = [
      { startsWith: '{', endsWith: '}' },
      { startsWith: '[', endsWith: ']' },
      { startsWith: '(', endsWith: ')' },
    ];
    const rules = configBrackets(states, bracketOptions);
    const input = '{[()]}';
    const res = tokenize(rules, input);
    expect(res).toMatchObject([
      { type: 'bracket-left', value: '{' },
      { type: 'bracket-left', value: '[' },
      { type: 'bracket-left', value: '(' },
      { type: 'bracket-right', value: ')' },
      { type: 'bracket-right', value: ']' },
      { type: 'bracket-right', value: '}' },
    ]);
  });
});
