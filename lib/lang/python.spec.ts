import { loadInputTxt, loadOutputJson } from '../../test/test-utils';
import { lang as pythonLang } from './python';
import { createLang } from '.';

describe('lang/python', () => {
  test.each`
    name
    ${'setup.py'}
  `('WIP: $name', ({ name }) => {
    const input = loadInputTxt(name);
    const lang = createLang(pythonLang);
    const res = lang.parse(input).node;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const expected = loadOutputJson(name, res);
    expect(res).toEqual(expected);
  });

  test.each`
    name
    ${'blocks-01.py'}
    ${'blocks-02.py'}
    ${'blocks-03.py'}
    ${'blocks-04.py'}
    ${'setup.py'}
  `('$name', ({ name }) => {
    const input = loadInputTxt(name);
    const lang = createLang(pythonLang);
    const res = lang.parse(input).node;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const expected = loadOutputJson(name, res);
    expect(res).toEqual(expected);
  });

  it('supports line joins', () => {
    const input = loadInputTxt('line-join');
    const lang = createLang(pythonLang);

    const res = lang.parse(input)?.node;

    expect(res).toMatchObject({
      children: [
        { type: 'symbol' },
        { type: 'whitespace' },
        { type: 'symbol' },
      ],
    });
  });
});
