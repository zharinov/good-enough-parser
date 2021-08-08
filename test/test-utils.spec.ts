import { loadFixture } from './test-utils';

describe(nameof(loadFixture), () => {
  it('works', () => {
    const x = loadFixture('empty.in.txt');
    expect(x).toBeFalsy();
  });
});
