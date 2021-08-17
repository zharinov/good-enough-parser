import {
  fallbackRule,
  LexerRule,
  sortStateRules,
  StateDefinition,
} from '/lexer/rules';

function strRule(match: string): LexerRule {
  return { t: 'string', match };
}

function regexRule(match: RegExp): LexerRule {
  return { t: 'regex', match };
}

describe('lexer/rules', () => {
  describe('sortStateRules', () => {
    it('returns same array for empty rule set', () => {
      expect(sortStateRules({})).toEqual({});
    });

    it('returns same array for single rule', () => {
      const state: StateDefinition = { foo: { t: 'string', match: 'a' } };
      expect(sortStateRules(state)).toEqual(state);
    });

    it('reorders rules to avoid tokenizer ambiguity', () => {
      const state: StateDefinition = {
        x: fallbackRule,
        '01': strRule('a'),
        '02': strRule('[['),
        '03': strRule('b'),
        '04': strRule('[[['),
        '05': strRule('c'),
        y: fallbackRule,
        '06': strRule('['),
        '07': strRule('d'),
        '08': strRule('aa'),
        '09': strRule('bb'),
        '10': strRule('cc'),
        '11': strRule('dd'),
        '12': strRule('aaa'),
        z: fallbackRule,
      };
      const res = sortStateRules(state);
      const rules = Object.values(res);
      const matches = rules.map((rule) =>
        rule.t !== 'fallback' ? rule.match : null
      );
      expect(matches).toEqual([
        'cc',
        'dd',
        'aaa',
        'd',
        'c',
        'bb',
        'b',
        'aa',
        'a',
        '[[[',
        '[[',
        '[',
        null,
        null,
        null,
      ]);
    });

    it('sorts regex', () => {
      const state: StateDefinition = {
        '01': fallbackRule,
        '02': strRule('a'),
        '03': regexRule(/[a-z]/),
        '04': strRule('aa'),
        '05': regexRule(/[0-9]/),
        '06': fallbackRule,
      };
      const res = sortStateRules(state);
      expect(Object.values(res)).toMatchObject([
        { t: 'string' },
        { t: 'string' },
        { t: 'regex' },
        { t: 'regex' },
        { t: 'fallback' },
        { t: 'fallback' },
      ]);
    });
  });
});
