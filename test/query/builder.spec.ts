/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as builder from '/query/builder';
import { SeqMatcher } from '/query/matchers';

describe('query/builder', () => {
  describe('Symbol builder', () => {
    const handler = (x: unknown) => x;

    test.each`
      arg1                         | arg2         | sym      | handler
      ${undefined}                 | ${undefined} | ${null}  | ${null}
      ${'foo'}                     | ${undefined} | ${'foo'} | ${null}
      ${{ value: 'foo' }}          | ${undefined} | ${'foo'} | ${null}
      ${/abc/}                     | ${undefined} | ${/abc/} | ${null}
      ${{ value: /abc/ }}          | ${undefined} | ${/abc/} | ${null}
      ${'foo'}                     | ${handler}   | ${'foo'} | ${expect.any(Function) as never}
      ${{ value: 'foo', handler }} | ${undefined} | ${'foo'} | ${expect.any(Function) as never}
      ${handler}                   | ${undefined} | ${null}  | ${expect.any(Function) as never}
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
    const handler = (x: unknown) => x;

    test.each`
      arg1                        | arg2         | num        | handler
      ${undefined}                | ${undefined} | ${null}    | ${null}
      ${'42'}                     | ${undefined} | ${'42'}    | ${null}
      ${{ value: '42' }}          | ${undefined} | ${'42'}    | ${null}
      ${/[1-9]/}                  | ${undefined} | ${/[1-9]/} | ${null}
      ${{ value: /[1-9]/ }}       | ${undefined} | ${/[1-9]/} | ${null}
      ${'42'}                     | ${handler}   | ${'42'}    | ${expect.any(Function) as never}
      ${{ value: '42', handler }} | ${undefined} | ${'42'}    | ${expect.any(Function) as never}
      ${handler}                  | ${undefined} | ${null}    | ${expect.any(Function) as never}
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
    const handler = (x: unknown) => x;

    test.each`
      arg1                        | arg2         | op        | handler
      ${undefined}                | ${undefined} | ${null}   | ${null}
      ${'++'}                     | ${undefined} | ${'++'}   | ${null}
      ${{ value: '++' }}          | ${undefined} | ${'++'}   | ${null}
      ${/===?/}                   | ${undefined} | ${/===?/} | ${null}
      ${{ value: /===?/ }}        | ${undefined} | ${/===?/} | ${null}
      ${'++'}                     | ${handler}   | ${'++'}   | ${expect.any(Function) as never}
      ${{ value: '++', handler }} | ${undefined} | ${'++'}   | ${expect.any(Function) as never}
      ${handler}                  | ${undefined} | ${null}   | ${expect.any(Function) as never}
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
});
