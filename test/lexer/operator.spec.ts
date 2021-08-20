import { tokenize } from '#test-utils';
import { configOperators } from '/lexer/operator';
import { fallbackRule } from '/lexer/rules';
import type { OperatorOption, StatesMap } from '/lexer/types';

describe('lexer/operator', () => {
  it('works', () => {
    const states: StatesMap = { $: { unknown: fallbackRule } };
    const bracketOptions: OperatorOption[] = ['+'];
    const rules = configOperators(states, bracketOptions);
    const input = '2+2';
    const res = tokenize(rules, input);
    expect(res).toMatchObject([
      { type: '_' },
      { type: 'operator' },
      { type: '_' },
    ]);
  });
});
