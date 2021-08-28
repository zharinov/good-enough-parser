import { configBrackets } from '../../lib/lexer/bracket';
import { fallbackRule } from '../../lib/lexer/rules';
import type { BracketOption, StatesMap } from '../../lib/lexer/types';
import { tokenize } from '../test-utils';

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
