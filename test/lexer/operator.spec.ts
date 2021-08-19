import { tokenize } from '#test-utils';
import type { OperatorOption } from '/lexer/operator';
import { configOperators } from '/lexer/operator';
import type { StatesMap } from '/lexer/rules';
import { fallbackRule } from '/lexer/rules';

describe('lexer/operator', () => {
  it('works', () => {
    const states: StatesMap = { $: { unknown: fallbackRule } };
    const bracketOptions: OperatorOption[] = [{ op: '+' }];
    const rules = configOperators(states, bracketOptions);
    const input = '2+2';
    const res = tokenize(rules, input);
    expect(res).toMatchObject([
      { type: 'unknown' },
      { type: 'op$0' },
      { type: 'unknown' },
    ]);
  });
});
