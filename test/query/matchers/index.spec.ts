import { lexerConfig as pythonConfig } from '/lang/python';
import { createLexer } from '/lexer';
import { preprocessTree } from '../../../lib/parser/tree';
import { createCursor } from '/query/zipper';
import * as q from '/query/builder';
import type { Checkpoint } from '/query/types/checkpoint';
import type { Token } from '/lexer/types';

const lexer = createLexer(pythonConfig);

type Ctx = string[];

function getInitialCheckpoint(input: string): Checkpoint<Ctx> {
  lexer.reset(input);
  const tree = preprocessTree(lexer);
  const cursor: never = createCursor(tree).down as never;
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
