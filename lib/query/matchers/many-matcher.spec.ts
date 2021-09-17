import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import type { Token } from '../../lexer/types';
import * as q from '../builder';

const lang = createLang(pythonLang);

type Ctx = string[];

const handler = (ctx: Ctx, token: Token) => [...ctx, token.value];

describe('query/matchers/many-matcher', () => {
  describe('Repetitions matching', () => {
    it('handles many occurrences', () => {
      const input = '+-+';
      const query = q.many(q.op(handler));
      const res = lang.query(input, query, []);
      expect(res).toEqual(['+', '-', '+']);
    });

    it('handles spaces', () => {
      const input = '\t \n+    -\t\t+\n\n- \t\n+';
      const query = q.many(q.op(handler));
      const res = lang.query(input, query, []);
      expect(res).toEqual(['+', '-', '+', '-', '+']);
    });

    it('supports backtracking', () => {
      const input = '---x';
      const query = q.many(q.op('-', handler)).op('-').sym('x');
      const res = lang.query(input, query, []);
      expect(res).toEqual(['-', '-']);
    });
  });
});
