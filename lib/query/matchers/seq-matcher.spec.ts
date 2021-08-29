import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import type { Token } from '../../lexer/types';
import * as q from '../builder';
import type { Checkpoint } from '../types';

const lang = createLang(pythonLang);

type Ctx = string[];

function getInitialCheckpoint(input: string): Checkpoint<Ctx> {
  const cursor = lang.parse(input).down as never;
  return { cursor, context: [] };
}

const handler = (ctx: Ctx, token: Token) => [...ctx, token.value];

describe('query/matchers/seq-matcher', () => {
  describe('Sequential matching', () => {
    it('handles sequences', () => {
      const input = 'foo.bar';
      const prevCheckpoint = getInitialCheckpoint(input);
      const seqMatcher = q.sym(handler).op(handler).sym(handler).build();

      const nextCheckpoint = seqMatcher.match(prevCheckpoint);

      expect(nextCheckpoint).toMatchObject({
        context: ['foo', '.', 'bar'],
        endOfLevel: true,
      });
    });

    it('skips spaces', () => {
      const input = 'foo .\tbar\n.   baz';
      const prevCheckpoint = getInitialCheckpoint(input);
      const seqMatcher = q
        .sym(handler)
        .op(handler)
        .sym(handler)
        .op(handler)
        .sym(handler)
        .build();

      const nextCheckpoint = seqMatcher.match(prevCheckpoint);

      expect(nextCheckpoint).toMatchObject({
        context: ['foo', '.', 'bar', '.', 'baz'],
        endOfLevel: true,
      });
    });
  });
});
