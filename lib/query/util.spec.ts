import { clone, freeze } from './util';

describe('query/util', () => {
  const input = { foo: { bar: 0 } };

  it('freezes objects', () => {
    const frozen = freeze(input);
    expect(() => {
      frozen.foo.bar = 1;
    }).toThrow();
    expect(frozen).toEqual({ foo: { bar: 0 } });
  });

  it('unfreezes when cloning', () => {
    const cloned = clone(freeze(input));
    expect(() => {
      cloned.foo.bar = 1;
    }).not.toThrow();
    expect(cloned).toEqual({ foo: { bar: 1 } });
  });
});
