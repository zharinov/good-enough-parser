import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import type { Token } from '../../lexer/types';
import * as q from '../builder';
import type { Checkpoint } from '../types';

const lang = createLang(pythonLang);

type Ctx = string[];

function getInitialCheckpoint(input: string): Checkpoint<Ctx> {
  const cursor = lang.parse(input);
  return { cursor, context: [] };
}

const handler = (ctx: Ctx, token: Token) => [...ctx, token.value];

describe('query/matchers/tree-matcher', () => {
  describe('Children search', () => {
    it('finds first child', () => {
      const input = 'foo + bar + baz';
      const prevCheckpoint = getInitialCheckpoint(input);
      const treeMatcher = q
        .tree<string[]>({
          type: 'root-tree',
          anyChild: q.sym(handler),
        })
        .build();

      const checkpoint = treeMatcher.match(prevCheckpoint);

      expect(checkpoint).toMatchObject({ context: ['foo'] });
    });

    it('handles empty string', () => {
      const input = '';
      const prevCheckpoint = getInitialCheckpoint(input);
      const treeMatcher = q
        .tree<string[]>({
          type: 'root-tree',
          anyChild: q.sym(handler),
        })
        .build();

      const checkpoint = treeMatcher.match(prevCheckpoint);

      expect(checkpoint).toBeNull();
    });

    it('handles search failure', () => {
      const input = '...';
      const prevCheckpoint = getInitialCheckpoint(input);
      const treeMatcher = q
        .tree<string[]>({
          type: 'root-tree',
          anyChild: q.sym(handler),
        })
        .build();

      const checkpoint = treeMatcher.match(prevCheckpoint);

      expect(checkpoint).toBeNull();
    });

    it('finds all children', () => {
      const input = 'foo + bar + baz';
      const prevCheckpoint = getInitialCheckpoint(input);
      const treeMatcher = q
        .tree<string[]>({
          type: 'root-tree',
          allChildren: q.sym(handler),
        })
        .build();

      const checkpoint = treeMatcher.match(prevCheckpoint);

      expect(checkpoint).toMatchObject({ context: ['foo', 'bar', 'baz'] });
    });

    it('ignores grandchildren', () => {
      const input = 'foo + (bar + baz) + qux';
      const prevCheckpoint = getInitialCheckpoint(input);
      const treeMatcher = q
        .tree<string[]>({
          type: 'root-tree',
          allChildren: q.sym(handler),
        })
        .build();

      const checkpoint = treeMatcher.match(prevCheckpoint);

      expect(checkpoint).toMatchObject({ context: ['foo', 'qux'] });
    });
  });
});
