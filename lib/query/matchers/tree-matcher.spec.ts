import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import type { Token } from '../../lexer/types';
import * as q from '../builder';

const lang = createLang(pythonLang);

type Ctx = string[];

const handler = (ctx: Ctx, token: Token) => [...ctx, token.value];

describe('query/matchers/tree-matcher', () => {
  describe('Children search', () => {
    it('matches empty tree node', () => {
      const input = 'foo + bar + baz';
      const query = q.tree<string[]>({
        type: 'root-tree',
        postHandler: (ctx) => [...ctx, 'it works'],
      });
      const res = lang.query(input, query, []);
      expect(res).toEqual(['it works']);
    });

    it('matches single child', () => {
      const input = '(foobar)';
      const query = q.tree({ search: q.sym<Ctx>(handler) });
      const res = lang.query(input, query, []);
      expect(res).toEqual(['foobar']);
    });

    it('matches deeply nested child', () => {
      const input = '[({foobar})]';
      const query = q.tree({ search: q.sym<Ctx>(handler) });
      const res = lang.query(input, query, []);
      expect(res).toMatchObject(['foobar']);
    });

    describe('Limits', () => {
      const input = 'foo + (bar + [baz + { qux }])';

      test.each`
        maxMatches   | found
        ${undefined} | ${['foo', 'bar', 'baz', 'qux']}
        ${0}         | ${['foo', 'bar', 'baz', 'qux']}
        ${1}         | ${['foo']}
        ${2}         | ${['foo', 'bar']}
        ${3}         | ${['foo', 'bar', 'baz']}
        ${4}         | ${['foo', 'bar', 'baz', 'qux']}
      `(
        'maxMatches = $maxMatches',
        ({ maxMatches, found }: { maxMatches?: number; found: string[] }) => {
          const query = q.tree<string[]>({
            type: 'root-tree',
            search: q.sym(handler),
            maxMatches,
          });
          const res = lang.query(input, query, []);
          expect(res).toEqual(found);
        }
      );

      test.each`
        maxDepth | found
        ${0}     | ${['foo', 'bar', 'baz', 'qux']}
        ${1}     | ${['foo']}
        ${2}     | ${['foo', 'bar']}
        ${3}     | ${['foo', 'bar', 'baz']}
        ${4}     | ${['foo', 'bar', 'baz', 'qux']}
        ${5}     | ${['foo', 'bar', 'baz', 'qux']}
      `(
        'maxDepth = $maxDepth',
        ({ maxDepth, found }: { maxDepth: number; found: string[] }) => {
          const query = q.tree<string[]>({
            type: 'root-tree',
            search: q.sym(handler),
            maxDepth,
          });
          const res = lang.query(input, query, []);
          expect(res).toEqual(found);
        }
      );
    });

    it('handles empty input', () => {
      const input = '';
      const query = q.tree<string[]>({
        type: 'root-tree',
        search: q.sym(handler),
      });
      const res = lang.query(input, query, []);
      expect(res).toBeUndefined();
    });

    it('handles failed search', () => {
      const input = '...';
      const query = q.tree<string[]>({
        type: 'root-tree',
        search: q.sym(handler),
      });
      const res = lang.query(input, query, []);
      expect(res).toBeUndefined();
    });
  });
});
