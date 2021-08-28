import { tokenize } from '#test-utils';
import { configNumbers } from '/lexer/number';
import { fallbackRule } from '/lexer/rules';
import type { NumberOption, StatesMap } from '/lexer/types';

describe('lexer/number', () => {
  it('works', () => {
    const states: StatesMap = { $: { unknown: fallbackRule } };
    const symbolOption: NumberOption = { match: /[0-9]+/ };
    const rules = configNumbers(states, symbolOption);
    const input = '40+2';
    const res = tokenize(rules, input);
    expect(res).toMatchObject([
      { type: 'number', value: '40' },
      { type: '_' },
      { type: 'number', value: '2' },
    ]);
  });
});
