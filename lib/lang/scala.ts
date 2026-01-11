import type { LexerConfig, TemplateOption } from '../lexer/types';
import type { ParserConfig } from '../parser/types';
import type { LanguageConfig } from './types';

const operators =
  /* prettier-ignore */ [
  '+', '-', '*', '/', '%', '%%', '%%%', '**',
  '++', '--',
  '+=', '++=', '-=', '*=', '/=', '%=', '**=',
  '==', '!=', '<', '<=', '>', '>=', '===', '!==', '<=>',
  '&&', '||', '!',
  '&', '|', '^', '~',
  '<<', '>>', '>>>',
  '?', '?:',
  ':=', '=', '?=',
  '.', '?.', '.@', '.&', '::', ':::',
  '=~', '==~',
  '*.', ':',
  '..', '..<',
  '<>',
  '<<=', '>>=', '>>>=', '&=', '^=', '|=', '?=',
  '->',
  ',', ';',
];

const octdigit = '[0-7]';
const digit = '[0-9]';
const nonzerodigit = '[1-9]';
const hexdigit = `(?:${digit}|[a-fA-F])`;

const octinteger = `(?:0[oO](?:_?${octdigit})+)`;
const hexinteger = `(?:0[xX](?:_?${hexdigit})+)`;
const decinteger = `(?:${nonzerodigit}(?:_?${digit})*|0+(?:_?0)*)`;
const integer = `(?:${decinteger}|${octinteger}|${hexinteger})`;

const digitpart = `(?:${digit}(?:_?${digit})*)`;
const fraction = `(?:\\.${digitpart})`;
const exponent = `(?:[eE][-+]?${digitpart})`;
const pointfloat = `(?:${digitpart}?${fraction}|${digitpart}\\.)`;
const exponentfloat = `(?:(?:${digitpart}|${pointfloat})${exponent})`;
const floatnumber = `(?:${pointfloat}|${exponentfloat})`;

const numbers = new RegExp(`(?:${integer}|${floatnumber})`);

const templates: TemplateOption[] = [
  {
    type: 'var',
    startsWith: '$',
    symbols: /[a-zA-Z_][a-zA-Z0-9_]+/,
  },
  { type: 'expr', startsWith: '${', endsWith: '}' },
];

export const lexer: LexerConfig = {
  joinLines: '\\',
  comments: [
    { type: 'line-comment', startsWith: '//' },
    { type: 'multiline-comment', startsWith: '/*', endsWith: '*/' },
  ],
  symbols: /[_a-zA-Z][_a-zA-Z0-9]*/,
  numbers,
  operators,
  brackets: [
    { startsWith: '{', endsWith: '}' },
    { startsWith: '[', endsWith: ']' },
    { startsWith: '(', endsWith: ')' },
  ],
  strings: [
    { startsWith: '"', escapeChar: '\\' },
    { startsWith: 'raw"', endsWith: '"' },
    { startsWith: 's"', templates, endsWith: '"', escapeChar: '\\' },
    { startsWith: 'f"', templates, endsWith: '"', escapeChar: '\\' },
  ],
};

export const parser: ParserConfig = {
  useIndentBlocks: false,
};

export const lang: LanguageConfig = { lexer, parser };
