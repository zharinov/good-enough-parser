import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import { Token } from '../../lexer/types';
import * as q from '../builder';

const lang = createLang(pythonLang);

type Ctx = string[];

describe('query/matchers/str-matcher', () => {
  const handler = (ctx: Ctx, node: Token) => [...ctx, node.value];

  it('handles any string match', () => {
    const input = '"foobar"';
    const query = q.str<Ctx>(handler);

    const res = lang.query(input, query, []);

    expect(res).toEqual(['foobar']);
  });

  it('handles exact string match', () => {
    const input = '"foobar"';
    const query = q.str<Ctx>('foobar', handler);

    const res = lang.query(input, query, []);

    expect(res).toEqual(['foobar']);
  });

  it('handles string sequence match', () => {
    const input = '"foo" "bar" "baz"';
    const query = q.str<Ctx>(handler).str(handler).str(handler);

    const res = lang.query(input, query, []);

    expect(res).toEqual(['foo', 'bar', 'baz']);
  });

  it('handles regex match', () => {
    const input = '"foobarbaz"';
    const query = q.str<Ctx>(/bar/, handler);
    const res = lang.query(input, query, []);
    expect(res).toEqual(['foobarbaz']);
  });

  it('handles empty string match', () => {
    const input = '""';
    const query = q.str<Ctx>('', handler);
    const res = lang.query(input, query, []);
    expect(res).toEqual(['']);
  });

  it('handles empty match list', () => {
    const input = '""';
    const query = q.str<Ctx>({
      match: [],
      postHandler: (ctx) => [...ctx, 'it works'],
    });
    const res = lang.query(input, query, []);
    expect(res).toEqual(['it works']);
  });

  it('handles different string types', () => {
    const input = '"foo" + \'bar\' + """baz"""';
    const query = q.str<Ctx>(handler);
    const res = lang.query(input, query, []);
    expect(res).toEqual(['foo', 'bar', 'baz']);
  });

  it('handles template strings', () => {
    const input = 'f"foo{ bar }baz"';
    const query = q.str<Ctx>({
      match: [q.str(handler), q.sym(handler), q.str(handler)],
    });
    const res = lang.query(input, query, []);
    expect(res).toEqual(['foo', 'bar', 'baz']);
  });
});
