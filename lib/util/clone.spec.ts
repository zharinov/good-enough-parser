import { clone } from './clone';

describe('util/clone', () => {
  describe('primitives', () => {
    it.each`
      value
      ${1}
      ${'a'}
      ${true}
      ${false}
      ${null}
      ${undefined}
    `('$value -> $value', ({ value }) => {
      const cloned = clone<unknown>(value);
      expect(cloned).toBe(value);
    });
  });

  describe('non-primitives', () => {
    it.each`
      from              | to
      ${[]}             | ${[]}
      ${[1, 2, 3]}      | ${[1, 2, 3]}
      ${{}}             | ${{}}
      ${{ a: 1, b: 2 }} | ${{ a: 1, b: 2 }}
    `('$from -> $to', ({ from, to }) => {
      const cloned = clone<unknown>(from);
      expect(cloned).toEqual(to);
      expect(cloned).not.toBe(from);
    });

    test('classes', () => {
      class Test {
        constructor(private data: { value: number }) {}

        getData(): { value: number } {
          return this.data;
        }
      }

      const a = new Test({ value: 42 });
      const b = clone(a);

      expect(b).toEqual(a);
      expect(b).not.toBe(a);
      expect(b.getData()).toEqual(a.getData());
      expect(b.getData()).not.toBe(a.getData());
    });
  });
});
