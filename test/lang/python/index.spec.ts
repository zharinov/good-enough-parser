import { lexerConfig as pythonConfig } from '/lang/python';
import { createLexer } from '/lexer';
import { preprocessTree } from '../../../lib/parser/tree';
import { loadInputTxt, loadOutputJson } from '#test-utils';

describe('lang/python/index', () => {
  it('parses tree', () => {
    const input = loadInputTxt('setup.py');
    const lexer = createLexer(pythonConfig);
    lexer.reset(input);
    const res = preprocessTree(lexer);
    const expected = loadOutputJson('setup.py', res);
    expect(res).toEqual(expected);
  });
});
