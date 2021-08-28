import type { Token as MooToken } from 'moo';
import { coerceToken } from '../../lib/lexer/token';

describe('lexer/token', () => {
  it('pre-defined type', () => {
    const mooToken = {
      type: 'symbol',
      value: 'foobar',
      offset: 0,
    } as MooToken;
    const res = coerceToken(mooToken);
    expect(res).toMatchObject({ type: 'symbol' });
  });

  it('missing type', () => {
    const mooToken = { value: 'foobar', offset: 0 } as MooToken;
    const res = coerceToken(mooToken);
    expect(res).toMatchObject({ type: '_' });
  });
});
