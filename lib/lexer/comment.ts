import type { RegexRule, StateDefinition, StatesMap } from './rules';
import { sortStateRules } from './rules';
import type { OptionBase } from './types';

export interface LineCommentOption extends OptionBase {
  t: 'line-comment';
}

export interface MultilineCommentOption extends OptionBase {
  t: 'multiline-comment';
  endsWith: string;
}

export type CommentOption = LineCommentOption | MultilineCommentOption;

export function esc(input: string): string {
  return input.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
}

export function configComments(
  states: StatesMap,
  opts: CommentOption[]
): StatesMap {
  const commentRules: StateDefinition = {};
  opts.forEach((option, idx) => {
    const tokenName = `comment$${idx}`;
    const start = esc(option.startsWith);
    if (option.t === 'line-comment') {
      const anyChars = '.*?';
      const rule: RegexRule = {
        t: 'regex',
        match: new RegExp(`${start}${anyChars}$`),
      };
      commentRules[tokenName] = rule;
    } else if (option.t === 'multiline-comment') {
      const anyChars = '[^]*?';
      const end = esc(option.endsWith);
      const rule: RegexRule = {
        t: 'regex',
        match: new RegExp(`${start}${anyChars}${end}`),
        lineBreaks: true,
      };
      commentRules[tokenName] = rule;
    }
  });

  return {
    ...states,
    $: sortStateRules({
      ...states.$,
      ...commentRules,
    }),
  };
}
