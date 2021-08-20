import { tokenize } from '#test-utils';
import { fallbackRule } from '/lexer/rules';
import { configSymbols } from '/lexer/symbol';
import type { StatesMap, SymbolOption } from '/lexer/types';

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
