import { configOperators } from '../../lib/lexer/operator';
import { fallbackRule } from '../../lib/lexer/rules';
import type { OperatorOption, StatesMap } from '../../lib/lexer/types';
import { tokenize } from '../../test/test-utils';

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
