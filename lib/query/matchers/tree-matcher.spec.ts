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
    it('matches empty tree node', () => {
      const input = 'foo + bar + baz';
      const prevCheckpoint = getInitialCheckpoint(input);
      const treeMatcher = q
        .tree<string[]>({
          type: 'root-tree',
          postHandler: (ctx) => [...ctx, 'it works'],
        })
        .build();

      const checkpoint = treeMatcher.match(prevCheckpoint);

      expect(checkpoint).toMatchObject({ context: ['it works'] });
    });

    it('matches single child', () => {
      const input = 'foobar';
      const prevCheckpoint = getInitialCheckpoint(input);
      const treeMatcher = q.tree({ search: q.sym<Ctx>(handler) }).build();

      const checkpoint = treeMatcher.match(prevCheckpoint);

      expect(checkpoint).toMatchObject({ context: ['foobar'] });
    });

    it('matches deeply nested child', () => {
      const input = '[({foobar})]';
      const prevCheckpoint = getInitialCheckpoint(input);
      const treeMatcher = q.tree({ search: q.sym<Ctx>(handler) }).build();

      const checkpoint = treeMatcher.match(prevCheckpoint);

      expect(checkpoint).toMatchObject({ context: ['foobar'] });
    });

    describe('Limits', () => {
      const input = '(foo + [bar + { baz }])';

      test.each`
        maxMatches   | found
        ${1}         | ${['foo']}
        ${2}         | ${['foo', 'bar']}
        ${3}         | ${['foo', 'bar', 'baz']}
        ${4}         | ${['foo', 'bar', 'baz']}
        ${0}         | ${['foo', 'bar', 'baz']}
        ${undefined} | ${['foo', 'bar', 'baz']}
      `(
        'maxMatches = $maxMatches',
        ({ maxMatches, found }: { maxMatches?: number; found: string[] }) => {
          const prevCheckpoint = getInitialCheckpoint(input);
          const treeMatcher = q
            .tree<string[]>({ search: q.sym(handler), maxMatches })
            .build();

          const { context } = treeMatcher.match(prevCheckpoint) ?? {};

          expect(context).toEqual(found);
        }
      );

      test.each`
        maxDepth | found
        ${1}     | ${['foo']}
        ${2}     | ${['foo', 'bar']}
        ${3}     | ${['foo', 'bar', 'baz']}
        ${0}     | ${['foo', 'bar', 'baz']}
      `(
        'maxDepth = $maxDepth',
        ({ maxDepth, found }: { maxDepth: number; found: string[] }) => {
          const prevCheckpoint = getInitialCheckpoint(input);
          const treeMatcher = q
            .tree<string[]>({ search: q.sym(handler), maxDepth })
            .build();

          const { context } = treeMatcher.match(prevCheckpoint) ?? {};

          expect(context).toEqual(found);
        }
      );
    });

    it('handles empty input', () => {
      const input = '';
      const prevCheckpoint = getInitialCheckpoint(input);
      const treeMatcher = q
        .tree<string[]>({
          type: 'root-tree',
          search: q.sym(handler),
        })
        .build();

      const checkpoint = treeMatcher.match(prevCheckpoint);

      expect(checkpoint).toBeNull();
    });

    it('handles failed search', () => {
      const input = '...';
      const prevCheckpoint = getInitialCheckpoint(input);
      const treeMatcher = q
        .tree<string[]>({
          type: 'root-tree',
          search: q.sym(handler),
        })
        .build();

      const checkpoint = treeMatcher.match(prevCheckpoint);

      expect(checkpoint).toBeNull();
    });
  });
});
