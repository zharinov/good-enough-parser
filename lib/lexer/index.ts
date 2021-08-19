import { states as mooStates } from 'moo';
import type { BracketOption } from './bracket';
import { configBrackets } from './bracket';
import type { CommentOption } from './comment';
import { configComments } from './comment';
import type { OperatorOption } from './operator';
import { configOperators } from './operator';
import type { StatesMap } from './rules';
import { fallbackRule } from './rules';
import type { StringOption } from './string';
import { configStrings } from './string';
import { configSymbols } from './symbol';
import { coerceToken, Token } from './token';

interface LexerConfig {
  comments: CommentOption[];
  symbols: RegExp;
  operators: OperatorOption[];
  brackets: BracketOption[];
  strings: StringOption[];
}

export function configureLexerRules(lexerConfig: LexerConfig): StatesMap {
  let result: StatesMap = {
    $: {
      newline: { t: 'regex', match: /\r?\n/, lineBreaks: true },
      whitespace: { t: 'regex', match: /[ \t\r]+/ },
      ___: fallbackRule,
    },
  };
  const { comments, symbols, operators, brackets, strings } = lexerConfig;
  result = configComments(result, comments);
  result = configSymbols(result, { match: symbols });
  result = configOperators(result, operators);
  result = configBrackets(result, brackets);
  result = configStrings(result, strings);
  return result;
}

export interface Lexer {
  reset(input?: string): Lexer;
  [Symbol.iterator](): Iterator<Token, null>;
}

export function createLexer(options: LexerConfig): Lexer {
  const rules = configureLexerRules(options);
  const mooLexer = mooStates(rules);

  const result: Lexer = {
    reset(input?: string) {
      if (typeof input === 'undefined' || input === null) {
        mooLexer.reset();
      } else {
        mooLexer.reset(input);
      }
      return result;
    },

    [Symbol.iterator]() {
      const mooIter = mooLexer[Symbol.iterator]();

      const next = (): IteratorResult<Token, null> => {
        const nextElem = mooIter.next();
        if (nextElem.done) {
          return { done: true, value: null };
        } else {
          const value = coerceToken(nextElem.value);
          return { done: false, value };
        }
      };

      return { next };
    },
  };

  return result;
}
