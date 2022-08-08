import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import type { Token } from '../../lexer/types';
import * as q from '../builder';

const lang = createLang(pythonLang);

type Ctx = string[];

const handler = (ctx: Ctx, token: Token) => [...ctx, token.value];

describe('query/matchers/anchor-matcher', () => {
  it('handles exact sequence match', () => {
    const input = ' foo . bar ';
    const query = q.begin<Ctx>().sym(handler).op(handler).sym(handler).end();
    const res = lang.query(input, query, []);
    expect(res).toEqual(['foo', '.', 'bar']);
  });

  it('handles mismatch at the beginning', () => {
    const input = '.foo';
    const query = q.begin<Ctx>().sym();
    const res = lang.query(input, query, []);
    expect(res).toBeNull();
  });

  it('handles mismatch at the end', () => {
    const input = '.foo';
    const query = q.op().end();
    const res = lang.query(input, query, []);
    expect(res).toBeNull();
  });

  it('supports handler builder', () => {
    const input = 'baz';
    const query = q
      .handler<Ctx>((ctx) => [...ctx, 'bar'])
      .sym(handler)
      .handler((ctx) => ctx.map((x) => x.toUpperCase()));
    const res = lang.query(input, query, ['foo']);
    expect(res).toEqual(['FOO', 'BAR', 'BAZ']);
  });
});
