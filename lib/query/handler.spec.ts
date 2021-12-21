import { safeHandler } from './handler';

describe('query/handler', () => {
  it('wraps handler', () => {
    const ctx = [1, 2, 3];

    const handler = (ctx: number[]) => {
      ctx.push(4);
      return ctx;
    };

    const wrappedHandler = safeHandler(handler);

    const res = wrappedHandler(ctx, null as never);

    expect(ctx).toEqual([1, 2, 3]);
    expect(res).toEqual([1, 2, 3, 4]);
  });
});
