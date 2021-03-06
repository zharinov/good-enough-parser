import type { LexerConfig } from '../lexer/types';
import type { ParserConfig } from '../parser/types';

export interface LanguageConfig {
  lexer: LexerConfig;
  parser: ParserConfig;
}
