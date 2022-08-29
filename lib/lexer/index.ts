import {
  Lexer as MooLexer,
  Token as MooToken,
  compile as mooCompile,
  states as mooStates,
} from 'moo';
import { configBrackets } from './bracket';
import { configComments } from './comment';
import { configNumbers } from './number';
import { configOperators } from './operator';
import { createOrderedStateMap, fallbackRule } from './rules';
import { configStrings } from './string';
import { configSymbols } from './symbol';
import { coerceToken } from './token';
import type {
  Lexer,
  LexerConfig,
  OrderedStatesMap,
  RegexRule,
  StatesMap,
  Token,
} from './types';

export * from './token';
export * from './types';

export function configureLexerRules(
  lexerConfig: LexerConfig
): OrderedStatesMap {
  const whitespace: RegexRule = lexerConfig.joinLines
    ? {
        t: 'regex',
        type: 'whitespace',
        match: new RegExp(`(?:${lexerConfig.joinLines}\\r?\\n|[ \\t\\r])+`),
        lineBreaks: true,
        chunk: null,
      }
    : {
        t: 'regex',
        type: 'whitespace',
        match: /[ \t\r]+/,
        chunk: null,
      };

  let result: StatesMap = {
    $: {
      whitespace,
      newline: {
        t: 'regex',
        type: 'newline',
        match: /\r?\n/,
        chunk: null,
        lineBreaks: true,
      },
      _: { ...fallbackRule, type: '_' },
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

  const orderedResult = createOrderedStateMap(result);
  return orderedResult;
}

function isVarToken(key: unknown): key is string {
  return typeof key === 'string' && /^str\$\d+\$tpl\$\d+\$token$/.test(key);
}

function getVarEndToken({
  type,
  value,
  offset,
  line,
  col,
  lineBreaks,
}: MooToken): MooToken {
  return {
    type: type?.replace(/\$[^$]+$/, '$end'),
    value: '',
    text: '',
    offset: offset + value.length,
    line: line + lineBreaks,
    col: col + value.length,
    lineBreaks: 0,
  };
}

function getSubLexers(states: OrderedStatesMap): Record<string, MooLexer> {
  const result: Record<string, MooLexer> = {};
  for (const [key, rules] of Object.entries(states)) {
    if (isVarToken(key)) {
      result[key] = mooCompile(rules as never);
    }
  }
  return result;
}

export function createLexer(options: LexerConfig): Lexer {
  const rules = configureLexerRules(options);
  const subLexers = getSubLexers(rules);
  const mainLexer = mooStates(rules as never);

  let subLexer: MooLexer | undefined;
  let subLexerToken: MooToken | undefined;

  const result: Lexer = {
    reset(input?: string) {
      Object.values(subLexers).forEach((subLexer) => subLexer.reset());
      subLexer = undefined;
      subLexerToken = undefined;
      if (typeof input === 'undefined' || input === null) {
        mainLexer.reset();
      } else {
        mainLexer.reset(input);
      }
      return result;
    },

    [Symbol.iterator]() {
      const next = (): IteratorResult<Token, null> => {
        const mooLexer = subLexer ?? mainLexer;
        const mooIter = mooLexer[Symbol.iterator]();
        const nextElem = mooIter.next();

        if (nextElem.done) {
          if (subLexer && subLexerToken) {
            const subLexerType = subLexerToken.type;
            mooLexer.reset();
            if (isVarToken(subLexerType)) {
              const x = getVarEndToken(subLexerToken);
              const value = coerceToken(x);
              subLexer = undefined;
              subLexerToken = undefined;
              return { done: false, value };
            } else {
              subLexer = undefined;
              subLexerToken = undefined;
              return next();
            }
          } else {
            return { done: true, value: null };
          }
        }

        const mooToken = nextElem.value;
        if (!subLexer) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const mooTokenType = mooToken.type!;
          subLexer = subLexers[mooTokenType];
          if (subLexer) {
            subLexerToken = mooToken;
            subLexer.reset(mooToken.value);
            return next();
          }
        }

        const value = coerceToken(mooToken, subLexerToken);
        return { done: false, value };
      };

      return { next };
    },
  };

  return result;
}
