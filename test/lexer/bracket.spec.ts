import { tokenize } from '#test-utils';
import { configBrackets } from '/lexer/bracket';
import { fallbackRule } from '/lexer/rules';
import type { BracketOption, StatesMap } from '/lexer/types';

describe('lexer/bracket', () => {
  it('works', () => {
    const states: StatesMap = { $: { unknown: fallbackRule } };
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
