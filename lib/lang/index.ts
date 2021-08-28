import type { LanguageConfig } from './types';
import { createLexer } from '/lexer';
import type { Lexer } from '/lexer/types';
import { createCursor, createTree } from '/parser';
import type { Cursor } from '/parser/types';

export class Language {
  private lexer: Lexer;

  constructor(readonly config: LanguageConfig) {
    this.lexer = createLexer(config.lexer);
  }

  parse(input: string): Cursor {
    this.lexer.reset(input);
    const root = createTree(this.lexer, this.config.parser);
    return createCursor(root);
  }
}

export function createLang(config: LanguageConfig): Language {
  return new Language(config);
}
