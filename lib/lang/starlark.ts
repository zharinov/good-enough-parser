import type { LexerConfig } from '../lexer/types';
import type { ParserConfig } from '../parser/types';
import type { LanguageConfig } from './types';

/**
 * @see https://github.com/bazelbuild/starlark/blob/master/spec.md#lexical-elements
 */

const operators =
  /* prettier-ignore */ [
  '+',    '-',    '*',    '//',    '%',    '**',
  '~',    '&',    '|',    '^',     '<<',   '>>',
  '.',    ',',    '=',    ';',     ':',
  '<',    '>',    '>=',   '<=',    '==',   '!=',
  '+=',   '-=',   '*=',   '//=',   '%=',      
  '&=',   '|=',   '^=',   '<<=',   '>>=',      
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

export const lexer: LexerConfig = {
  joinLines: '\\',
  comments: [{ type: 'line-comment', startsWith: '#' }],
  symbols: /[_a-zA-Z][_a-zA-Z0-9]*/,
  numbers,
  operators,
  brackets: [
    { startsWith: '{', endsWith: '}' },
    { startsWith: '[', endsWith: ']' },
    { startsWith: '(', endsWith: ')' },
  ],
  strings: [
    { startsWith: "'", escapeChar: '\\' },
    { startsWith: '"', escapeChar: '\\' },
    { startsWith: "'''", escapeChar: '\\' },
    { startsWith: '"""', escapeChar: '\\' },
    { startsWith: "r'", endsWith: "'" },
    { startsWith: 'r"', endsWith: '"' },
    { startsWith: "rb'", endsWith: "'" },
    { startsWith: 'rb"', endsWith: '"' },
    { startsWith: "br'", endsWith: "'" },
    { startsWith: 'br"', endsWith: '"' },
  ],
};

export const parser: ParserConfig = {
  useIndentBlocks: true,
};

export const lang: LanguageConfig = { lexer, parser };
