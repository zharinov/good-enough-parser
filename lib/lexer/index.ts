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

interface LexerConfig {
  comments: CommentOption[];
  symbols: RegExp;
  operators: OperatorOption[];
  brackets: BracketOption[];
  strings: StringOption[];
}

export function configureLexer(config: LexerConfig): StatesMap {
  let result: StatesMap = {
    $: {
      newline: { t: 'regex', match: /\r?\n/, lineBreaks: true },
      whitespace: { t: 'regex', match: /[ \t\r]+/ },
      ___: fallbackRule,
    },
  };

  result = configComments(result, config.comments);
  result = configSymbols(result, { match: config.symbols });
  result = configOperators(result, config.operators);
  result = configBrackets(result, config.brackets);
  result = configStrings(result, config.strings);

  return result;
}
