import {
  fallbackRule,
  isTokenRule,
  sortStateRules,
  StateDefinition,
} from '/config/rules';

describe('/config/rules', () => {
  describe('sortStateRules', () => {
    it('returns same array for empty rule set', () => {
      expect(sortStateRules({})).toEqual({});
    });

    it('returns same array for single rule', () => {
      const state: StateDefinition = { foo: { match: 'a' } };
      expect(sortStateRules(state)).toEqual(state);
    });

    it('reorders rules to avoid tokenizer ambiguity', () => {
      const state: StateDefinition = {
        x: fallbackRule,
        '01': { match: 'a' },
        '02': { match: '[[' },
        '03': { match: 'b' },
        '04': { match: '[[[' },
        '05': { match: 'c' },
        y: fallbackRule,
        '06': { match: '[' },
        '07': { match: 'd' },
        '08': { match: 'aa' },
        '09': { match: 'bb' },
        '10': { match: 'cc' },
        '11': { match: 'dd' },
        '12': { match: 'aaa' },
        z: fallbackRule,
      };
      const res = sortStateRules(state);
      const rules = Object.values(res);
      const matches = rules.map((rule) =>
        isTokenRule(rule) ? rule.match : null
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
  });
});
