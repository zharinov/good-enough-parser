import { createLang } from '../../../lib/lang';
import { lang as pythonLang } from '../../../lib/lang/python';
import { loadInputTxt, loadOutputJson } from '../../test-utils';

describe('lang/python/index', () => {
  it('parses tree', () => {
    const input = loadInputTxt('setup.py');
    const lang = createLang(pythonLang);

    const res = lang.parse(input).node;

    const expected = loadOutputJson('setup.py', res);
    expect(res).toEqual(expected);
  });
});
