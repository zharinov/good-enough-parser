import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import type { Token } from '../../lexer/types';
import * as q from '../builder';

const lang = createLang(pythonLang);

type Ctx = string[];

const handler = (ctx: Ctx, token: Token) => [...ctx, token.value];

const input = `
foo # bar
baz
`;

describe('query/matchers/comment-matcher', () => {
  it('handles explicit comments', () => {
    const res = lang.query(
      input,
      q.sym(handler).comment(handler).sym(handler),
      []
    );

    expect(res).toEqual(['foo', '# bar', 'baz']);
  });

  it('skips comments by default', () => {
    const res = lang.query(input, q.sym(handler).sym(handler), []);
    expect(res).toEqual(['foo', 'baz']);
  });
});
