import { tokenize } from '#test-utils';
import type { BracketOption } from '/lexer/bracket';
import { configBrackets } from '/lexer/bracket';
import type { StatesMap } from '/lexer/rules';
import { fallbackRule } from '/lexer/rules';

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
      { type: 'bracket$0$left' },
      { type: 'bracket$1$left' },
      { type: 'bracket$2$left' },
      { type: 'bracket$2$right' },
      { type: 'bracket$1$right' },
      { type: 'bracket$0$right' },
    ]);
  });
});
