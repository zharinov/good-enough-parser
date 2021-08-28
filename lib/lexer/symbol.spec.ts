import { fallbackRule } from '../../lib/lexer/rules';
import { configSymbols } from '../../lib/lexer/symbol';
import type { StatesMap, SymbolOption } from '../../lib/lexer/types';
import { tokenize } from '../../test/test-utils';

describe('lexer/symbol', () => {
  it('works', () => {
    const states: StatesMap = { $: { unknown: fallbackRule } };
    const symbolOption: SymbolOption = { match: /[a-z]+/ };
    const rules = configSymbols(states, symbolOption);
    const input = 'foo+bar';
    const res = tokenize(rules, input);
    expect(res).toMatchObject([
      { type: 'symbol', value: 'foo' },
      { type: '_' },
      { type: 'symbol', value: 'bar' },
    ]);
  });
});
