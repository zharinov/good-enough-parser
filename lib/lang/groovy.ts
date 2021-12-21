import type { LexerConfig, TemplateOption } from '../lexer/types';
import type { ParserConfig } from '../parser/types';
import type { LanguageConfig } from './types';

/**
 * @see https://docs.groovy-lang.org/latest/html/documentation/#groovy-operators
 */
const operators =
  /* prettier-ignore */ [
  '+', '-', '*', '/', '%', '**',
  '++', '--',
  '+=', '-=', '*=', '/=', '%=', '**=',
  '==', '!=', '<', '<=', '>', '>=', '===', '!==', '<=>',
  '&&', '||', '!',
  '&', '|', '^', '~',
  '<<', '>>', '>>>',
  '?', '?:',
  '=', '?=',
  '.', '?.', '.@', '.&', '::',
  '=~', '==~',
  '*.', ':',
  '..', '..<',
  '<>',
  '<<=', '>>=', '>>>=', '&=', '^=', '|=', '?=',
  '->',
  ',', ';',
];

/**
 * Borrowed from Python implementation:
 *
 * @see https://docs.python.org/3/reference/lexical_analysis.html#numeric-literals
 */
const bindigit = '[01]';
const octdigit = '[0-7]';
const digit = '[0-9]';
const nonzerodigit = '[1-9]';
const hexdigit = `(?:${digit}|[a-fA-F])`;

const bininteger = `(?:0[bB](?:_?${bindigit})+)`;
const octinteger = `(?:0[oO](?:_?${octdigit})+)`;
const hexinteger = `(?:0[xX](?:_?${hexdigit})+)`;
const decinteger = `(?:${nonzerodigit}(?:_?${digit})*|0+(?:_?0)*)`;
const integer = `(?:${decinteger}|${bininteger}|${octinteger}|${hexinteger})`;

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
    operators: ['.'],
  },
  { type: 'expr', startsWith: '${', endsWith: '}' },
];

export const lexer: LexerConfig = {
  joinLines: '\\',
  comments: [
    { type: 'line-comment', startsWith: '#!' },
    { type: 'line-comment', startsWith: '//' },
    { type: 'multiline-comment', startsWith: '/*', endsWith: '*/' },
  ],
  symbols: /[a-zA-Z$_][a-zA-Z0-9$_]+/,
  numbers,
  operators,
  brackets: [
    { startsWith: '{', endsWith: '}' },
    { startsWith: '[', endsWith: ']' },
    { startsWith: '(', endsWith: ')' },
  ],
  strings: [
    { startsWith: "'" },
    { startsWith: "'''" },
    { startsWith: '"', templates },
    { startsWith: '"""', templates },
  ],
};

export const parser: ParserConfig = {
  useIndentBlocks: false,
};

export const lang: LanguageConfig = { lexer, parser };
