import { fallbackRule, sortLexerRules } from '../../lib/lexer/rules';
import type { LexerRule } from '../../lib/lexer/types';

function strRule(name: string, match: string): LexerRule {
  return { t: 'string', type: name, match, chunk: match };
}

function regexRule(name: string, match: RegExp): LexerRule {
  return { t: 'regex', type: name, match, chunk: null };
}

describe('lexer/rules', () => {
  describe('sortRules', () => {
    it('returns same array for empty rule set', () => {
      expect(sortLexerRules([])).toEqual([]);
    });

    it('returns same array for single rule', () => {
      const rule: LexerRule = {
        t: 'string',
        type: 'foo',
        match: 'a',
        chunk: 'a',
      };
      expect(sortLexerRules([rule])).toEqual([rule]);
    });

    it('reorders rules to avoid tokenizer ambiguity', () => {
      const rules: LexerRule[] = [
        { ...fallbackRule, type: 'x', chunk: null },
        strRule('01', 'a'),
        strRule('02', '[['),
        strRule('03', 'b'),
        strRule('04', '[[['),
        strRule('05', 'c'),
        { ...fallbackRule, type: 'y', chunk: null },
        strRule('06', '['),
        strRule('07', 'd'),
        strRule('08', 'aa'),
        strRule('09', 'bb'),
        strRule('10', 'cc'),
        strRule('11', 'dd'),
        strRule('12', 'aaa'),
        { ...fallbackRule, type: 'z', chunk: null },
      ];

      const chunks = (rules: LexerRule[]): (string | null)[] =>
        rules.map(({ chunk }) => chunk);

      const res = sortLexerRules(rules);

      expect(chunks(res)).toMatchInlineSnapshot(`
        Array [
          "[[[",
          "[[",
          "[",
          "aaa",
          "aa",
          "a",
          "bb",
          "b",
          "cc",
          "c",
          "dd",
          "d",
          null,
          null,
          null,
        ]
      `);
      expect(chunks(sortLexerRules(res))).toEqual(chunks(res));
    });

    it('sorts regexes and fallbacks', () => {
      const state: LexerRule[] = [
        { ...fallbackRule, type: '01', chunk: null },
        strRule('02', 'a'),
        regexRule('03', /[a-z]/),
        strRule('04', 'aa'),
        regexRule('05', /[0-9]/),
        { ...fallbackRule, type: '06', chunk: null },
      ];
      const res = sortLexerRules(state);
      expect(res).toMatchObject([
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
