import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import * as q from '../builder';
import type { Checkpoint } from '../types';

const lang = createLang(pythonLang);

type Ctx = string[];

function getInitialCheckpoint(input: string): Checkpoint<Ctx> {
  return { cursor: lang.parse(input), context: [] };
}

describe('query/matchers/str-matcher', () => {
  it('handles simple string', () => {
    const input = '"foo" + "bar" + "baz"';
    const prevCheckpoint = getInitialCheckpoint(input);
    const str = q.str<Ctx>((ctx, node) => [...ctx, node.value]);
    const rootMatcher = q.tree({ manyChildren: str }).build();

    const nextCheckpoint = rootMatcher.match(prevCheckpoint);

    expect(nextCheckpoint).toMatchObject({
      context: ['foo', 'bar', 'baz'],
      endOfLevel: true,
    });
  });
});
