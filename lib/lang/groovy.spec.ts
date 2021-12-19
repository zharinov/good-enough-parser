/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { loadInputTxt, loadOutputJson } from '../../test/test-utils';
import { createLang } from '.';

const lang = createLang('groovy');

describe('lang/groovy', () => {
  test.each`
    name
    ${'groovy-01'}
    ${'groovy-02'}
    ${'groovy-03'}
    ${'groovy-04'}
    ${'groovy-05'}
  `('$name', ({ name }) => {
    const input = loadInputTxt(name);

    const res = lang.parse(input).node;

    const expected = loadOutputJson(name, res);
    expect(res).toEqual(expected);
  });
});
