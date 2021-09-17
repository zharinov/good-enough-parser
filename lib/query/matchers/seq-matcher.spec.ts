import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import type { Token } from '../../lexer/types';
import * as q from '../builder';

const lang = createLang(pythonLang);

type Ctx = string[];

const handler = (ctx: Ctx, token: Token) => [...ctx, token.value];

describe('query/matchers/seq-matcher', () => {
  describe('Sequential matching', () => {
    it('handles exact sequence match', () => {
      const input = 'foo.bar';
      const query = q.sym(handler).op(handler).sym(handler);
      const res = lang.query(input, query, []);
      expect(res).toEqual(['foo', '.', 'bar']);
    });

    it('skips spaces', () => {
      const input = 'foo .\tbar\n.   baz';
      const query = q
        .sym(handler)
        .op(handler)
        .sym(handler)
        .op(handler)
        .sym(handler);

      const res = lang.query(input, query, []);

      expect(res).toEqual(['foo', '.', 'bar', '.', 'baz']);
    });

    it('falsy if query is longer than input', () => {
      const input = 'foo.bar';
      const query = q
        .sym(handler)
        .op(handler)
        .sym(handler)
        .op(handler)
        .sym(handler);

      const res = lang.query(input, query, []);

      expect(res).toBeUndefined();
    });

    it('traverses correctly', () => {
      const input = 'foo; bar; baz; qux;';
      const query = q.sym(handler).op(';');
      const res = lang.query(input, query, []);
      expect(res).toEqual(['foo', 'bar', 'baz', 'qux']);
    });
  });
});
