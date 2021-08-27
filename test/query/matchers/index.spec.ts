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
  const cursor = createCursor(tree).down;
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

      const { cursor, context } = { ...nextCheckpoint };
      expect(context).toEqual(['foo', '.', 'bar']);
      expect(cursor).toBeUndefined();
    });
  });

  describe('Repetitions matching', () => {
    it('handles many occurrences', () => {
      const input = '+-+';
      const prevCheckpoint = getInitialCheckpoint(input);
      const manyMatcher = q.many(q.op(handler)).build();

      const nextCheckpoint = manyMatcher.match(prevCheckpoint);

      const { cursor, context } = { ...nextCheckpoint };
      expect(context).toEqual(['+', '-', '+']);
      expect(cursor).toBeUndefined();
    });

    it('supports backtracking', () => {
      const prevCheckpoint = getInitialCheckpoint('---x');
      const matcher = q.many(q.op('-', handler)).op('-').sym('x').build();

      const nextCheckpoint = matcher.match(prevCheckpoint);

      const { cursor, context } = { ...nextCheckpoint };
      expect(context).toHaveLength(2);
      expect(context).toEqual(['-', '-']);
      expect(cursor).toBeUndefined();
    });
  });
});
