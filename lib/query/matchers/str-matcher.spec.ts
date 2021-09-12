import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import { Token } from '../../lexer/types';
import * as q from '../builder';
import type { Checkpoint } from '../types';

const lang = createLang(pythonLang);

type Ctx = string[];

function getInitialCheckpoint(input: string): Checkpoint<Ctx> {
  return { cursor: lang.parse(input), context: [] };
}

describe('query/matchers/str-matcher', () => {
  const handler = (ctx: Ctx, node: Token) => [...ctx, node.value];

  it('handles simple string', () => {
    const input = '"foo" + "bar" + "baz"';
    const prevCheckpoint = getInitialCheckpoint(input);

    const ctx = q
      .tree({ search: q.str<Ctx>(handler) })
      .build()
      .match(prevCheckpoint)?.context;

    expect(ctx).toEqual(['foo', 'bar', 'baz']);
  });

  it('handles exact match', () => {
    const input = '"foobar"';
    const prevCheckpoint = getInitialCheckpoint(input);

    const ctx = q
      .tree({ search: q.str<Ctx>('foobar', handler) })
      .build()
      .match(prevCheckpoint)?.context;

    expect(ctx).toEqual(['foobar']);
  });

  it('handles regex match', () => {
    const input = '"foobarbaz"';
    const prevCheckpoint = getInitialCheckpoint(input);

    const ctx = q
      .tree({ search: q.str<Ctx>(/bar/, handler) })
      .build()
      .match(prevCheckpoint)?.context;

    expect(ctx).toEqual(['foobarbaz']);
  });

  it('handles empty string match', () => {
    const input = '""';
    const prevCheckpoint = getInitialCheckpoint(input);

    const ctx = q
      .tree({ search: q.str<Ctx>('', handler) })
      .build()
      .match(prevCheckpoint)?.context;

    expect(ctx).toEqual(['']);
  });

  it('handles empty match list', () => {
    const input = '""';
    const prevCheckpoint = getInitialCheckpoint(input);

    const ctx = q
      .tree({
        search: q.str<Ctx>({
          match: [],
          postHandler: (ctx) => [...ctx, 'it works'],
        }),
      })
      .build()
      .match(prevCheckpoint)?.context;

    expect(ctx).toEqual(['it works']);
  });

  it('handles template strings', () => {
    const input = 'f"foo{ bar }baz"';
    const checkpoint = getInitialCheckpoint(input);

    const ctx = q
      .tree({
        search: q.str({
          match: [
            q.str<Ctx>(handler),
            q.sym<Ctx>(handler),
            q.str<Ctx>(handler),
          ],
        }),
      })
      .build()
      .match(checkpoint)?.context;

    expect(ctx).toEqual(['foo', 'bar', 'baz']);
  });
});
