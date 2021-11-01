/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as builder from '../../lib/query/builder';
import { SeqMatcher, SymMatcher } from '../../lib/query/matchers';
import * as _util from './util';

jest.mock('./util');
const util = _util as jest.Mocked<typeof _util>;
const defaultHandler = (x: unknown) => x;
const someHandler = (x: unknown) => (x ? x : x);
util.coerceHandler.mockImplementation((fn) => (fn ? fn : defaultHandler));

describe('query/builder', () => {
  describe('Symbol builder', () => {
    test.each`
      arg1                                      | arg2           | sym      | handler
      ${undefined}                              | ${undefined}   | ${null}  | ${defaultHandler}
      ${'foo'}                                  | ${undefined}   | ${'foo'} | ${defaultHandler}
      ${{ value: 'foo' }}                       | ${undefined}   | ${'foo'} | ${defaultHandler}
      ${/abc/}                                  | ${undefined}   | ${/abc/} | ${defaultHandler}
      ${{ value: /abc/ }}                       | ${undefined}   | ${/abc/} | ${defaultHandler}
      ${'foo'}                                  | ${someHandler} | ${'foo'} | ${someHandler}
      ${{ value: 'foo', handler: someHandler }} | ${undefined}   | ${'foo'} | ${someHandler}
      ${someHandler}                            | ${undefined}   | ${null}  | ${someHandler}
    `('sym($arg1, $arg2)', ({ arg1, arg2, sym, handler }) => {
      let b1;
      let b2;

      if (arg2) {
        b1 = builder.sym(arg1, arg2);
        b2 = b1.sym(arg1, arg2);
      } else if (arg1) {
        b1 = builder.sym(arg1);
        b2 = b1.sym(arg1);
      } else {
        b1 = builder.sym();
        b2 = b1.sym();
      }

      const expected = { sym, handler };

      expect(b1.build()).toEqual(expected);
      expect(b2.build()).toMatchObject({ seq: [expected, expected] });
    });
  });

  describe('Number builder', () => {
    test.each`
      arg1                                     | arg2           | num        | handler
      ${undefined}                             | ${undefined}   | ${null}    | ${defaultHandler}
      ${'42'}                                  | ${undefined}   | ${'42'}    | ${defaultHandler}
      ${{ value: '42' }}                       | ${undefined}   | ${'42'}    | ${defaultHandler}
      ${/[1-9]/}                               | ${undefined}   | ${/[1-9]/} | ${defaultHandler}
      ${{ value: /[1-9]/ }}                    | ${undefined}   | ${/[1-9]/} | ${defaultHandler}
      ${'42'}                                  | ${someHandler} | ${'42'}    | ${someHandler}
      ${{ value: '42', handler: someHandler }} | ${undefined}   | ${'42'}    | ${someHandler}
      ${someHandler}                           | ${undefined}   | ${null}    | ${someHandler}
    `('sym($arg1, $arg2)', ({ arg1, arg2, num, handler }) => {
      let b1;
      let b2;

      if (arg2) {
        b1 = builder.num(arg1, arg2);
        b2 = b1.num(arg1, arg2);
      } else if (arg1) {
        b1 = builder.num(arg1);
        b2 = b1.num(arg1);
      } else {
        b1 = builder.num();
        b2 = b1.num();
      }

      const expected = { num, handler };

      expect(b1.build()).toEqual(expected);
      expect(b2.build()).toMatchObject({ seq: [expected, expected] });
    });
  });

  describe('Operator builder', () => {
    test.each`
      arg1                                     | arg2           | op        | handler
      ${undefined}                             | ${undefined}   | ${null}   | ${defaultHandler}
      ${'++'}                                  | ${undefined}   | ${'++'}   | ${defaultHandler}
      ${{ value: '++' }}                       | ${undefined}   | ${'++'}   | ${defaultHandler}
      ${/===?/}                                | ${undefined}   | ${/===?/} | ${defaultHandler}
      ${{ value: /===?/ }}                     | ${undefined}   | ${/===?/} | ${defaultHandler}
      ${'++'}                                  | ${someHandler} | ${'++'}   | ${someHandler}
      ${{ value: '++', handler: someHandler }} | ${undefined}   | ${'++'}   | ${someHandler}
      ${someHandler}                           | ${undefined}   | ${null}   | ${someHandler}
    `('op($arg1, $arg2)', ({ arg1, arg2, op, handler }) => {
      let b1;
      let b2;

      if (arg2) {
        b1 = builder.op(arg1, arg2);
        b2 = b1.op(arg1, arg2);
      } else if (arg1) {
        b1 = builder.op(arg1);
        b2 = b1.op(arg1);
      } else {
        b1 = builder.op();
        b2 = b1.op();
      }

      const expected = { op, handler };

      expect(b1.build()).toEqual(expected);
      expect(b2.build()).toMatchObject({ seq: [expected, expected] });
    });
  });

  describe('Sequence builder', () => {
    it('constructs sequence matcher by method chain', () => {
      const matcher = builder.sym('foo').op('.').sym('bar').build();
      expect(matcher).toBeInstanceOf(SeqMatcher);
      expect(matcher).toMatchObject({
        length: 3,
        seq: [{ sym: 'foo' }, { op: '.' }, { sym: 'bar' }],
      });
    });
  });

  describe('Repetition builders', () => {
    const foo = builder.sym('foo');
    const bar = builder.sym('bar');

    describe('many', () => {
      it('repeat from 1 to infinity times by default', () => {
        const matcher = builder.many(foo).many(bar).build();
        expect(matcher).toMatchObject({
          seq: [
            { manyOf: { sym: 'foo' }, min: 1, max: null },
            { manyOf: { sym: 'bar' }, min: 1, max: null },
          ],
        });
      });

      it('explicit boundaries', () => {
        const matcher = builder.many(foo, 2, 3).many(bar, 4, 5).build();
        expect(matcher).toMatchObject({
          seq: [
            { manyOf: { sym: 'foo' }, min: 2, max: 3 },
            { manyOf: { sym: 'bar' }, min: 4, max: 5 },
          ],
        });
      });
    });

    describe('opt', () => {
      it('zero or one', () => {
        const matcher = builder.opt(foo).opt(bar).build();
        expect(matcher).toMatchObject({
          seq: [
            { manyOf: { sym: 'foo' }, min: 0, max: 1 },
            { manyOf: { sym: 'bar' }, min: 0, max: 1 },
          ],
        });
      });
    });
  });

  describe('Alternatives builder', () => {
    it('builds alternative matcher', () => {
      const foo = builder.sym('foo');
      const bar = builder.sym('bar');
      const baz = builder.sym('baz');
      const qux = builder.sym('qux');
      const matcher = builder.alt(foo, bar).alt(baz, qux).build();
      expect(matcher).toMatchObject({
        seq: [
          { alts: [{ sym: 'foo' }, { sym: 'bar' }] },
          { alts: [{ sym: 'baz' }, { sym: 'qux' }] },
        ],
      });
    });
  });

  describe('Trees builder', () => {
    const foo = builder.sym('foo');

    test.each`
      arg1                                         | type           | preHandler        | postHandler       | matcher
      ${undefined}                                 | ${null}        | ${defaultHandler} | ${undefined}      | ${null}
      ${'root-tree'}                               | ${'root-tree'} | ${defaultHandler} | ${undefined}      | ${null}
      ${{ type: 'root-tree' }}                     | ${'root-tree'} | ${defaultHandler} | ${undefined}      | ${null}
      ${{ preHandler: someHandler }}               | ${null}        | ${someHandler}    | ${undefined}      | ${null}
      ${{ search: foo }}                           | ${null}        | ${defaultHandler} | ${defaultHandler} | ${expect.any(SymMatcher)}
      ${{ search: foo, postHandler: someHandler }} | ${null}        | ${defaultHandler} | ${someHandler}    | ${null}
      ${{ search: foo }}                           | ${null}        | ${defaultHandler} | ${defaultHandler} | ${expect.any(SymMatcher)}
      ${{ search: foo, postHandler: someHandler }} | ${null}        | ${defaultHandler} | ${someHandler}    | ${expect.any(SymMatcher)}
    `('tree($arg1)', ({ arg1, type, preHandler, postHandler, matcher }) => {
      const treeSeq = arg1
        ? builder.tree(arg1).tree(arg1)
        : builder.tree().tree();
      const expected = {
        type,
        preHandler,
        ...(postHandler && { postHandler }),
        ...(matcher && { matcher }),
      };
      expect(treeSeq.build()).toMatchObject({ seq: [expected, expected] });
    });
  });

  describe('String builder', () => {
    it('handles empty argument list', () => {
      const matcher = builder.str().build();
      expect(matcher).toEqual({
        matchers: null,
        preHandler: defaultHandler,
        postHandler: defaultHandler,
      });
    });

    it('handles exact string parameter', () => {
      const matcher = builder.str('foobar').build();
      expect(matcher).toMatchObject({
        matchers: [{ content: 'foobar' }],
      });
    });

    it('handles empty string parameter', () => {
      const matcher = builder.str('').build();
      expect(matcher).toMatchObject({
        matchers: [],
      });
    });

    it('handles empty string with wrapped handler', () => {
      const matcher = builder.str('', someHandler).build();
      expect(matcher).toMatchObject({
        matchers: [],
        preHandler: defaultHandler,
        postHandler: expect.any(Function),
      });
      expect(matcher.postHandler).not.toBe(defaultHandler);
    });

    it('handles exact string with handler', () => {
      const matcher = builder.str('foobar', someHandler).build();
      expect(matcher).toMatchObject({
        matchers: [{ content: 'foobar', handler: someHandler }],
      });
    });

    it('handles single regex parameter', () => {
      const pattern = /foobar/;
      const matcher = builder.str(pattern).build();
      expect(matcher).toMatchObject({
        matchers: [{ content: pattern }],
      });
    });

    it('handles regex parameter with handler', () => {
      const pattern = /foobar/;
      const matcher = builder.str(pattern, someHandler).build();
      expect(matcher).toMatchObject({
        matchers: [{ content: pattern, handler: someHandler }],
      });
    });

    it('handles multiple substrings', () => {
      const config = { match: ['foo', 'bar', 'baz'] };
      const matcher = builder.str(config).build();
      expect(matcher).toMatchObject({
        matchers: [{ content: 'foo' }, { content: 'bar' }, { content: 'baz' }],
      });
    });

    it('configures pre-handler', () => {
      const config = { preHandler: someHandler };
      const matcher = builder.str(config).build();
      expect(matcher).toMatchObject({ preHandler: someHandler });
    });

    it('configures post-handler', () => {
      const config = { postHandler: someHandler };
      const matcher = builder.str(config).build();
      expect(matcher).toMatchObject({ postHandler: someHandler });
    });

    it('handles templates', () => {
      const config = { match: ['foo', builder.sym('bar'), 'baz'] };
      const matcher = builder.str(config).build();
      expect(matcher).toMatchObject({
        matchers: [
          { content: 'foo' },
          { matcher: { sym: 'bar' } },
          { content: 'baz' },
        ],
      });
    });

    it('unwraps nested strings', () => {
      const foo = builder.str('foo');
      const bar = builder.str('bar');
      const config = { match: [foo, bar] };

      const matcher = builder.str(config).build();

      expect(matcher).toMatchObject({
        matchers: [{ content: 'foo' }, { content: 'bar' }],
      });
    });
  });
});
