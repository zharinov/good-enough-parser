import { states as mooStates } from 'moo';
import { configBrackets } from './bracket';
import { configComments } from './comment';
import { configNumbers } from './number';
import { configOperators } from './operator';
import { fallbackRule } from './rules';
import { configStrings } from './string';
import { configSymbols } from './symbol';
import { coerceToken } from './token';
import type { Lexer, LexerConfig, RegexRule, StatesMap, Token } from './types';

export * from './token';

export function configureLexerRules(lexerConfig: LexerConfig): StatesMap {
  const whitespace: RegexRule = lexerConfig.joinLines
    ? {
        t: 'regex',
        match: new RegExp(`(?:${lexerConfig.joinLines}\\r?\\n|[ \\t\\r])+`),
        lineBreaks: true,
      }
    : { t: 'regex', match: /[ \t\r]+/ };

  let result: StatesMap = {
    $: {
      whitespace,
      newline: { t: 'regex', match: /\r?\n/, lineBreaks: true },
      _: fallbackRule,
    },
  };

  const { comments, symbols, operators, brackets, strings, numbers } =
    lexerConfig;
  result = configComments(result, comments);
  result = configSymbols(result, { match: symbols });
  result = configOperators(result, operators);
  result = configBrackets(result, brackets);
  result = configStrings(result, strings);
  result = configNumbers(result, { match: numbers });
  return result;
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
