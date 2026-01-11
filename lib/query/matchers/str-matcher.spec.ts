import { createLang } from '../../lang';
import { lang as pythonLang } from '../../lang/python';
import type { Token } from '../../lexer/types';
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

  describe('escaping', () => {
    it('handles escaped quotes in strings', () => {
      const input = '"hello \\"world\\""';
      const query = q.str<Ctx>(handler);
      const res = lang.query(input, query, []);
      expect(res).toEqual(['hello \\"world\\"']);
    });

    it('handles escaped backslashes in strings', () => {
      const input = '"path\\\\to\\\\file"';
      const query = q.str<Ctx>(handler);
      const res = lang.query(input, query, []);
      expect(res).toEqual(['path\\\\to\\\\file']);
    });

    it('handles escape sequences in strings', () => {
      const input = '"hello\\nworld"';
      const query = q.str<Ctx>(handler);
      const res = lang.query(input, query, []);
      expect(res).toEqual(['hello\\nworld']);
    });

    it('handles raw strings', () => {
      const input = 'r"hello \\" + "world"';
      const query = q.str<Ctx>(handler);
      const res = lang.query(input, query, []);
      expect(res).toEqual(['hello \\', 'world']);
    });

    it('handles unicode escapes', () => {
      const input = '"\\u0041\\u0042"';
      const query = q.str<Ctx>(handler);
      const res = lang.query(input, query, []);
      expect(res).toEqual(['\\u0041\\u0042']);
    });
  });
});
