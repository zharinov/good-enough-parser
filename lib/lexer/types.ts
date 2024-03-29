export interface OptionBase {
  startsWith: string;
}

export interface BracketOption extends OptionBase {
  endsWith: string;
}

export interface LineCommentOption extends OptionBase {
  type: 'line-comment';
}

export interface MultilineCommentOption extends OptionBase {
  type: 'multiline-comment';
  endsWith: string;
}

export type CommentOption = LineCommentOption | MultilineCommentOption;

export type OperatorOption = string;

export interface VariableTemplateOption extends OptionBase {
  type: 'var';
  symbols?: RegExp;
  operators?: string[];
}

export interface ExpressionTemplateOption extends OptionBase {
  type: 'expr';
  endsWith: string;
}

export type TemplateOption = VariableTemplateOption | ExpressionTemplateOption;

export interface StringOption extends OptionBase {
  endsWith?: string;
  templates?: TemplateOption[];
}

export interface SymbolOption {
  match: RegExp;
}

export interface NumberOption {
  match: RegExp;
}

export interface StringRule {
  t: 'string';
  type: string;
  match: string;
  push?: string;
  pop?: number;
  next?: string;
  chunk: string | null;
}

export interface RegexRule {
  t: 'regex';
  type: string;
  match: RegExp;
  push?: string;
  pop?: number;
  next?: string;
  lineBreaks?: true;
  chunk: string | null;
}

export interface FallbackRule {
  t: 'fallback';
  type: string;
  fallback: true;
  chunk: null;
}

export type LexerRule = StringRule | RegexRule | FallbackRule;

export type TokenName = string;
export type StateDefinition = Record<TokenName, LexerRule>;

export interface StatesMap {
  $: StateDefinition;
  [k: string]: StateDefinition;
}

export interface OrderedStatesMap {
  $: LexerRule[];
  [k: string]: LexerRule[];
}

export interface Lexer {
  reset(input?: string): Lexer;
  [Symbol.iterator](): Iterator<Token, null>;
}

export interface TokenBase {
  value: string;
  offset: number;
  line: number;
  col: number;
  lineBreaks: number;
}

export interface NewlineToken extends TokenBase {
  type: 'newline';
}

export interface WhitespaceToken extends TokenBase {
  type: 'whitespace';
}

export interface BracketLeftToken extends TokenBase {
  type: 'bracket-left';
}

export interface BracketRightToken extends TokenBase {
  type: 'bracket-right';
}

export interface CommentToken extends TokenBase {
  type: 'comment';
}

export interface OperatorToken extends TokenBase {
  type: 'operator';
}

export interface StringStartToken extends TokenBase {
  type: 'string-start';
}

export interface StringValueToken extends TokenBase {
  type: 'string-value';
}

export interface StringEndToken extends TokenBase {
  type: 'string-end';
}

export interface TemplateStartToken extends TokenBase {
  type: 'template-start';
}

export interface TemplateEndToken extends TokenBase {
  type: 'template-end';
}

export interface SymbolToken extends TokenBase {
  type: 'symbol';
}

export interface NumberToken extends TokenBase {
  type: 'number';
}

export interface UnknownToken extends TokenBase {
  type: '_';
}

export interface StartToken extends TokenBase {
  type: '_start';
}

export interface EndToken extends TokenBase {
  type: '_end';
}

export type Token =
  | NewlineToken
  | WhitespaceToken
  | BracketLeftToken
  | BracketRightToken
  | CommentToken
  | OperatorToken
  | StringStartToken
  | StringValueToken
  | StringEndToken
  | TemplateStartToken
  | TemplateEndToken
  | SymbolToken
  | NumberToken
  | UnknownToken
  | StartToken
  | EndToken;

export type MinorToken = NewlineToken | WhitespaceToken | CommentToken;

export interface LexerConfig {
  joinLines: string | null;
  comments: CommentOption[];
  symbols: RegExp;
  numbers: RegExp;
  operators: OperatorOption[];
  brackets: BracketOption[];
  strings: StringOption[];
}
