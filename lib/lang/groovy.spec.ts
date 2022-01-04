/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { query as q } from '..';
import { loadInputTxt, loadOutputJson } from '../../test/test-utils';
import type { Token } from '../lexer/types';
import { createLang } from '.';

const lang = createLang('groovy');

type TestCtx = string[];

function h(ctx: TestCtx, { value }: Token): TestCtx {
  return [...ctx, value];
}

describe('lang/groovy', () => {
  test.each`
    name
    ${'groovy-01'}
    ${'groovy-02'}
    ${'groovy-03'}
    ${'groovy-04'}
    ${'groovy-05'}
    ${'groovy-06'}
    ${'groovy-07'}
    ${'groovy-08'}
  `('$name', ({ name }) => {
    const input = loadInputTxt(name);

    const res = lang.parse(input).node;

    const expected = loadOutputJson(name, res);
    expect(res).toEqual(expected);
  });

  test.each`
    source           | query                                  | result
    ${'foo'}         | ${q.sym(h)}                            | ${['foo']}
    ${'foo "bar"'}   | ${q.sym(h).str(h)}                     | ${['foo', 'bar']}
    ${'"bar"'}       | ${q.str(h)}                            | ${['bar']}
    ${'"foo" "bar"'} | ${q.str(h).str(h)}                     | ${['foo', 'bar']}
    ${'foo ='}       | ${q.sym(h).op('=', h)}                 | ${['foo', '=']}
    ${'foo = "bar"'} | ${q.sym(h).op('=', h).str(h)}          | ${['foo', '=', 'bar']}
    ${'foo("bar")'}  | ${q.sym(h).tree({ search: q.str(h) })} | ${['foo', 'bar']}
    ${'foo ("bar")'} | ${q.sym(h).tree({ search: q.str(h) })} | ${['foo', 'bar']}
  `('$source -> $result', ({ source, query, result }) => {
    const res = lang.query(source, query, []);
    expect(res).toEqual(result);
  });
});
