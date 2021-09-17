import { createLang } from '../lang';

const lang = createLang('python');

const indentedBlocks = `
if True:
  if True:
    foo
  else:
    bar
else:
  baz
`.trim();

describe('parser/tree', () => {
  it('parses empty syntax tree', () => {
    const value = '';
    const offset = 0;
    const line = 1;
    const col = 1;
    const lineBreaks = 0;

    const res = lang.parse('').node;

    expect(res).toEqual({
      type: 'root-tree',
      children: [
        { type: '_start', value, offset, line, col, lineBreaks },
        { type: '_end', value, offset, line, col, lineBreaks },
      ],
    });
  });

  it('parses single-token syntax tree', () => {
    const res = lang.parse('foobar').node;
    expect(res).toMatchObject({
      children: [
        { type: '_start' },
        { type: 'symbol', value: 'foobar' },
        { type: '_end', offset: 6, line: 1, col: 7 },
      ],
      type: 'root-tree',
    });
  });

  it('handles nesting', () => {
    const res = lang.parse('([{foobar}])').node;

    expect(res).toMatchObject({
      type: 'root-tree',
      children: [
        { type: '_start', offset: 0 },
        {
          type: 'wrapped-tree',
          startsWith: { type: 'bracket-left', value: '(', offset: 0 },
          children: [
            { type: '_start', offset: 1 },
            {
              type: 'wrapped-tree',
              startsWith: { type: 'bracket-left', value: '[', offset: 1 },
              children: [
                { type: '_start', offset: 2 },
                {
                  type: 'wrapped-tree',
                  startsWith: { type: 'bracket-left', value: '{', offset: 2 },
                  children: [
                    { type: '_start', offset: 3 },
                    {
                      type: 'symbol',
                      value: 'foobar',
                      offset: 3,
                      col: 4,
                      line: 1,
                      lineBreaks: 0,
                    },
                    { type: '_end', offset: 9 },
                  ],
                  endsWith: { type: 'bracket-right', value: '}', offset: 9 },
                },
                { type: '_end', offset: 10 },
              ],
              endsWith: { type: 'bracket-right', value: ']', offset: 10 },
            },
            { type: '_end', offset: 11 },
          ],
          endsWith: { type: 'bracket-right', value: ')', offset: 11 },
        },
        { type: '_end', offset: 12 },
      ],
    });
  });

  it('parses indented blocks as tree', () => {
    const res = lang.parse(indentedBlocks).node;
    expect(res).toMatchObject({
      type: 'root-tree',
      children: [
        { type: '_start' },
        { type: 'symbol', value: 'if' },
        { type: 'whitespace', value: ' ' },
        { type: 'symbol', value: 'True' },
        { type: 'operator', value: ':' },
        { type: 'newline', value: '\n' },
        {
          type: 'block-tree',
          children: [
            { type: '_start' },
            { type: 'whitespace', value: '  ' },
            { type: 'symbol', value: 'if' },
            { type: 'whitespace', value: ' ' },
            { type: 'symbol', value: 'True' },
            { type: 'operator', value: ':' },
            { type: 'newline', value: '\n' },
            {
              type: 'block-tree',
              children: [
                { type: '_start' },
                { type: 'whitespace', value: '    ' },
                { type: 'symbol', value: 'foo' },
                { type: 'newline', value: '\n' },
                { type: '_end' },
              ],
            },
            { type: 'whitespace', value: '  ' },
            { type: 'symbol', value: 'else' },
            { type: 'operator', value: ':' },
            { type: 'newline', value: '\n' },
            {
              type: 'block-tree',
              children: [
                { type: '_start' },
                { type: 'whitespace', value: '    ' },
                { type: 'symbol', value: 'bar' },
                { type: 'newline', value: '\n' },
                { type: '_end' },
              ],
            },
            { type: '_end' },
          ],
        },
        { type: 'symbol', value: 'else' },
        { type: 'operator', value: ':' },
        { type: 'newline', value: '\n' },
        {
          type: 'block-tree',
          children: [
            { type: '_start' },
            { type: 'whitespace', value: '  ' },
            { type: 'symbol', value: 'baz' },
            { type: '_end' },
          ],
        },
        { type: '_end' },
      ],
    });
  });
});
