import { lang as pythonLang } from '/lang/python';
import { loadInputTxt, loadOutputJson } from '#test-utils';
import { createLang } from '/lang';

describe('lang/python/index', () => {
  it('parses tree', () => {
    const input = loadInputTxt('setup.py');
    const lang = createLang(pythonLang);

    const res = lang.parse(input).node;

    const expected = loadOutputJson('setup.py', res);
    expect(res).toEqual(expected);
  });
});
