import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import type {
  CommentToken,
  NumberToken,
  OperatorToken,
  SymbolToken,
  Token,
} from '../../lexer/types';
import type { Node } from '../../parser';
import * as q from '../builder';
import type { QueryBuilder } from '../types';

const lang = createLang(pythonLang);

type Ctx = string[];

describe('query/matchers/anchor-matcher', () => {
  it('handles exact sequence match', () => {
    const input = ' foo . bar ';
    const handler = (ctx: Ctx, token: Token) => [...ctx, token.value];
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
    const handler = (ctx: Ctx, token: Token) => [...ctx, token.value];
    const query = q
      .handler<Ctx>((ctx) => [...ctx, 'bar'])
      .sym(handler)
      .handler((ctx) => ctx.map((x) => x.toUpperCase()));
    const res = lang.query(input, query, ['foo']);
    expect(res).toEqual(['FOO', 'BAR', 'BAZ']);
  });

  describe('Handler with nodes', () => {
    type Ctx = string | null;
    let input: string;
    let query: QueryBuilder<Ctx, Node>;

    function queryResult(): Ctx {
      return lang.query(input, query, null);
    }

    test('sym', () => {
      const h = (_: Ctx, node: SymbolToken) => node.value;

      input = '';
      query = q.sym<Ctx>().handler(h);
      expect(queryResult()).toBeNull();

      input = '42';
      query = q.sym<Ctx>().handler(h);
      expect(queryResult()).toBeNull();

      input = 'foo';
      query = q.sym<Ctx>().handler(h);
      expect(queryResult()).toBe('foo');

      input = '1 foo 2';
      query = q.sym<Ctx>().handler(h);
      expect(queryResult()).toBe('foo');
    });

    test('op', () => {
      const h = (_: Ctx, node: OperatorToken) => node.value;

      input = '';
      query = q.op<Ctx>().handler(h);
      expect(queryResult()).toBeNull();

      input = 'foo';
      query = q.op<Ctx>().handler(h);
      expect(queryResult()).toBeNull();

      input = '1 foo 2';
      query = q.op<Ctx>().handler(h);
      expect(queryResult()).toBe(null);

      input = '1 + 2';
      query = q.op<Ctx>().handler(h);
      expect(queryResult()).toBe('+');
    });

    test.skip('comment', () => {
      const h = (_: Ctx, node: CommentToken) => node.value;

      input = '';
      query = q.comment<Ctx>().handler(h);
      expect(queryResult()).toBeNull();

      input = 'foo';
      query = q.comment<Ctx>().handler(h);
      expect(queryResult()).toBeNull();

      input = '1 + 2';
      query = q.comment<Ctx>().handler(h);
      expect(queryResult()).toBe(null);

      input = '# 1 + 2';
      query = q.comment<Ctx>().handler(h);
      expect(queryResult()).toBe('# 1 + 2');

      input = ['1 # 2', '3'].join('\n');
      query = q.comment<Ctx>().handler(h);
      expect(queryResult()).toBe('# 2');
    });

    test('num', () => {
      const h = (_: Ctx, node: NumberToken) => node.value;

      input = '';
      query = q.num<Ctx>().handler(h);
      expect(queryResult()).toBeNull();

      input = 'foo';
      query = q.num<Ctx>().handler(h);
      expect(queryResult()).toBeNull();

      input = '1';
      query = q.num<Ctx>().handler(h);
      expect(queryResult()).toBe('1');

      input = '1 foo 2 bar';
      query = q.num<Ctx>().handler(h);
      expect(queryResult()).toBe('2');
    });

    test('many', () => {
      const h = (_: Ctx, node: Node) =>
        node.type === 'number' ? node.value : null;

      input = '';
      query = q.many<Ctx>(q.num()).handler(h);
      expect(queryResult()).toBeNull();

      input = 'foo';
      query = q.many<Ctx>(q.num()).handler(h);
      expect(queryResult()).toBeNull();

      input = '1';
      query = q.many<Ctx>(q.num()).handler(h);
      expect(queryResult()).toBe('1');

      input = '1 2 3';
      query = q.many<Ctx>(q.num()).handler(h);
      expect(queryResult()).toBe('3');
    });

    test('opt', () => {
      const h = (_: Ctx, node: Node) =>
        node.type === 'number' || node.type === 'symbol' ? node.value : null;

      input = '';
      query = q.opt<Ctx>(q.num()).handler(h);
      expect(queryResult()).toBeNull();

      input = 'foo';
      query = q.opt<Ctx>(q.num()).handler(h);
      expect(queryResult()).toBe('foo');

      input = '1';
      query = q.opt<Ctx>(q.num()).handler(h);
      expect(queryResult()).toBe('1');

      input = '1 2 3';
      query = q.opt<Ctx>(q.num()).handler(h);
      expect(queryResult()).toBe('3');
    });

    test('tree', () => {
      const h = (_: Ctx, node: Node) => node.type;

      input = '';
      query = q.tree<Ctx>().handler(h);
      expect(queryResult()).toBeNull();

      input = '{foo}';
      query = q.tree<Ctx>().handler(h);
      expect(queryResult()).toBe('wrapped-tree');

      input = '"foo"';
      query = q.tree<Ctx>().handler(h);
      expect(queryResult()).toBe('string-tree');

      input = 'f"foo{ bar }baz"';
      query = q
        .tree<Ctx>({
          type: 'template-tree',
        })
        .handler(h);
      expect(queryResult()).toBe('template-tree');

      input = 'foo\n bar';
      query = q.tree<Ctx>().handler(h);
      expect(queryResult()).toBe('block-tree');
    });

    test('str', () => {
      const h = (_: Ctx, node: Node) => node.type;

      input = '"foo"';
      query = q.str<Ctx>().handler(h);
      expect(queryResult()).toBe('string-tree');
    });
  });
});
