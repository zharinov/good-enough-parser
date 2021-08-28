import { createLang } from '../../../lib/lang';
import { lang as pythonLang } from '../../../lib/lang/python';
import type { Token } from '../../../lib/lexer/types';
import * as q from '../../../lib/query/builder';
import type { Checkpoint } from '../../../lib/query/types';

const lang = createLang(pythonLang);

type Ctx = string[];

function getInitialCheckpoint(input: string): Checkpoint<Ctx> {
  const cursor = lang.parse(input).down as never;
  return { cursor, context: [] };
}

const handler = (ctx: Ctx, token: Token) => [...ctx, token.value];

describe('query/matchers/index', () => {
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

  describe('Repetitions matching', () => {
    it('handles many occurrences', () => {
      const input = '+-+';
      const prevCheckpoint = getInitialCheckpoint(input);
      const manyMatcher = q.many(q.op(handler)).build();

      const nextCheckpoint = manyMatcher.match(prevCheckpoint);

      expect(nextCheckpoint).toMatchObject({
        context: ['+', '-', '+'],
        endOfLevel: true,
      });
    });

    it('handles spaces', () => {
      const input = '\t \n+    -\t\t+\n\n- \t\n+';
      const prevCheckpoint = getInitialCheckpoint(input);
      const manyMatcher = q.many(q.op(handler)).build();

      const nextCheckpoint = manyMatcher.match(prevCheckpoint);

      expect(nextCheckpoint).toMatchObject({
        context: ['+', '-', '+', '-', '+'],
        endOfLevel: true,
      });
    });

    it('supports backtracking', () => {
      const prevCheckpoint = getInitialCheckpoint('---x');
      const matcher = q.many(q.op('-', handler)).op('-').sym('x').build();

      const nextCheckpoint = matcher.match(prevCheckpoint);

      expect(nextCheckpoint).toMatchObject({
        context: ['-', '-'],
        endOfLevel: true,
      });
    });
  });
});
