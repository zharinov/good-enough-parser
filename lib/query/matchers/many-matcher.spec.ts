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

  describe('Optionals', () => {
    it('handles simple optionals', () => {
      const input = 'foobar';
      const query = q.opt(q.sym(handler));
      const res = lang.query(input, query, []);
      expect(res).toEqual(['foobar']);
    });

    it('handles greedy behavior', () => {
      const input = 'foo bar';
      const query = q.sym('foo').opt(q.sym(handler));
      const res = lang.query(input, query, []);
      expect(res).toEqual(['bar']);
    });

    it('handles sequential optionals', () => {
      const input = '+-*/';
      const query = q
        .opt(q.op('+', handler))
        .opt(q.op('-', handler))
        .opt(q.op('*', handler))
        .opt(q.op('/', handler));
      const res = lang.query(input, query, []);
      expect(res).toEqual(['+', '-', '*', '/']);
    });

    it('supports optional repetitions', () => {
      const input = 'foo, bar';
      const query = q.sym(handler).opt(q.op(',')).opt(q.sym(handler));
      const res = lang.query(input, query, []);
      expect(res).toEqual(['foo', 'bar']);
    });

    it('supports optional comments', () => {
      const input = 'foo # bar';
      const query = q.sym(handler).opt(q.comment(handler));
      const res = lang.query(input, query, []);
      expect(res).toEqual(['foo', '# bar']);
    });

    it('handles optionals inside mandatory sequence', () => {
      const input = `foo bar`;
      const query = q.sym(handler).opt(q.op(',')).sym(handler);
      const res = lang.query(input, query, []);
      expect(res).toEqual(['foo', 'bar']);
    });

    it('supports heterogeneous sequential optionals', () => {
      const input = 'foo # bar';
      const query = q.sym(handler).opt(q.op(',')).comment(handler);
      const res = lang.query(input, query, []);
      expect(res).toEqual(['foo', '# bar']);
    });

    it('handles nested optionals', () => {
      const input = 'foobar';
      const query = q.opt(q.opt(q.opt(q.opt(q.sym(handler)))));
      const res = lang.query(input, query, []);
      expect(res).toEqual(['foobar']);
    });
  });
});
